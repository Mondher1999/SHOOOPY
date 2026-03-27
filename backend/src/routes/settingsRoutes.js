import express from "express";
import multer from "multer";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getSettings,
  updateSettings,
  uploadSettingsFile,
  sendTestEmail,
  getTopReviews,
  getProductTypeCatalog,
  getEnabledProductTypes,
} from "../controllers/settingsController.js";

const router = express.Router();

// Multer — memory storage for settings uploads (logo, favicon, hero images)
const settingsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/x-icon", "image/vnd.microsoft.icon"]);
    if (allowed.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, GIF, and ICO files are allowed"), false);
    }
  },
});

// Public — needed for footer social links, legal pages, SEO, maintenance check
router.get("/", getSettings);

// Public — top reviews for auto testimonials on homepage
router.get("/top-reviews", getTopReviews);

// Public — full product type catalog (all 20 types)
router.get("/product-types-catalog", getProductTypeCatalog);

// Public — only admin-enabled product types
router.get("/product-types", getEnabledProductTypes);

// Admin-only — update any settings section
router.put("/", protect, restrictTo("admin"), updateSettings);

// Admin-only — upload logo, favicon, or hero slide image
router.post("/upload", protect, restrictTo("admin"), settingsUpload.single("file"), uploadSettingsFile);

// Admin-only — send a test email using SMTP settings
router.post("/test-email", protect, restrictTo("admin"), sendTestEmail);

export default router;
