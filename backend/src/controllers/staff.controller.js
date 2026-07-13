const prisma = require('../config/database');
const bookingService = require('../services/booking.service');

// 0️⃣ PUBLIC ENDPOINTS
const getRecommendedStaff = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Fetch some staff members with their user info and company info
    const staff = await prisma.companyStaff.findMany({
      where: { status: 'active' },
      take: limit,
      include: {
        user: {
          select: {
            fullName: true,
            avatar: true,
          }
        },
        company: {
          select: {
            name: true,
            city: true,
            coverImageUrl: true,
          }
        }
      }
    });

    // Map to format expected by frontend
    const formattedStaff = staff.map((s, index) => ({
      id: s.id.toString(),
      name: s.user?.fullName || 'Professional',
      title: s.role === 'supervisor' ? 'Supervisor' : 'Professional',
      tagline: 'Reliable and professional service.',
      price: '$50/hr', // Mock data since it's not in schema yet
      rating: 4.8 + (index % 3) * 0.1, // Mock rating
      reviews: 100 + index * 15,
      jobsDone: 300 + index * 50,
      location: s.company?.city || 'Local',
      skills: ['Professional', 'Experienced'],
      avatar: s.user?.avatar,
      available: true,
      bannerImg: s.company?.coverImageUrl || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=700&fit=crop',
    }));

    res.json({ staff: formattedStaff });
  } catch (error) {
    console.error('Error fetching recommended staff:', error);
    res.status(500).json({ error: 'Failed to fetch recommended staff' });
  }
};

// 1️⃣ CURRENT STAFF PROFILE (for staff dashboard/profile pages)
const getStaffMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const staff = await prisma.companyStaff.findFirst({
      where: { userId, status: 'active' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        company: {
          select: { id: true, name: true },
        },
      },
    });
    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }
    const completedBookings = await prisma.booking.findMany({
      where: {
        assignedStaffId: staff.id,
        status: 'completed',
      },
      select: {
        totalPrice: true,
        companyEarnings: true,
      },
    });
    const completedCount = completedBookings.length;
    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + Number(b.companyEarnings || 0),
      0
    );
    const reviews = await prisma.review.findMany({
      where: { staffId: staff.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { fullName: true } },
      },
    });
    res.json({
      staff: {
        id: staff.id.toString(),
        userId: staff.userId.toString(),
        companyId: staff.companyId.toString(),
        role: staff.role,
        user: staff.user,
        company: staff.company,
      },
      stats: {
        completedBookingsCount: completedCount,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
      },
      recentReviews: reviews,
    });
  } catch (error) {
    console.error('Error fetching staff me:', error);
    res.status(500).json({ error: 'Failed to fetch staff profile' });
  }
};

// 1️⃣ AVAILABILITY CONTROLLERS
const getMyAvailability = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Find staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }

    // 2️⃣ Fetch availability
    const availability = await prisma.availabilitySlot.findMany({
      where: {
        staffId: staff.id,
        isAvailable: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({ availability });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};


const createAvailability = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, startTime, endTime } = req.body;

    // 1️⃣ Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff profile not found' });
    }

    // 2️⃣ Validate input
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3️⃣ Prevent overlap
    const overlap = await prisma.availabilitySlot.findFirst({
      where: {
        companyId: staff.companyId,
        staffId: staff.id,
        date: new Date(date),
        isAvailable: true,
        startTime: { lt: new Date(`${date}T${endTime}`) },
        endTime: { gt: new Date(`${date}T${startTime}`) }
      }
    });

    if (overlap) {
      return res.status(400).json({ error: 'Overlapping availability slot' });
    }

    // 4️⃣ Create slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        companyId: staff.companyId,
        staffId: staff.id,
        date: new Date(date),
        startTime: new Date(`${date}T${startTime}`),
        endTime: new Date(`${date}T${endTime}`),
        isAvailable: true
      }
    });

    res.status(201).json({ slot });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({ error: 'Failed to create availability' });
  }
};


