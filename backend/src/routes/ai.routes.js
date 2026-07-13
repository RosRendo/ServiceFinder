const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { analyzeWall } = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Determine upload path
        const uploadPath = path.join(__dirname, '../../uploads');
        // Ensure directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Route: POST /api/analyze-wall
// Protected route: Only authenticated staff/admins can use this tool
router.post('/', authenticate, authorize('staff', 'admin', 'company_admin'), upload.single('image'), analyzeWall);

// Public route for testing without auth (optional, remove in production)
// router.post('/public/analyze-wall', upload.single('image'), analyzeWall);

module.exports = router;
