import express from "express";
import rateLimit from "express-rate-limit";
import { protect } from "../middlewares/auth.js";
import {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  getMe,
} from "../controllers/authController.js";

const router = express.Router();

// Stricter rate limiter for password reset to prevent email bombing
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many password reset requests. Please try again later." },
});

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

export default router;