const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, startTime, endTime } = req.body;

    // Check if availability exists and belongs to this user's staff profile
    const existing = await prisma.availabilitySlot.findFirst({
      where: {
        id: BigInt(id),
        staff: {
          userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    // Build update data with proper date/time conversion
    const updateData = {};

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (startTime) {
      const dateStr = date || existing.date.toISOString().split('T')[0];
      updateData.startTime = new Date(`${dateStr}T${startTime}`);
    }

    if (endTime) {
      const dateStr = date || existing.date.toISOString().split('T')[0];
      updateData.endTime = new Date(`${dateStr}T${endTime}`);
    }

    const availability = await prisma.availabilitySlot.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    res.json({ availability });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

const deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership through staff relation
    const existing = await prisma.availabilitySlot.findFirst({
      where: {
        id: BigInt(id),
        staff: {
          userId
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Availability not found' });
    }

    await prisma.availabilitySlot.update({
      where: { id: BigInt(id) },
      data: { isAvailable: false }
    });

    res.json({ message: 'Availability deleted' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ error: 'Failed to delete availability' });
  }
};


// 2️⃣ SERVICE REQUEST CONTROLLERS

const getPendingServices = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get staff
    const staff = await prisma.companyStaff.findFirst({
      where: { userId, status: 'active' }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }

    // Pending service requests assigned to this staff (to approve/reject)
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        assignedStaffId: staff.id,
        status: 'pending'
      },
      include: {
        service: {
          select: { id: true, name: true, basePrice: true }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true
          }
        },
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Keep key 'pendingBookings' for frontend compatibility; values are service requests
    res.json({ pendingBookings: serviceRequests, serviceRequests });
  } catch (error) {
    console.error('Error fetching pending services:', error);
    res.status(500).json({ error: 'Failed to fetch pending services' });
  }
};


const approveService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      },
      select: { id: true, userId: true }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id: BigInt(id),
        assignedStaffId: staff.id,
        status: 'pending'
      },
      include: {
        service: true
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    // Perform transaction: Update Request -> Create Booking -> Create Logs
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Service Request
      const updatedService = await tx.serviceRequest.update({
        where: { id: BigInt(id) },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: staff.id
        }
      });

      // 2. Calculate Booking Details
      const basePrice = Number(serviceRequest.service.basePrice);
      const durationMin = serviceRequest.service.durationMin || 60;

      // Calculate End Time
      // Note: startTime is a Date object (usually 1970-01-01 with time)
      const startTime = new Date(serviceRequest.requestedTime);
      const endTime = new Date(startTime.getTime() + durationMin * 60000);

      // Calculate Fees
      const PLATFORM_FEE_PERCENT = 10;
      const platformFee = Number((basePrice * PLATFORM_FEE_PERCENT) / 100).toFixed(2);
      const companyEarnings = Number(basePrice - platformFee).toFixed(2);
      const totalPrice = Number((basePrice + Number(platformFee)).toFixed(2));

      // 3. Create Booking
      const newBooking = await tx.booking.create({
        data: {
          customerId: serviceRequest.customerId,
          companyId: serviceRequest.companyId,
          serviceId: serviceRequest.serviceId,
          assignedStaffId: staff.id, // Assign to the approving staff
          bookingDate: serviceRequest.requestedDate,
          startTime: startTime,
          endTime: endTime,
          serviceAddress: serviceRequest.serviceAddress,
          latitude: serviceRequest.latitude,
          longitude: serviceRequest.longitude,
          status: 'confirmed', // Auto-confirm upon acceptance
          totalPrice: totalPrice,
          platformFee: platformFee,
          companyEarnings: companyEarnings,
          staffNotes: serviceRequest.notes
        }
      });

      // 4. Create Payment Record (Pending)
      await tx.payment.create({
        data: {
          bookingId: newBooking.id,
          userId: serviceRequest.customerId,
          amount: totalPrice,
          method: 'cash', // Default placeholder
          status: 'pending'
        }
      });

      // 5. Create Status Log
      await tx.bookingStatusLog.create({
        data: {
          bookingId: newBooking.id,
          oldStatus: 'pending',
          newStatus: 'confirmed',
          changedBy: staff.userId
        }
      });

      return { updatedService, newBooking };
    });

    res.json({
      message: 'Service approved and booking created successfully',
      service: result.updatedService,
      booking: result.newBooking
    });
  } catch (error) {
    console.error('Error approving service:', error);
    res.status(500).json({ error: 'Failed to approve service' });
  }
};

