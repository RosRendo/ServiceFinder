const prisma = require("../config/database");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder_key_to_prevent_crash");
const paypal = require("@paypal/checkout-server-sdk");

// Configure PayPal Environment
const clientId = process.env.PAYPAL_CLIENT_ID || "PAYPAL-SANDBOX-CLIENT-ID";
const clientSecret =
  process.env.PAYPAL_CLIENT_SECRET || "PAYPAL-SANDBOX-CLIENT-SECRET";
const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

const getAllPayments = async (req, res, next) => {
  try {
    const { userId, status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    if (req.user.role === "customer") {
      where.userId = req.user.id;
    } else if (userId) {
      where.userId = BigInt(userId);
    }

    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          booking: {
            include: {
              service: {
                select: {
                  name: true,
                },
              },
              company: {
                select: {
                  name: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { paidAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: BigInt(id) },
      include: {
        booking: {
          include: {
            service: true,
            company: true,
            customer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (req.user.role === "customer" && payment.userId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { bookingId, method, transactionRef } = req.body;

    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: BigInt(bookingId) },
    });

    if (existingPayment) {
      return res
        .status(400)
        .json({ error: "Payment already exists for this booking" });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: BigInt(bookingId),
        userId: req.user.id,
        method,
        amount: booking.totalPrice,
        status: "pending",
        transactionRef,
      },
      include: {
        booking: {
          include: {
            service: true,
            company: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Payment initiated successfully",
      payment,
    });
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, transactionRef } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: BigInt(id) },
    });

    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const updateData = { status };
    if (transactionRef) updateData.transactionRef = transactionRef;
    if (status === "paid") updateData.paidAt = new Date();

    const updatedPayment = await prisma.payment.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        booking: {
          include: {
            service: true,
            company: true,
          },
        },
      },
    });

    res.json({
      message: "Payment updated successfully",
      payment: updatedPayment,
    });
  } catch (error) {
    next(error);
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ error: "bookingId is required" });
    }

    const bookingIdBigInt = BigInt(bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingIdBigInt },
      include: { service: true, company: true, customer: true },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "This booking has already been processed",
      });
    }

    // Check if payment already exists and is paid
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: bookingIdBigInt },
    });

    if (existingPayment && existingPayment.status === "paid") {
      return res.status(400).json({
        error: "Payment already completed for this booking",
      });
    }

    // ✅ CRITICAL FIX: Convert to cents (Stripe requires smallest currency unit)
    // If your database stores in dollars, multiply by 100
    // If already in cents, use as-is

    // Calculate service fee in cents
    const serviceFeeInCents = Math.round(
      Number(booking.service.basePrice) * 100,
    );

    // Calculate platform fee in cents
    const platformFeeInCents = Math.round(Number(booking.platformFee) * 100);
    const totalPriceInCents = Math.round(Number(booking.totalPrice) * 100);


    // ✅ Create Stripe Checkout Session with amounts in cents
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: booking.service.name,
              description: `Cleaning service by ${booking.company.name}`,
              metadata: {
                bookingId: bookingId.toString(),
                companyName: booking.company.name,
              },
            },
            unit_amount: serviceFeeInCents, // ✅ In cents
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Platform Fee",
              description: "Service platform fee",
            },
            unit_amount: platformFeeInCents, // ✅ In cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}/payments/success?booking_id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
      // Redirect route for cancelled / failed / expired flows on the frontend
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled?booking_id=${bookingId}&reason=cancelled`,
      customer_email: booking.customer.email,
      client_reference_id: bookingId.toString(),
      metadata: {
        bookingId: bookingId.toString(),
        userId: req.user.id.toString(),
        customerName: booking.customer.fullName,
      },
    });

    // ✅ Create or update payment record
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionRef: session.id,
          status: "pending",
          method: "card",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: bookingIdBigInt,
          userId: req.user.id,
          method: "card",
          amount: Number(booking.totalPrice), // ✅ Store in dollars in DB
          status: "pending",
          transactionRef: session.id,
        },
      });
    }


    return res.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout session error:", error);
    return res.status(500).json({
      error: error.message || "Failed to create checkout session",
    });
  }
};

/**
 * Handle Stripe Webhook Events
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // ✅ Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle different event types
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      default:
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * ✅ Handle successful checkout session
 * This is triggered when customer completes Stripe Checkout
 */
const handleCheckoutSessionCompleted = async (session) => {
  try {

    const bookingId = BigInt(session.metadata.bookingId);
    const userId = BigInt(session.metadata.userId);

    // Update payment status to paid
    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        transactionRef: session.id,
      },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          paidAt: new Date(),
        },
      });
    }

    // Update booking status to confirmed
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "confirmed",
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: "Payment Successful",
        message: `Your payment for booking #${bookingId} has been confirmed.`,
        isRead: false,
      },
    });

  } catch (error) {
    console.error("Error handling checkout session completed:", error);
    throw error;
  }
};

