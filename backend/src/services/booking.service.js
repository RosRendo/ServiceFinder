/**
 * Booking Service
 * Contains all business logic for booking operations
 */

const prisma = require('../config/database');
const { validateTransition } = require('../utils/statusTransitions');

class BookingService {
    /**
     * Get booking by ID with full relations
     */
    async getById(id, userId = null, userRole = null) {
        const booking = await prisma.booking.findUnique({
            where: { id: BigInt(id) },
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
                        address: true,
                        ownerId: true,
                    },
                },
                service: {
                    include: {
                        serviceType: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
                assignedStaff: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                phone: true,
                                email: true,
                            },
                        },
                    },
                },
                payment: true,
                review: true,
                cancellation: true,
                statusLogs: {
                    orderBy: { changedAt: 'desc' },
                },
            },
        });

        if (!booking) {
            return null;
        }

        // Check access rights
        if (userId && userRole === 'customer' && booking.customerId !== userId) {
            throw new Error('Access denied');
        }

        return booking;
    }

    /**
     * Assign staff to a booking
     */
    async assignStaff(bookingId, staffId, companyAdminId) {
        // Verify booking
        const booking = await this.getById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify booking is in confirmed status
        if (booking.status !== 'confirmed') {
            throw new Error('Can only assign staff to confirmed bookings');
        }

        // Verify staff exists and belongs to the company
        const staff = await prisma.companyStaff.findFirst({
            where: {
                id: BigInt(staffId),
                companyId: booking.companyId,
                status: 'active',
            },
            include: {
                user: true,
            },
        });

        if (!staff) {
            throw new Error('Staff not found or not active in this company');
        }

        // Assign staff
        const updatedBooking = await prisma.$transaction(async (tx) => {
            // Update booking
            const updated = await tx.booking.update({
                where: { id: BigInt(bookingId) },
                data: {
                    assignedStaffId: BigInt(staffId),
                },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            // Create status log
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(bookingId),
                    oldStatus: booking.status,
                    newStatus: booking.status, // Status doesn't change, but log assignment
                    changedBy: companyAdminId,
                },
            });

            // Create notification for staff
            await tx.notification.create({
                data: {
                    userId: staff.userId,
                    title: 'New Job Assignment',
                    message: `You have been assigned to a ${updated.service.name} job on ${updated.bookingDate}`,
                    isRead: false,
                },
            });

            // Create notification for customer
            await tx.notification.create({
                data: {
                    userId: booking.customerId,
                    title: 'Staff Assigned',
                    message: `${staff.user.fullName} has been assigned to your booking`,
                    isRead: false,
                },
            });

            return updated;
        });

        return updatedBooking;
    }

    /**
     * Start a job (staff marks as in progress)
     */
    async startJob(bookingId, staffId) {
        const booking = await this.getById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify staff is assigned to this booking
        if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staffId.toString()) {
            throw new Error('You are not assigned to this booking');
        }

        // Validate status transition
        validateTransition(booking.status, 'in_progress');

        // Update booking
        const updatedBooking = await prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: BigInt(bookingId) },
                data: {
                    status: 'in_progress',
                    actualStartTime: new Date(),
                    progressPercent: 0,
                },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: true,
                },
            });

            // Create status log
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(bookingId),
                    oldStatus: booking.status,
                    newStatus: 'in_progress',
                    changedBy: booking.assignedStaff.userId,
                },
            });

            // Notify customer
            await tx.notification.create({
                data: {
                    userId: booking.customerId,
                    title: 'Service Started',
                    message: `Your ${booking.service.name} service has started`,
                    isRead: false,
                },
            });

            return updated;
        });

        return updatedBooking;
    }

    /**
     * Update job progress
     */
    async updateProgress(bookingId, staffId, progressPercent, staffNotes = null) {
        const booking = await this.getById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify staff is assigned
        if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staffId.toString()) {
            throw new Error('You are not assigned to this booking');
        }

        // Verify status is in_progress
        if (booking.status !== 'in_progress') {
            throw new Error('Can only update progress for in-progress bookings');
        }

        // Validate progress
        if (progressPercent < 0 || progressPercent > 100) {
            throw new Error('Progress must be between 0 and 100');
        }

        const updateData = { progressPercent };
        if (staffNotes !== null) {
            updateData.staffNotes = staffNotes;
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: BigInt(bookingId) },
            data: updateData,
            include: {
                customer: true,
                service: true,
                assignedStaff: true,
            },
        });

        // Notify customer of significant progress milestones
        if ([25, 50, 75].includes(progressPercent)) {
            await prisma.notification.create({
                data: {
                    userId: booking.customerId,
                    title: 'Service Progress Update',
                    message: `Your ${booking.service.name} service is ${progressPercent}% complete`,
                    isRead: false,
                },
            });
        }

        return updatedBooking;
    }

    /**
     * Complete a job
     */
    async completeJob(bookingId, staffId) {
        const booking = await this.getById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Verify staff is assigned
        if (!booking.assignedStaffId || booking.assignedStaffId.toString() !== staffId.toString()) {
            throw new Error('You are not assigned to this booking');
        }

        // Validate status transition
        validateTransition(booking.status, 'completed');

        const updatedBooking = await prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: BigInt(bookingId) },
                data: {
                    status: 'completed',
                    actualEndTime: new Date(),
                    progressPercent: 100,
                },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                    assignedStaff: true,
                    payment: true,
                },
            });

            // Create status log
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(bookingId),
                    oldStatus: booking.status,
                    newStatus: 'completed',
                    changedBy: booking.assignedStaff.userId,
                },
            });

            // If payment method is cash and still pending, mark as paid
            if (updated.payment && updated.payment.method === 'cash' && updated.payment.status === 'pending') {
                await tx.payment.update({
                    where: { id: updated.payment.id },
                    data: {
                        status: 'paid',
                        paidAt: new Date(),
                    },
                });
            }

            // Notify customer
            await tx.notification.create({
                data: {
                    userId: booking.customerId,
                    title: 'Service Completed',
                    message: `Your ${booking.service.name} service has been completed. Please leave a review!`,
                    isRead: false,
                },
            });

            return updated;
        });

        return updatedBooking;
    }

    /**
     * Update booking status with validation
     */
    async updateStatus(bookingId, newStatus, changedBy) {
        const booking = await this.getById(bookingId);
        if (!booking) {
            throw new Error('Booking not found');
        }

        // Validate transition
        validateTransition(booking.status, newStatus);

        const updatedBooking = await prisma.$transaction(async (tx) => {
            const updated = await tx.booking.update({
                where: { id: BigInt(bookingId) },
                data: { status: newStatus },
                include: {
                    customer: true,
                    company: true,
                    service: true,
                },
            });

            // Create status log
            await tx.bookingStatusLog.create({
                data: {
                    bookingId: BigInt(bookingId),
                    oldStatus: booking.status,
                    newStatus: newStatus,
                    changedBy: changedBy,
                },
            });

            return updated;
        });

        return updatedBooking;
    }
}

module.exports = new BookingService();
