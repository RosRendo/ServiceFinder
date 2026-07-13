const express = require('express');
const {
  getMyConversations,
  getConversationMessages,
  sendMessage,
} = require('../controllers/conversations.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All chat routes require authentication
router.get('/', authenticate, getMyConversations);
router.get('/:id/messages', authenticate, getConversationMessages);
router.post('/messages', authenticate, sendMessage);

module.exports = router;

