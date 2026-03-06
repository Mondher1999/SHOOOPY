import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import { uploadProductImages as uploadMiddleware } from "../middlewares/upload.js";
import {
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
} from "../controllers/uploadController.js";

const router = express.Router();

// All upload routes require authentication and admin role
router.post(
  "/product-images",
  protect,
  restrictTo("admin"),
  uploadMiddleware,
  uploadProductImages
);

router.delete(
  "/product-images/:fileId",
  protect,
  restrictTo("admin"),
  deleteProductImage
);

router.patch(
  "/product-images/:productId/reorder",
  protect,
  restrictTo("admin"),
  reorderProductImages
);

export default router;
