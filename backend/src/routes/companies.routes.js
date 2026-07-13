const express = require("express");
const multer = require("multer");
const cloudinaryStorage = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const { v4: uuidv4 } = require("uuid");
const {
  getAllCompanies,
  getCompanyById,
  getCompanyMe,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompaniesByCategory,
  getCompaniesByServiceType,
  getCompanyDetails,
  getCompanyStaff,
  assignStaffToBooking,
  getCompanyBookings,
  getCompanyBookingById,
  addStaffMember,
  getStaffMemberById,
  updateStaffMember,
  removeStaffMember,
  reactivateStaffMember,
  getAdminStats,
  getCompaniesFeatured,
  getTrendingCompanies,
  getRecommendedCompanies,
  getNearbyCompanies,
  getNewCompanies,
} = require("../controllers/companies.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { cacheData, clearCache } = require("../middleware/cache.middleware");

const router = express.Router();

const clearCompaniesCache = (req, res, next) => {
  clearCache("cache:/api/companies*");
  next();
};

// ─── Multer setup for Cloudinary image uploads ──────────────────────────────────
const storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "service-finder/companies",
  allowedFormats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ width: 1200, crop: "limit" }], // resize large images
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

// ─── Image upload endpoint ────────────────────────────────────────────────────
// POST /api/companies/upload-image
// Returns { url: 'https://res.cloudinary.com/...' }
router.post(
  "/upload-image",
  authenticate,
  authorize("company_admin", "admin"),
  upload.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    // Cloudinary returns the secure url in req.file.path
    res.json({ success: true, url: req.file.path });
  },
);

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get("/admin/stats", authenticate, authorize("admin"), getAdminStats);

// ─── Public routes - HOMEPAGE FEATURES (MUST come BEFORE /:id) ────────────────
router.get("/featured", cacheData(600), getCompaniesFeatured);
router.get("/trending", cacheData(600), getTrendingCompanies);
router.get("/recommended", cacheData(300), getRecommendedCompanies);
router.get("/nearby", getNearbyCompanies); // No cache - location-specific
router.get("/new", cacheData(600), getNewCompanies);

// ─── Public routes ────────────────────────────────────────────────────────────
router.get("/", cacheData(300), getAllCompanies);
router.get("/categories/:categorySlug", cacheData(300), getCompaniesByCategory);
router.get(
  "/categories/:categorySlug/service-types/:serviceTypeSlug",
  cacheData(300),
  getCompaniesByServiceType,
);

// ─── Protected company-scoped routes (must come BEFORE /:id) ─────────────────
router.post(
  "/",
  authenticate,
  authorize("company_admin", "admin"),
  clearCompaniesCache,
  createCompany,
);
router.get(
  "/me",
  authenticate,
  authorize("company_admin", "admin"),
  getCompanyMe,
);
router.get(
  "/staff",
  authenticate,
  authorize("company_admin", "admin"),
  getCompanyStaff,
);
router.post(
  "/staff",
  authenticate,
  authorize("company_admin", "admin"),
  addStaffMember,
);
router.post(
  "/assign-staff",
  authenticate,
  authorize("company_admin", "admin"),
  assignStaffToBooking,
);
router.get(
  "/bookings",
  authenticate,
  authorize("company_admin", "admin"),
  getCompanyBookings,
);
router.get(
  "/bookings/:id",
  authenticate,
  authorize("company_admin", "admin"),
  getCompanyBookingById,
);

// ─── Staff member CRUD (must come BEFORE /:id to avoid conflict) ─────────────
router.get(
  "/staff/:id",
  authenticate,
  authorize("company_admin", "admin"),
  getStaffMemberById,
);
router.put(
  "/staff/:id",
  authenticate,
  authorize("company_admin", "admin"),
  updateStaffMember,
);
router.delete(
  "/staff/:id",
  authenticate,
  authorize("company_admin", "admin"),
  removeStaffMember,
);
router.post(
  "/staff/:id/reactivate",
  authenticate,
  authorize("company_admin", "admin"),
  reactivateStaffMember,
);

// ─── Generic company by ID (must come AFTER all named routes) ────────────────
router.get("/:id", cacheData(300), getCompanyById);
router.put(
  "/:id",
  authenticate,
  authorize("company_admin", "admin"),
  clearCompaniesCache,
  updateCompany,
);
router.delete(
  "/:id",
  authenticate,
  authorize("company_admin", "admin"),
  clearCompaniesCache,
  deleteCompany,
);
router.get("/:id/details", cacheData(300), getCompanyDetails);

module.exports = router;
