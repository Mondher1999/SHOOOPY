import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  createReview,
  getProductReviews,
  checkEligibility,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

// Public — anyone can read reviews
router.get("/product/:productId", getProductReviews);

// Protected — auth required
router.get("/eligibility/:productId", protect, checkEligibility);
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;
