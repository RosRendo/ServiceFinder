const express = require('express');
const router = express.Router();
const { getRecommendedStaff, getStaffMe, getMyAvailability, createAvailability, updateAvailability, deleteAvailability, getPendingServices, approveService, rejectService, getStaffBookings, getBookingById, updateBookingStatus } = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth');

// 0️⃣ PUBLIC ROUTES
router.get('/recommended', getRecommendedStaff);

// 1️⃣ CURRENT STAFF PROFILE (stats, reviews for profile page)
router.get('/me', authenticate, authorize('staff'), getStaffMe);

// 1️⃣ AVAILABILITY ROUTES
router.get('/availability/me',authenticate, authorize('staff') , getMyAvailability);
router.post('/availability',authenticate, authorize('staff') , createAvailability);
router.patch('/availability/:id',authenticate, authorize('staff') , updateAvailability);
router.delete('/availability/:id',authenticate, authorize('staff') , deleteAvailability);

// 2️⃣ SERVICE APPROVAL ROUTES
router.get('/services/pending',authenticate, authorize('staff') , getPendingServices);
router.patch('/services/:id/approve',authenticate, authorize('staff') , approveService);
router.patch('/services/:id/reject',authenticate, authorize('staff') , rejectService);

//  BOOKING MANAGEMENT ROUTES
router.get('/bookings', authenticate, authorize('staff') , getStaffBookings);
router.get('/bookings/:id', authenticate, authorize('staff') , getBookingById);
router.patch('/bookings/:id/status', authenticate, authorize('staff') , updateBookingStatus);

module.exports = router;