const rejectService = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    // Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      },
      select: { id: true }
    });

    if (!staff) {
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    const service = await prisma.serviceRequest.findFirst({
      where: {
        id: BigInt(id),
        assignedStaffId: staff.id,
        status: 'pending'
      }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    const updatedService = await prisma.serviceRequest.update({
      where: { id: BigInt(id) },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: staff.id,
        rejectionReason: reason || 'No reason provided'
      }
    });

    res.json({
      message: 'Service rejected',
      service: updatedService
    });
  } catch (error) {
    console.error('Error rejecting service:', error);
    res.status(500).json({ error: 'Failed to reject service' });
  }
};

// 3️⃣ BOOKING MANAGEMENT CONTROLLERS

const getStaffBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10, date } = req.query;

    // Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }

    // Only bookings assigned to this staff (my assigned jobs)
    const where = {
      assignedStaffId: staff.id
    };
    if (status) {
      where.status = status;
    }
    if (date) {
      const d = date === 'today' ? new Date() : new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.bookingDate = { gte: d, lt: next };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              name: true,
              description: true,
              basePrice: true,
              durationMin: true,
              durationMax: true
            }
          },
          customer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true
            }
          },
          assignedStaff: {
            select: {
              id: true,
              user: {
                select: { fullName: true }
              }
            }
          }
        },
        orderBy: [
          { bookingDate: 'asc' },
          { startTime: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      bookings,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: BigInt(id),
        assignedStaffId: staff.id
      },
      include: {
        service: {
          select: {
            name: true,
            description: true,
            basePrice: true,
            features: true,
            image: true,
            durationMin: true,
            durationMax: true,
            serviceType: {
              select: { name: true, slug: true }
            }
          }
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        company: true,
        assignedStaff: {
          select: {
            id: true,
            user: { select: { fullName: true, phone: true } }
          }
        },
        payment: true,
        cancellation: true,
        statusLogs: { orderBy: { changedAt: 'desc' } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch booking' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    // Get staff record
    const staff = await prisma.companyStaff.findFirst({
      where: { userId, status: 'active' }
    });

    if (!staff) {
      return res.status(403).json({ error: 'Staff record not found' });
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Only allow updates for bookings assigned to this staff
    const booking = await prisma.booking.findFirst({
      where: {
        id: BigInt(id),
        assignedStaffId: staff.id
      },
      include: { assignedStaff: true }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Use booking service for start/complete so actualStartTime, actualEndTime and notifications are set
    if (status === 'in_progress') {
      const updatedBooking = await bookingService.startJob(id, staff.id);
      return res.json({ message: 'Job started', booking: updatedBooking });
    }
    if (status === 'completed') {
      const updatedBooking = await bookingService.completeJob(id, staff.id);
      return res.json({ message: 'Job completed', booking: updatedBooking });
    }

    // Other transitions (e.g. cancelled): validate and update directly
    const allowedTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };
    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        error: `Cannot transition from ${booking.status} to ${status}`
      });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: BigInt(id) },
      data: { status, updatedAt: new Date() }
    });

    await prisma.bookingStatusLog.create({
      data: {
        bookingId: BigInt(id),
        oldStatus: booking.status,
        newStatus: status,
        changedBy: BigInt(userId),
        changedAt: new Date()
      }
    });

    res.json({
      message: 'Booking status updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    const message = error.message || 'Failed to update booking status';
    const code = error.message?.includes('not assigned') ? 403 : 500;
    res.status(code).json({ error: message });
  }
};

module.exports = {
  getRecommendedStaff,
  getStaffMe,
  getMyAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
  getPendingServices,
  approveService,
  rejectService,
  getStaffBookings,
  getBookingById,
  updateBookingStatus
};