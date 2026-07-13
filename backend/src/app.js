const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const { handleStripeWebhook } = require("./controllers/payments.controller");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/users.routes");
const companyRoutes = require("./routes/companies.routes");
const serviceRoutes = require("./routes/services.routes");
const bookingRoutes = require("./routes/bookings.routes");
const paymentRoutes = require("./routes/payments.routes");
const reviewRoutes = require("./routes/reviews.routes");
const conversationRoutes = require("./routes/conversations.routes");
const categoryRoutes = require("./routes/category.routes");
const serviceTypeRoutes = require("./routes/serviceType.routes");
const staffRoutes = require("./routes/staff.routes");
const aiRoutes = require("./routes/ai.routes");
const notificationRoutes = require("./routes/notifications.routes");
const savedItemsRoutes = require("./routes/savedItems.routes");

const app = express();

const allowedOrigins = [
  "http://localhost",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://servicefinder-production.up.railway.app",
  "https://service-finder-five.vercel.app",
  // Cloudflare Tunnel
  /\.trycloudflare\.com$/,
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(",").forEach((origin) => {
    const trimmedOrigin = origin.trim();
    if (trimmedOrigin && !allowedOrigins.includes(trimmedOrigin)) {
      allowedOrigins.push(trimmedOrigin);
    }
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    if (
      !origin || 
      allowedOrigins.includes(origin) || 
      origin.endsWith(".vercel.app") || 
      origin.endsWith(".railway.app") ||
      origin.match(/\.trycloudflare\.com$/)
    ) {
      callback(null, true);
    } else {
      console.warn("Blocked by CORS:", origin);
      callback(null, false);
    }
  },
  credentials: true, // allow cookies
};

// Handle BigInt serialization in JSON
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Security middleware
app.use(
  helmet({
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(cookieParser());
app.use(cors(corsOptions));

// Stripe webhook MUST be defined before any body parsers
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/analyze-wall", aiRoutes);
app.use("/api/notifications", notificationRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/service-types", serviceTypeRoutes);
app.use("/api/saved", savedItemsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