/**
 * Handle expired checkout session
 */
const handleCheckoutSessionExpired = async (session) => {
  try {

    const bookingId = BigInt(session.metadata.bookingId);

    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        transactionRef: session.id,
      },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
        },
      });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "cancelled",
      },
    });

  } catch (error) {
    console.error("Error handling checkout session expired:", error);
    throw error;
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (paymentIntent) => {
};

/**
 * Handle failed payment intent
 */
const handlePaymentIntentFailed = async (paymentIntent) => {
  try {

    const payment = await prisma.payment.findFirst({
      where: {
        transactionRef: paymentIntent.id,
      },
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "failed",
        },
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "cancelled",
        },
      });
    }
  } catch (error) {
    console.error("Error handling payment failure:", error);
    throw error;
  }
};

/**
 * Complete payment for cash or wallet methods (non-Stripe)
 */
const completePayment = async (req, res, next) => {
  try {
    const { bookingId, method } = req.body;

    // Only allow cash or wallet methods through this endpoint
    if (method === "card") {
      return res.status(400).json({
        error: "Please use Stripe Checkout for card payments",
      });
    }

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: true,
        company: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "This booking has already been processed",
        currentStatus: booking.status,
      });
    }

    // ✅ Use transaction to ensure both payment and booking are updated together
    const result = await prisma.$transaction(async (tx) => {
      // Check for existing payment
      const existingPayment = await tx.payment.findUnique({
        where: { bookingId: BigInt(bookingId) },
      });

      // Create or update payment
      let payment;
      if (existingPayment) {
        payment = await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            method,
            status: method === "cash" ? "pending" : "paid",
            paidAt: method === "cash" ? null : new Date(),
          },
        });
      } else {
        payment = await tx.payment.create({
          data: {
            bookingId: BigInt(bookingId),
            userId: req.user.id,
            method,
            amount: booking.totalPrice,
            status: method === "cash" ? "pending" : "paid",
            paidAt: method === "cash" ? null : new Date(),
          },
        });
      }

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: BigInt(bookingId) },
        data: {
          status: "confirmed",
        },
      });

      // Create status log
      await tx.bookingStatusLog.create({
        data: {
          bookingId: BigInt(bookingId),
          oldStatus: "pending",
          newStatus: "confirmed",
          changedBy: req.user.id,
        },
      });

      let notificationMessage = `Your payment of $${booking.totalPrice} has been processed successfully.`;
      let notificationTitle = "Payment Successful";
      let responseMessage = "Payment completed successfully!";

      if (method === "cash") {
        notificationTitle = "Booking Confirmed";
        notificationMessage = `Your booking has been confirmed. Please pay $${booking.totalPrice} in cash when the service is provided.`;
        responseMessage = "Booking confirmed. Pay cash at service time.";
      } else if (method === "bank") {
        notificationTitle = "Bank Transfer Received";
        notificationMessage = `We have received your local bank transfer of $${booking.totalPrice} for booking #${bookingId}.`;
        responseMessage = "Bank transfer confirmed!";
      } else if (method === "paypal") {
        notificationTitle = "PayPal Payment Successful";
        notificationMessage = `Your PayPal payment of $${booking.totalPrice} has been processed completely.`;
        responseMessage = "PayPal payment completed successfully!";
      }

      // Create notification
      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: notificationTitle,
          message: notificationMessage,
          isRead: false,
        },
      });

      return { payment, booking: updatedBooking, responseMessage };
    });

    // ✅ Serialize BigInt to string before sending response
    res.json({
      success: true,
      message: result.responseMessage,
      payment: {
        id: result.payment.id.toString(),
        bookingId: result.payment.bookingId.toString(),
        userId: result.payment.userId.toString(),
        method: result.payment.method,
        amount: Number(result.payment.amount),
        status: result.payment.status,
        transactionRef: result.payment.transactionRef,
        paidAt: result.payment.paidAt,
      },
      booking: {
        id: result.booking.id.toString(),
        status: result.booking.status,
      },
    });
  } catch (error) {
    console.error("Complete payment error:", error);
    next(error);
  }
};

