const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus
} = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, getUserById);

router.put('/:id', authenticate, updateUser);
router.patch('/:id', authenticate, updateUser);

router.delete('/:id', authenticate, authorize('admin'), deleteUser);
router.patch('/:id/status', authenticate, authorize('admin'), updateUserStatus);

module.exports = router;