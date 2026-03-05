import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import { uploadAvatar } from "../config/multer.js";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getAllUsers,
  getUserById,
  updateUserRole,
  banUser,
} from "../controllers/userController.js";

const router = express.Router();

// ─── Self (any authenticated user) ──────────────────────────────────────────
router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadAvatar, updateProfile);
router.put("/change-password", protect, changePassword);
router.delete("/account", protect, deleteAccount);

// ─── Admin-only ───────────────────────────────────────────────────────────────
router.get("/", protect, restrictTo("admin"), getAllUsers);
router.get("/:id", protect, restrictTo("admin"), getUserById);
router.put("/:id/role", protect, restrictTo("admin"), updateUserRole);
router.put("/:id/ban", protect, restrictTo("admin"), banUser);

export default router;