/**
 * ✅ SECURITY: Confirm Cash Received (called by COMPANY/STAFF only)
 *
 * For "pay at service" bookings, payment stays "pending" until the company
 * physically confirms receipt — preventing fraud from either side.
 */
const confirmCashReceived = async (req, res, next) => {
  try {
    const { bookingId, staffNotes } = req.body;

    const allowedRoles = ["company_admin", "staff", "admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Only company staff or administrators can confirm cash payments",
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        payment: true,
        company: true,
        customer: true,
      },
    });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (req.user.role === "company_admin") {
      const companyOfUser = await prisma.company.findUnique({
        where: { ownerId: req.user.id },
      });
      if (
        !companyOfUser ||
        companyOfUser.id.toString() !== booking.companyId.toString()
      ) {
        return res
          .status(403)
          .json({ error: "Access denied – not your company" });
      }
    }

    if (!booking.payment || booking.payment.method !== "cash") {
      return res
        .status(400)
        .json({ error: "No pending cash payment found for this booking" });
    }

    if (booking.payment.status === "paid") {
      return res.status(400).json({ error: "Cash payment already confirmed" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: "paid",
          paidAt: new Date(),
          transactionRef: `CASH-${bookingId}-${Date.now()}`,
        },
      });

      const updatedBooking = await tx.booking.update({
        where: { id: BigInt(bookingId) },
        data: {
          status: "completed",
          actualEndTime: new Date(),
          ...(staffNotes && { staffNotes }),
        },
      });

      await tx.bookingStatusLog.create({
        data: {
          bookingId: BigInt(bookingId),
          oldStatus: booking.status,
          newStatus: "completed",
          changedBy: req.user.id,
        },
      });

      await tx.notification.create({
        data: {
          userId: booking.customerId,
          title: "💵 Cash Payment Confirmed",
          message: `Your cash payment of $${booking.payment.amount} for booking #${bookingId} has been confirmed by ${booking.company.name}. Thank you!`,
          isRead: false,
        },
      });

      await tx.notification.create({
        data: {
          userId: req.user.id,
          title: "✅ Cash Collected",
          message: `Cash of $${booking.payment.amount} collected for booking #${bookingId} from ${booking.customer.fullName}.`,
          isRead: false,
        },
      });

      return { payment, booking: updatedBooking };
    });

    res.json({
      success: true,
      message: "Cash payment confirmed. Booking marked as completed.",
      payment: {
        id: result.payment.id.toString(),
        status: result.payment.status,
        paidAt: result.payment.paidAt,
        transactionRef: result.payment.transactionRef,
      },
      booking: {
        id: result.booking.id.toString(),
        status: result.booking.status,
      },
    });
  } catch (error) {
    console.error("Confirm cash received error:", error);
    next(error);
  }
};

/**
 * Create a PayPal Order
 */
const createPaypalOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: true,
        company: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "This booking has already been processed",
        currentStatus: booking.status,
      });
    }

    // PayPal API requires string amount. e.g "100.00"
    const totalAmount = Number(booking.totalPrice).toFixed(2);

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: bookingId.toString(),
          description: `Booking #${bookingId} - ${booking.service.name}`,
          amount: {
            currency_code: "USD",
            value: totalAmount,
          },
        },
      ],
      application_context: {
        return_url: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}/payments/success?method=paypal&booking_id=${bookingId}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled?booking_id=${bookingId}&reason=cancelled`,
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    });

    const response = await paypalClient.execute(request);
    const orderID = response.result.id;

    // Find the approve link
    const approveLink = response.result.links.find(
      (link) => link.rel === "approve",
    );

    if (!approveLink) {
      throw new Error("Could not find PayPal approve link");
    }

    // Upsert Payment Record
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: BigInt(bookingId) },
    });

    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionRef: orderID,
          status: "pending",
          method: "paypal",
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: BigInt(bookingId),
          userId: req.user.id,
          method: "paypal",
          amount: booking.totalPrice,
          status: "pending",
          transactionRef: orderID,
        },
      });
    }

    res.json({
      success: true,
      orderId: orderID,
      url: approveLink.href,
    });
  } catch (error) {
    console.error("Create PayPal Order error:", error);
    res.status(500).json({ error: "Failed to create PayPal order" });
  }
};

/**
 * Capture a PayPal Order
 */
const capturePaypalOrder = async (req, res) => {
  try {
    const { orderID, bookingId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await paypalClient.execute(request);

    if (response.result.status === "COMPLETED") {
      // ✅ Use transaction to ensure both payment and booking are updated together
      const result = await prisma.$transaction(async (tx) => {
        // Update payment
        const existingPayment = await tx.payment.findFirst({
          where: { transactionRef: orderID },
        });

        let payment;
        if (existingPayment) {
          payment = await tx.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: "paid",
              paidAt: new Date(),
            },
          });
        } else {
          payment = await tx.payment.create({
            data: {
              bookingId: BigInt(bookingId),
              userId: req.user.id,
              method: "paypal",
              amount: response.result.purchase_units[0].amount.value,
              status: "paid",
              transactionRef: orderID,
              paidAt: new Date(),
            },
          });
        }

        // Update booking status
        const updatedBooking = await tx.booking.update({
          where: { id: BigInt(bookingId) },
          data: {
            status: "confirmed",
          },
        });

        // Create status log
        await tx.bookingStatusLog.create({
          data: {
            bookingId: BigInt(bookingId),
            oldStatus: "pending",
            newStatus: "confirmed",
            changedBy: req.user.id,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: req.user.id,
            title: "PayPal Payment Successful",
            message: `Your PayPal payment has been processed completely.`,
            isRead: false,
          },
        });

        return { payment, booking: updatedBooking };
      });

      res.json({
        success: true,
        message: "PayPal payment captured successfully!",
        payment: {
          id: result.payment.id.toString(),
          bookingId: result.payment.bookingId.toString(),
          status: result.payment.status,
        },
      });
    } else {
      res.status(400).json({ error: "Payment was not completed" });
    }
  } catch (error) {
    console.error("Capture PayPal Order error:", error);
    res.status(500).json({ error: "Failed to capture PayPal order" });
  }
};

/**
 * Create Cryptmus Payment
 */
const createCryptmusPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const {
      createCryptmusPayment: initCryptmusPayment,
    } = require("../config/cryptmus");

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: true,
        company: true,
        customer: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "This booking has already been processed",
        currentStatus: booking.status,
      });
    }

    // Check if payment already exists and is paid
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: BigInt(bookingId) },
    });

    if (existingPayment && existingPayment.status === "paid") {
      return res.status(400).json({
        error: "Payment already completed for this booking",
      });
    }

    // Create Cryptmus payment
    const cryptmusPayment = await initCryptmusPayment({
      bookingId,
      amount: Number(booking.totalPrice),
      currency: "USD",
      serviceName: booking.service.name,
      customerEmail: booking.customer.email,
      customerName: booking.customer.fullName,
      returnUrl: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}?payment=success`,
      cancelUrl: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}?payment=cancelled`,
    });

    // Create or update payment record
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionRef: cryptmusPayment.paymentId,
          status: "pending",
          method: "crypto",
          metadata: JSON.stringify({
            provider: "cryptmus",
            paymentId: cryptmusPayment.paymentId,
            initiatedAt: new Date().toISOString(),
          }),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: BigInt(bookingId),
          userId: req.user.id,
          method: "crypto",
          amount: booking.totalPrice,
          status: "pending",
          transactionRef: cryptmusPayment.paymentId,
          metadata: JSON.stringify({
            provider: "cryptmus",
            paymentId: cryptmusPayment.paymentId,
            initiatedAt: new Date().toISOString(),
          }),
        },
      });
    }

    res.json({
      success: true,
      paymentId: cryptmusPayment.paymentId,
      paymentUrl: cryptmusPayment.paymentUrl,
      amount: Number(booking.totalPrice),
      currency: "USD",
    });
  } catch (error) {
    console.error("Cryptmus Payment creation error:", error);
    res.status(500).json({
      error: error.message || "Failed to create Cryptmus payment",
    });
  }
};

/**
 * Handle Cryptmus Webhook
 */
const handleCryptmusWebhook = async (req, res) => {
  try {
    const { verifyCryptmusWebhook } = require("../config/cryptmus");
    const signature = req.headers["x-cryptmus-signature"];
    const payload = req.body;

    // Verify webhook signature
    const isValid = verifyCryptmusWebhook(payload, signature);

    if (!isValid) {
      console.error("Invalid Cryptmus webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { uuid, status, order_id } = payload;

    if (status === "paid" || status === "success") {
      // Find payment by transaction ref
      const payment = await prisma.payment.findFirst({
        where: {
          transactionRef: uuid,
        },
        include: {
          booking: true,
          user: true,
        },
      });

      if (!payment) {
        console.warn("Payment not found for Cryptmus webhook:", uuid);
        return res.status(404).json({ error: "Payment not found" });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          metadata: JSON.stringify({
            ...JSON.parse(payment.metadata || "{}"),
            confirmedAt: new Date().toISOString(),
            cryptmusStatus: status,
          }),
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "confirmed",
          paymentStatus: "paid",
        },
      });

    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cryptmus webhook error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * Check Cryptmus payment status
 */
const getCryptmusPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { getPaymentStatus } = require("../config/cryptmus");

    const status = await getPaymentStatus(paymentId);

    res.json({
      success: true,
      status: status.status,
      amount: status.amount,
      currency: status.currency,
    });
  } catch (error) {
    console.error("Cryptmus status check error:", error);
    res.status(500).json({ error: "Failed to check payment status" });
  }
};

/**
 * Create Binance Pay Order
 */
const createBinanceOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const { createBinancePayOrder } = require("../config/binance");

    // Verify booking
    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(bookingId) },
      include: {
        service: true,
        company: true,
        customer: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customerId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        error: "This booking has already been processed",
        currentStatus: booking.status,
      });
    }

    // Check if payment already exists and is paid
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId: BigInt(bookingId) },
    });

    if (existingPayment && existingPayment.status === "paid") {
      return res.status(400).json({
        error: "Payment already completed for this booking",
      });
    }

    // Create Binance Pay order
    const binanceOrderData = await createBinancePayOrder({
      bookingId,
      amount: Number(booking.totalPrice),
      serviceName: booking.service.name,
      customerEmail: booking.customer.email,
      customerName: booking.customer.fullName,
      returnUrl: `${process.env.FRONTEND_URL}/customer/bookings/${bookingId}/payments/success?method=binance&booking_id=${bookingId}`,
      cancelUrl: `${process.env.FRONTEND_URL}/payment/cancelled?booking_id=${bookingId}&reason=cancelled`,
    });

    // Create or update payment record
    if (existingPayment) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionRef: binanceOrderData.orderId,
          status: "pending",
          method: "crypto",
          metadata: JSON.stringify({
            prepayId: binanceOrderData.orderId,
            qrCode: binanceOrderData.qrCodeUrl,
          }),
        },
      });
    } else {
      await prisma.payment.create({
        data: {
          bookingId: BigInt(bookingId),
          userId: req.user.id,
          method: "crypto",
          amount: booking.totalPrice,
          status: "pending",
          transactionRef: binanceOrderData.orderId,
          metadata: JSON.stringify({
            prepayId: binanceOrderData.orderId,
            qrCode: binanceOrderData.qrCodeUrl,
          }),
        },
      });
    }

    res.json({
      success: true,
      orderId: binanceOrderData.orderId,
      checkoutUrl: binanceOrderData.checkoutUrl,
      qrCode: binanceOrderData.qrCodeUrl,
      amount: Number(booking.totalPrice),
      currency: "USD",
    });
  } catch (error) {
    console.error("Binance Pay Order creation error:", error);
    res.status(500).json({
      error: error.message || "Failed to create Binance Pay order",
    });
  }
};

/**
 * Handle Binance Pay Webhook
 */
const handleBinanceWebhook = async (req, res) => {
  try {
    const { verifyBinanceWebhook } = require("../config/binance");
    const timestamp = req.headers["binancepay-timestamp"];
    const nonce = req.headers["binancepay-nonce"];
    const signature = req.headers["binancepay-signature"];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyBinanceWebhook(payload, timestamp, nonce, signature);

    if (!isValid) {
      console.error("Invalid Binance webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { data } = req.body;

    if (data.status === "PAID" || data.status === "SUCCESS") {
      // Use transaction to ensure both payment and booking are updated together
      const result = await prisma.$transaction(async (tx) => {
        // Find payment by transaction reference
        const payment = await tx.payment.findFirst({
          where: {
            transactionRef: data.prepayId,
          },
          include: {
            booking: true,
          },
        });

        if (!payment) {
          throw new Error(`Payment not found for prepayId: ${data.prepayId}`);
        }

        // Update payment status to paid
        const updatedPayment = await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "paid",
            paidAt: new Date(),
            metadata: JSON.stringify({
              ...JSON.parse(payment.metadata || "{}"),
              webhookData: data,
              paidWith: data.cryptoCurrency || "CRYPTO",
            }),
          },
        });

        // Update booking status to confirmed
        const updatedBooking = await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: "confirmed",
          },
        });

        // Create status log
        await tx.bookingStatusLog.create({
          data: {
            bookingId: payment.bookingId,
            oldStatus: "pending",
            newStatus: "confirmed",
            changedBy: payment.userId,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId: payment.userId,
            title: "💰 Crypto Payment Successful!",
            message: `Your crypto payment of $${payment.amount} for booking #${payment.bookingId} has been confirmed. Your booking is now confirmed!`,
            isRead: false,
          },
        });

        return { payment: updatedPayment, booking: updatedBooking };
      });

      // Return success response
      return res.json({
        success: true,
        message: "Payment confirmed successfully",
        data: {
          bookingId: result.booking.id.toString(),
          paymentId: result.payment.id.toString(),
          status: result.booking.status,
        },
      });
    } else if (data.status === "CANCELED" || data.status === "EXPIRED") {
      // Handle payment cancellation/expiration
      const payment = await prisma.payment.findFirst({
        where: { transactionRef: data.prepayId },
        include: { booking: true },
      });

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "failed" },
          });

          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "cancelled" },
          });
        });
      }

      return res.json({
        success: true,
        message: "Payment cancelled/expired",
      });
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("Binance webhook error:", error);
    res.status(500).json({
      error: error.message || "Webhook processing failed",
    });
  }
};

/**
 * Get Binance Pay Order Status
 */
const getBinanceOrderStatus = async (req, res) => {
  try {
    const { getBinancePayOrderStatus } = require("../config/binance");
    const { prepayId } = req.params;

    if (!prepayId) {
      return res.status(400).json({ error: "prepayId is required" });
    }

    const orderStatus = await getBinancePayOrderStatus(prepayId);

    res.json({
      success: true,
      status: orderStatus.status,
      data: orderStatus,
    });
  } catch (error) {
    console.error("Get order status error:", error);
    res.status(500).json({
      error: error.message || "Failed to get order status",
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  createCheckoutSession,
  handleStripeWebhook,
  completePayment,
  confirmCashReceived,
  createPaypalOrder,
  capturePaypalOrder,
  createCryptmusPayment,
  handleCryptmusWebhook,
  getCryptmusPaymentStatus,
  createBinanceOrder,
  handleBinanceWebhook,
  getBinanceOrderStatus,
};
