import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js";

const router = express.Router();

// Authenticated — validate a coupon code
router.post("/validate", protect, validateCoupon);

// Admin-only CRUD
router.get("/", protect, restrictTo("admin"), getAllCoupons);
router.post("/", protect, restrictTo("admin"), createCoupon);
router.put("/:id", protect, restrictTo("admin"), updateCoupon);
router.delete("/:id", protect, restrictTo("admin"), deleteCoupon);

export default router;
