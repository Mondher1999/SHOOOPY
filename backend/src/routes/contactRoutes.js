import express from "express";
import { rateLimit } from "express-rate-limit";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  submitContact,
  getAllContacts,
  getContact,
  updateContactStatus,
  deleteContact,
} from "../controllers/contactController.js";

const router = express.Router();

// Rate limit for contact form submissions — 5 per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many submissions, please try again later." },
});

// Public — submit contact form
router.post("/", contactLimiter, submitContact);

// Admin-only
router.get("/", protect, restrictTo("admin"), getAllContacts);
router.get("/:id", protect, restrictTo("admin"), getContact);
router.patch("/:id", protect, restrictTo("admin"), updateContactStatus);
router.delete("/:id", protect, restrictTo("admin"), deleteContact);

export default router;
