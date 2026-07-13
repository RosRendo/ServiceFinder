const express = require("express");
const router = express.Router();
const notificationsController = require("../controllers/notifications.controller");
const { authenticate } = require("../middleware/auth");

// All notification routes require authentication
router.use(authenticate);

// Get user's notifications
router.get("/", notificationsController.getNotifications);

// Mark as read (specific ID or 'all')
router.put("/:id/read", notificationsController.markAsRead);

module.exports = router;
