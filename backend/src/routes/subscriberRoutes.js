import express from "express";
import rateLimit from "express-rate-limit";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  subscribe,
  listSubscribers,
  exportSubscribers,
  unsubscribe,
} from "../controllers/subscriberController.js";

const router = express.Router();

const subscribeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many subscribe attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public — anyone can subscribe (rate limited)
router.post("/", subscribeLimiter, subscribe);

// Admin only
router.get("/", protect, restrictTo("admin"), listSubscribers);
router.get("/export", protect, restrictTo("admin"), exportSubscribers);
router.delete("/:id", protect, restrictTo("admin"), unsubscribe);

export default router;
