const express = require('express');
const {
  getSavedItems,
  saveItem,
  unsaveItem,
  checkSaved,
} = require('../controllers/savedItems.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all saved items for current user
router.get('/', getSavedItems);

// Check if specific items are saved
router.get('/check', checkSaved);

// Save an item
router.post('/', saveItem);

// Unsave (remove) an item
router.delete('/', unsaveItem);

module.exports = router;