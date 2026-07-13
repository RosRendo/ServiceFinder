const express = require('express');
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  assignStaff,
  startJob,
  updateProgress,
  completeJob,
  getMyAssignedBookings,
} = require('../controllers/bookings.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// General booking operations
router.get('/', authenticate, getAllBookings);
router.get('/:id', authenticate, getBookingById);
router.post('/', authenticate, createBooking);
router.patch('/:id/status', authenticate, authorize('company_admin', 'staff', 'admin'), updateBookingStatus);
router.delete('/:id', authenticate, cancelBooking);

// Staff assignment (Company Admin only)
router.post('/:id/assign-staff', authenticate, authorize('company_admin', 'admin'), assignStaff);

// Staff job lifecycle (Staff only)
router.get('/staff/assigned', authenticate, authorize('staff'), getMyAssignedBookings);
router.post('/:id/start', authenticate, authorize('staff'), startJob);
router.patch('/:id/progress', authenticate, authorize('staff'), updateProgress);
router.post('/:id/complete', authenticate, authorize('staff'), completeJob);

module.exports = router;