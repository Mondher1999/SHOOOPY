import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getAllCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
router.get("/", getAllCategories);
router.get("/tree", getCategoryTree);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

// ─── Admin-only ───────────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("admin"), createCategory);
router.put("/:id", protect, restrictTo("admin"), updateCategory);
router.delete("/:id", protect, restrictTo("admin"), deleteCategory);

export default router;
