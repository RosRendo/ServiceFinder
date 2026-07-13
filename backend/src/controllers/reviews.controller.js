/**
 * Enhanced Reviews Controller
 * Uses service layer for business logic
 */

const prisma = require('../config/database');
const reviewService = require('../services/review.service');
const { formatDistanceToNow } = require('date-fns');

/**
 * Get my reviews (customer)
 */
const getMyReviews = async (req, res, next) => {
  try {
    const customerId = req.user.id;

    const reviews = await prisma.review.findMany({
      where: { customerId },
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
      orderBy: { createdAt: 'desc' },
    });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all reviews with pagination
 */
const getAllReviews = async (req, res, next) => {
  try {
    const { companyId, customerId, staffId, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (customerId) where.customerId = BigInt(customerId);
    if (staffId) where.staffId = BigInt(staffId);

    // Filter by company through booking relation
    let bookingWhere = {};
    if (companyId) bookingWhere.companyId = BigInt(companyId);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          ...where,
          booking: bookingWhere,
        },
        skip: parseInt(skip),
        take: parseInt(limit),
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
                  name: true,
                },
              },
              company: {
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
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({
        where: {
          ...where,
          booking: bookingWhere,
        },
      }),
    ]);

    res.json({
      reviews,
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
 * Get review by ID
 */
const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: BigInt(id) },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
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

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ review });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a review (Enhanced with separate company and staff ratings)
 */
const createReview = async (req, res, next) => {
  try {
    const {
      bookingId,
      companyRating,
      companyComment,
      staffRating,
      staffComment,
    } = req.body;

    // Validate required fields
    if (!companyRating) {
      return res.status(400).json({ error: 'Company rating is required' });
    }

    const review = await reviewService.createReview({
      bookingId,
      customerId: req.user.id,
      companyRating,
      companyComment,
      staffRating,
      staffComment,
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    if (
      error.message.includes('must be between') ||
      error.message.includes('already exists') ||
      error.message.includes('Can only review')
    ) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Booking not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Update a review
 */
const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      companyRating,
      companyComment,
      staffRating,
      staffComment,
    } = req.body;

    const updateData = {};
    if (companyRating !== undefined) updateData.companyRating = companyRating;
    if (companyComment !== undefined) updateData.companyComment = companyComment;
    if (staffRating !== undefined) updateData.staffRating = staffRating;
    if (staffComment !== undefined) updateData.staffComment = staffComment;

    const updatedReview = await reviewService.updateReview(
      id,
      req.user.id,
      updateData
    );

    res.json({
      success: true,
      message: 'Review updated successfully',
      review: updatedReview,
    });
  } catch (error) {
    if (error.message.includes('must be between')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Access denied') {
      return res.status(403).json({ error: error.message });
    }
    if (error.message === 'Review not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Delete and review
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: BigInt(id) },
      include: { booking: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.customerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.review.delete({
      where: { id: BigInt(id) },
    });

    // Update ratings
    await reviewService.updateCompanyRating(review.booking.companyId);
    if (review.staffId) {
      await reviewService.updateStaffRating(review.staffId);
    }

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a specific company
 */
const getReviewsByCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewService.getCompanyReviews(companyId, page, limit);

    // Format reviews with timeAgo
    const formattedReviews = result.reviews.map((review) => ({
      id: review.id.toString(),
      companyRating: review.companyRating,
      companyComment: review.companyComment,
      staffRating: review.staffRating,
      staffComment: review.staffComment,
      customer: review.customer,
      booking: review.booking,
      staff: review.staff,
      createdAt: review.createdAt,
      timeAgo: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
    }));

    res.json({
      ...result,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reviews for a specific staff member
 */
const getReviewsByStaff = async (req, res, next) => {
  try {
    const { staffId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await reviewService.getStaffReviews(staffId, page, limit);

    // Format reviews with timeAgo
    const formattedReviews = result.reviews.map((review) => ({
      id: review.id.toString(),
      staffRating: review.staffRating,
      staffComment: review.staffComment,
      companyRating: review.companyRating,
      companyComment: review.companyComment,
      customer: review.customer,
      booking: review.booking,
      createdAt: review.createdAt,
      timeAgo: formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }),
    }));

    res.json({
      ...result,
      reviews: formattedReviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getReviewsByCompany,
  getReviewsByStaff,
};