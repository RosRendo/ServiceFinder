const express = require('express');
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getReviewsByCompany,
  getReviewsByStaff,
} = require('../controllers/reviews.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// General review operations
router.get('/', getAllReviews);
router.get('/my', authenticate, getMyReviews);
router.get('/:id', getReviewById);
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

// Get reviews by company
router.get('/company/:companyId', getReviewsByCompany);

// Get reviews by staff member
router.get('/staff/:staffId', getReviewsByStaff);

module.exports = router;