// routes/serviceType.routes.js
const express = require('express');
const {
  getAllServiceTypes,
  getServiceTypesByCategory,
  getServiceTypeBySlug,
  createServiceType,
  updateServiceType,
  deleteServiceType
} = require('../controllers/serviceType.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheData, clearCache } = require('../middleware/cache.middleware');

const router = express.Router();

const clearServiceTypesCache = (req, res, next) => {
  clearCache('cache:/api/service-types*');
  next();
};

// Public routes
router.get('/', cacheData(3600), getAllServiceTypes);
router.get('/categories/:categorySlug', cacheData(3600), getServiceTypesByCategory);
router.get('/:slug', cacheData(3600), getServiceTypeBySlug);

// Admin only routes
router.post('/', authenticate, authorize('admin'), clearServiceTypesCache, createServiceType);
router.put('/:id', authenticate, authorize('admin'), clearServiceTypesCache, updateServiceType);
router.delete('/:id', authenticate, authorize('admin'), clearServiceTypesCache, deleteServiceType);

module.exports = router;