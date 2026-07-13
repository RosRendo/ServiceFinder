const axios = require("axios");
const crypto = require("crypto");

const CRYPTMUS_API_KEY = process.env.CRYPTMUS_API_KEY;
const CRYPTMUS_MERCHANT_ID = process.env.CRYPTMUS_MERCHANT_ID;
const CRYPTMUS_URL = "https://api.cryptomus.com/v1";

/**
 * Generate Cryptomus request signature
 */
const generateSign = (payload) => {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  return crypto
    .createHash("md5")
    .update(base64Payload + CRYPTMUS_API_KEY)
    .digest("hex");
};

/**
 * Create Cryptmus payment
 */
const createCryptmusPayment = async (options) => {
  const {
    bookingId,
    amount,
    currency = "USD",
    serviceName,
    customerEmail,
    customerName,
    returnUrl,
    cancelUrl,
  } = options;

  try {
    const payload = {
      amount: String(amount),
      currency: currency,
      order_id: String(bookingId),
      url_callback: `${process.env.API_URL}/api/payments/cryptmus/webhook`,
      url_return: returnUrl,
      url_success: returnUrl,
      customer_email: customerEmail,
      customer_name: customerName,
      description: `Payment for ${serviceName}`,
      lifetime: 3600, // 1 hour expiry
    };

    const sign = generateSign(payload);

    const response = await axios.post(
      `${CRYPTMUS_URL}/payment`,
      payload,
      {
        headers: {
          merchant: CRYPTMUS_MERCHANT_ID,
          sign: sign,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.data && response.data.result && response.data.result.uuid) {
      return {
        paymentId: response.data.result.uuid,
        paymentUrl: response.data.result.url,
        amount: amount,
        currency: currency,
        status: "pending",
      };
    } else {
      throw new Error("Invalid Cryptomus response");
    }
  } catch (error) {
    console.error(
      "Cryptmus payment creation error:",
      error.response?.data || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Failed to create Cryptmus payment",
    );
  }
};

/**
 * Verify Cryptmus Webhook signature
 */
const verifyCryptmusWebhook = (payload, signature) => {
  try {
    const webhookSecret = process.env.CRYPTMUS_WEBHOOK_SECRET;
    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");

    return hash === signature;
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
};

/**
 * Get payment status from Cryptmus
 */
const getPaymentStatus = async (paymentId) => {
  try {
    const payload = {
      uuid: paymentId
    };
    
    const sign = generateSign(payload);
    
    const response = await axios.post(`${CRYPTMUS_URL}/payment/info`, payload, {
      headers: {
        merchant: CRYPTMUS_MERCHANT_ID,
        sign: sign,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      "Cryptmus status check error:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to check payment status");
  }
};

module.exports = {
  createCryptmusPayment,
  verifyCryptmusWebhook,
  getPaymentStatus,
};
