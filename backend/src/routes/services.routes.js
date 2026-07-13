const express = require("express");
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getServicesByCompany,
  getTrendingServices,
} = require("../controllers/services.controller");
const { authenticate, authorize } = require("../middleware/auth");
const { cacheData } = require("../middleware/cache.middleware");

const router = express.Router();

router.get("/", getAllServices);
router.get("/trending", cacheData(600), getTrendingServices);
router.get("/:id", getServiceById);
router.post(
  "/",
  authenticate,
  authorize("company_admin", "admin"),
  createService,
);
router.put(
  "/:id",
  authenticate,
  authorize("company_admin", "admin"),
  updateService,
);
router.delete(
  "/:id",
  authenticate,
  authorize("company_admin", "admin"),
  deleteService,
);

router.get("/company/:companyId", getServicesByCompany);

module.exports = router;
