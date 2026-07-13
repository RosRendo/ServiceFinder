const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';

const analyzeWall = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const imagePath = req.file.path;
        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        // Send to Python AI Service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/analyze-wall`, formData, {
            headers: {
                ...formData.getHeaders(),
            },
        });

        const { area_m2, pixel_area, confidence } = aiResponse.data;

        // Calculate cleaning cost
        // Assumptions:
        // Base price per m2 = $5.00
        // Minimum charge = $25.00
        const PRICE_PER_M2 = 5.00;
        const MIN_CHARGE = 25.00;

        let cleaning_cost = area_m2 * PRICE_PER_M2;
        if (cleaning_cost < MIN_CHARGE) {
            cleaning_cost = MIN_CHARGE;
        }

        // Clean up uploaded file
        fs.unlinkSync(imagePath);

        res.json({
            success: true,
            data: {
                wall_area_pixels: pixel_area,
                area_m2: parseFloat(area_m2.toFixed(2)),
                confidence_score: confidence,
                cleaning_cost: parseFloat(cleaning_cost.toFixed(2)),
                currency: 'USD'
            }
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) {
                console.error('Failed to delete temp file:', e);
            }
        }

        if (error.response) {
            console.error('AI Service Response Status:', error.response.status);
            console.error('AI Service Response Data:', error.response.data);
            return res.status(error.response.status).json({
                error: 'AI Service Error',
                details: error.response.data
            });
        }

        console.error('AI Service Error Message:', error.message);

        // Provide a fallback response if AI service is down for demo purposes
        if (error.code === 'ECONNREFUSED') {
            console.error(`Failed to connect to AI service at ${AI_SERVICE_URL}`);
            return res.status(503).json({
                error: 'AI Service Unavailable',
                message: `Please ensure the Python AI service is running on port 5001 (Target: ${AI_SERVICE_URL})`
            });
        }

        next(error);
    }
};

module.exports = {
    analyzeWall
};
