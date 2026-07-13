// routes/category.routes.js
const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheData, clearCache } = require('../middleware/cache.middleware');

const router = express.Router();

const clearCategoryCache = (req, res, next) => {
  clearCache('cache:/api/categories*');
  next();
};

// Public routes
router.get('/', cacheData(3600), getAllCategories);
router.get('/:slug', cacheData(3600), getCategoryBySlug);

// Admin only routes
router.post('/', authenticate, authorize('admin'), clearCategoryCache, createCategory);
router.put('/:id', authenticate, authorize('admin'), clearCategoryCache, updateCategory);
router.delete('/:id', authenticate, authorize('admin'), clearCategoryCache, deleteCategory);

module.exports = router;