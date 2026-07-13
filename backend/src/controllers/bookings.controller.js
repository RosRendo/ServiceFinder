/**
 * Enhanced Bookings Controller
 * Uses service layer for business logic
 */

const bookingService = require('../services/booking.service');
const prisma = require('../config/database');
const { createNotification } = require('../utils/notifications');

/**
 * Get all bookings with pagination
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { customerId, companyId, status, staffId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};

    // Regular users can only see their own bookings
    if (req.user.role === 'customer') {
      where.customerId = req.user.id;
    } else if (customerId) {
      where.customerId = BigInt(customerId);
    }

    // Filter by company
    if (companyId) where.companyId = BigInt(companyId);

    // Filter by status
    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    // Filter by assigned staff
    if (staffId) where.assignedStaffId = BigInt(staffId);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              basePrice: true,
              durationMin: true,
            },
          },
          assignedStaff: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phone: true,
                },
              },
            },
          },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
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

/**
 * Get booking by ID
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.getById(
      id,
      req.user.id,
      req.user.role
    );

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: 'Access denied' });
    }
    next(error);
  }
};

/**
 * Create a new booking
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      companyId,
      serviceId,
      bookingDate,
      startTime,
      endTime,
      serviceAddress,
      latitude,
      longitude,
    } = req.body;

    // Get service for price calculation
    const service = await prisma.service.findUnique({
      where: { id: BigInt(serviceId) },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (!service.isActive) {
      return res.status(400).json({ error: 'Service is not available' });
    }

    // Build start time
    const start = new Date(`${bookingDate}T${startTime}:00Z`);

    // Calculate end time using service.durationMin
    const end = new Date(start.getTime() + service.durationMin * 60000);

    const PLATFORM_FEE_PERCENT = 10;
    const basePrice = Number(service.basePrice);
    const platformFee = Number((basePrice * PLATFORM_FEE_PERCENT) / 100).toFixed(2);
    const companyEarnings = Number(basePrice - platformFee).toFixed(2);
    const totalPrice = Number((basePrice + Number(platformFee)).toFixed(2));

    const booking = await prisma.booking.create({
      data: {
        customerId: req.user.id,
        companyId: BigInt(companyId),
        serviceId: BigInt(serviceId),
        bookingDate: new Date(bookingDate),
        startTime: start,
        endTime: end,
        serviceAddress,
        latitude,
        longitude,
        totalPrice: totalPrice,
        platformFee,
        companyEarnings,
        status: 'pending',
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        service: true,
      },
    });

    // Create status log
    await prisma.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        newStatus: 'pending',
        changedBy: req.user.id,
      },
    });

    // Notify company owner
    if (booking.company && booking.company.ownerId) {
      await createNotification(
        booking.company.ownerId,
        'New Booking Received',
        `You have a new booking from ${booking.customer.fullName} for ${booking.service.name}.`,
        'booking',
        `/company/bookings/${booking.id}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        id: booking.id.toString(),
        customerId: booking.customerId.toString(),
        companyId: booking.companyId.toString(),
        serviceId: booking.serviceId.toString(),
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        serviceAddress: booking.serviceAddress,
        latitude: booking.latitude,
        longitude: booking.longitude,
        basePrice: basePrice,
        totalPrice: Number(booking.totalPrice),
        platformFee: Number(booking.platformFee),
        companyEarnings: Number(booking.companyEarnings),
        status: booking.status,
        customer: booking.customer,
        company: booking.company,
        service: booking.service,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update booking status (generic - use specific endpoints when possible)
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedBooking = await bookingService.updateStatus(
      id,
      status,
      req.user.id
    );

    // Notify customer
    if (updatedBooking.customerId) {
      await createNotification(
        updatedBooking.customerId,
        'Booking Status Updated',
        `Your booking #${updatedBooking.id} status is now: ${status.replace('_', ' ')}`,
        'booking',
        `/customer/bookings/${updatedBooking.id}`
      );
    }

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error.message.includes('Invalid status transition')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Assign staff to booking (Company Admin only)
 */
const assignStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: 'staffId is required' });
    }

    const booking = await bookingService.assignStaff(id, staffId, req.user.id);

    // Get staff's user ID to notify them
    if (booking.assignedStaff && booking.assignedStaff.userId) {
      await createNotification(
        booking.assignedStaff.userId,
        'New Job Assignment',
        `You have been assigned to a new booking #${booking.id}.`,
        'booking',
        `/staff/bookings/${booking.id}`
      );
    }

    res.json({
      success: true,
      message: 'Staff assigned successfully',
      booking,
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('only assign')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Start job (Staff only)
 */
const startJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get staff ID from user
    const staff = await prisma.companyStaff.findFirst({
      where: { userId: req.user.id },
    });

    if (!staff) {
      return res.status(403).json({ error: 'You are not registered as staff' });
    }

    const booking = await bookingService.startJob(id, staff.id);

    // Notify customer
    if (booking.customerId) {
      await createNotification(
        booking.customerId,
        'Staff is on the way/started',
        `Your assigned staff has started the job for booking #${booking.id}.`,
        'booking',
        `/customer/bookings/${booking.id}`
      );
    }

    res.json({
      success: true,
      message: 'Job started successfully',
      booking,
    });
  } catch (error) {
    if (
      error.message.includes('not assigned') ||
      error.message.includes('Invalid status transition')
    ) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Update job progress (Staff only)
 */
const updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progressPercent, staffNotes } = req.body;

    // Validate progressPercent
    if (progressPercent === undefined || progressPercent < 0 || progressPercent > 100) {
      return res.status(400).json({ error: 'progressPercent must be between 0 and 100' });
    }

    // Get staff ID from user
    const staff = await prisma.companyStaff.findFirst({
      where: { userId: req.user.id },
    });

    if (!staff) {
      return res.status(403).json({ error: 'You are not registered as staff' });
    }

    const booking = await bookingService.updateProgress(
      id,
      staff.id,
      progressPercent,
      staffNotes
    );

    res.json({
      success: true,
      message: 'Progress updated successfully',
      booking,
    });
  } catch (error) {
    if (error.message.includes('not assigned') || error.message.includes('only update')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Complete job (Staff only)
 */
const completeJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get staff ID from user
    const staff = await prisma.companyStaff.findFirst({
      where: { userId: req.user.id },
    });

    if (!staff) {
      return res.status(403).json({ error: 'You are not registered as staff' });
    }

    const booking = await bookingService.completeJob(id, staff.id);

    // Notify customer
    if (booking.customerId) {
      await createNotification(
        booking.customerId,
        'Job Completed',
        `Your booking #${booking.id} has been marked as completed. Please leave a review!`,
        'booking',
        `/customer/bookings/${booking.id}`
      );
    }

    res.json({
      success: true,
      message: 'Job completed successfully',
      booking,
    });
  } catch (error) {
    if (
      error.message.includes('not assigned') ||
      error.message.includes('Invalid status transition')
    ) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Cancel booking
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: BigInt(id) },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    // Use service to update status (validates transition)
    const updatedBooking = await bookingService.updateStatus(
      id,
      'cancelled',
      req.user.id
    );

    // Create cancellation record
    await prisma.cancellation.create({
      data: {
        bookingId: BigInt(id),
        cancelledBy: req.user.id,
        reason,
      },
    });

    // Notify the other party
    if (req.user.role === 'customer') {
      // Notify company
      if (updatedBooking.company && updatedBooking.company.ownerId) {
        await createNotification(
          updatedBooking.company.ownerId,
          'Booking Cancelled',
          `${req.user.fullName || 'Customer'} has cancelled booking #${id}. Reason: ${reason || 'None provided'}`,
          'booking',
          `/company/bookings/${id}`
        );
      }
    } else {
      // Notify customer
      if (updatedBooking.customerId) {
        await createNotification(
          updatedBooking.customerId,
          'Booking Cancelled',
          `Your booking #${id} has been cancelled by the service provider.`,
          'booking',
          `/customer/bookings/${id}`
        );
      }
    }

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    if (error.message.includes('Invalid status transition')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Get staff's assigned bookings
 */
const getMyAssignedBookings = async (req, res, next) => {
  try {
    // Get staff record for current user
    const staff = await prisma.companyStaff.findFirst({
      where: { userId: req.user.id },
    });

    if (!staff) {
      return res.status(403).json({ error: 'You are not registered as staff' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      assignedStaffId: staff.id,
    };

    if (status) {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          service: true,
          payment: true,
        },
        orderBy: { bookingDate: 'asc' },
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      bookings,
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

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  assignStaff,
  startJob,
  updateProgress,
  completeJob,
  cancelBooking,
  getMyAssignedBookings,
};
