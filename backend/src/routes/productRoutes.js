import express from "express";
import { protect } from "../middlewares/auth.js";
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

// ─── Protected (any authenticated user can create; ownership checked in controller) ──
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
