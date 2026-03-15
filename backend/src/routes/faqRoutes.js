import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getPublicFAQs,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  reorderFAQs,
} from "../controllers/faqController.js";

const router = express.Router();

// Public — active FAQs only
router.get("/", getPublicFAQs);

// Admin-only
router.get("/admin", protect, restrictTo("admin"), getAllFAQs);
router.post("/", protect, restrictTo("admin"), createFAQ);
router.put("/reorder", protect, restrictTo("admin"), reorderFAQs);
router.put("/:id", protect, restrictTo("admin"), updateFAQ);
router.delete("/:id", protect, restrictTo("admin"), deleteFAQ);

export default router;
