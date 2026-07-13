/**
 * Review Service
 * Handles review creation with separate company and staff ratings
 */

const prisma = require('../config/database');

class ReviewService {
    /**
     * Create a review with separate company and staff ratings
     */
    async createReview({
        bookingId,
        customerId,
        companyRating,
        companyComment,
        staffRating,
        staffComment,
    }) {
        // Validate ratings
        if (companyRating < 1 || companyRating > 5) {
            throw new Error('Company rating must be between 1 and 5');
        }

        if (staffRating && (staffRating < 1 || staffRating > 5)) {
            throw new Error('Staff rating must be between 1 and 5');
        }

        // Verify booking
        const booking = await prisma.booking.findUnique({
            where: { id: BigInt(bookingId) },
            include: {
                assignedStaff: true,
            },
        });

        if (!booking) {
            throw new Error('Booking not found');
        }

        if (booking.customerId.toString() !== customerId.toString()) {
            throw new Error('Access denied');
        }

        if (booking.status !== 'completed') {
            throw new Error('Can only review completed bookings');
        }

        // Check if review already exists
        const existingReview = await prisma.review.findUnique({
            where: { bookingId: BigInt(bookingId) },
        });

        if (existingReview) {
            throw new Error('Review already exists for this booking');
        }

        // Create review
        const review = await prisma.$transaction(async (tx) => {
            const newReview = await tx.review.create({
                data: {
                    bookingId: BigInt(bookingId),
                    customerId: BigInt(customerId),
                    companyRating,
                    companyComment,
                    staffId: booking.assignedStaffId,
                    staffRating: staffRating || null,
                    staffComment: staffComment || null,
                },
                include: {
                    booking: {
                        include: {
                            service: true,
                            company: true,
                        },
                    },
                    staff: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            // Update company rating summary
            await this.updateCompanyRating(booking.companyId, tx);

            // Update staff rating summary if staff was rated
            if (booking.assignedStaffId && staffRating) {
                await this.updateStaffRating(booking.assignedStaffId, tx);
            }

            return newReview;
        });

        return review;
    }

    /**
     * Update a review
     */
    async updateReview(reviewId, customerId, updateData) {
        const review = await prisma.review.findUnique({
            where: { id: BigInt(reviewId) },
            include: { booking: true },
        });

        if (!review) {
            throw new Error('Review not found');
        }

        if (review.customerId.toString() !== customerId.toString()) {
            throw new Error('Access denied');
        }

        // Validate ratings if provided
        if (updateData.companyRating && (updateData.companyRating < 1 || updateData.companyRating > 5)) {
            throw new Error('Company rating must be between 1 and 5');
        }

        if (updateData.staffRating && (updateData.staffRating < 1 || updateData.staffRating > 5)) {
            throw new Error('Staff rating must be between 1 and 5');
        }

        const updatedReview = await prisma.$transaction(async (tx) => {
            const updated = await tx.review.update({
                where: { id: BigInt(reviewId) },
                data: updateData,
                include: {
                    booking: {
                        include: {
                            service: true,
                            company: true,
                        },
                    },
                    staff: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            // Update company rating summary
            await this.updateCompanyRating(review.booking.companyId, tx);

            // Update staff rating summary if applicable
            if (review.staffId) {
                await this.updateStaffRating(review.staffId, tx);
            }

            return updated;
        });

        return updatedReview;
    }

    /**
     * Update company rating summary
     */
    async updateCompanyRating(companyId, transaction = prisma) {
        const reviews = await transaction.review.findMany({
            where: {
                booking: {
                    companyId: companyId,
                },
            },
            select: {
                companyRating: true,
            },
        });

        const totalReviews = reviews.length;
        const averageRating =
            totalReviews > 0
                ? reviews.reduce((sum, r) => sum + r.companyRating, 0) / totalReviews
                : null;

        await transaction.companyRatingSummary.upsert({
            where: { companyId },
            create: {
                companyId,
                averageRating,
                totalReviews,
                lastUpdated: new Date(),
            },
            update: {
                averageRating,
                totalReviews,
                lastUpdated: new Date(),
            },
        });
    }

    /**
     * Update staff rating summary (new functionality)
     */
    async updateStaffRating(staffId, transaction = prisma) {
        const reviews = await transaction.review.findMany({
            where: {
                staffId: staffId,
                staffRating: {
                    not: null,
                },
            },
            select: {
                staffRating: true,
            },
        });

        const totalReviews = reviews.length;
        const averageRating =
            totalReviews > 0
                ? reviews.reduce((sum, r) => sum + (r.staffRating || 0), 0) / totalReviews
                : null;

        // Note: We would need a StaffRatingSummary table for this
        // For now, we'll just calculate it when needed
        return {
            averageRating,
            totalReviews,
        };
    }

    /**
     * Get reviews for a company with pagination
     */
    async getCompanyReviews(companyId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: {
                    booking: {
                        companyId: BigInt(companyId),
                    },
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                    booking: {
                        select: {
                            id: true,
                            bookingDate: true,
                            service: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    staff: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    fullName: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: parseInt(skip),
                take: parseInt(limit),
            }),
            prisma.review.count({
                where: {
                    booking: {
                        companyId: BigInt(companyId),
                    },
                },
            }),
        ]);

        return {
            reviews,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get reviews for a specific staff member
     */
    async getStaffReviews(staffId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where: {
                    staffId: BigInt(staffId),
                    staffRating: {
                        not: null,
                    },
                },
                include: {
                    customer: {
                        select: {
                            id: true,
                            fullName: true,
                            avatar: true,
                        },
                    },
                    booking: {
                        select: {
                            id: true,
                            bookingDate: true,
                            service: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: parseInt(skip),
                take: parseInt(limit),
            }),
            prisma.review.count({
                where: {
                    staffId: BigInt(staffId),
                    staffRating: {
                        not: null,
                    },
                },
            }),
        ]);

        // Calculate staff rating summary
        const staffRatingSummary = await this.updateStaffRating(staffId);

        return {
            reviews,
            ratingSummary: staffRatingSummary,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit),
            },
        };
    }
}

module.exports = new ReviewService();
