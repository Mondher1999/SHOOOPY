import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getAllProducts,
  getProductById,
  searchProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

const router = express.Router();

// ─── Public ───────────────────────────────────────────────────────────────────
// NOTE: /search and /slug/:slug must be registered BEFORE /:id to avoid
// Express treating "search" and "slug" as an ObjectId param.
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

// ─── Admin-only CRUD ─────────────────────────────────────────────────────────
router.post("/", protect, restrictTo("admin"), createProduct);
router.put("/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

export default router;
