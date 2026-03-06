import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatus,
  getOrderStats,
} from "../controllers/orderController.js";

const router = express.Router();

// ─── Customer routes (authenticated) ────────────────────────────────────────
// Note: /my-orders must come before /:id to avoid route conflict
router.get("/my-orders", protect, getMyOrders);
router.post("/",         protect, placeOrder);
router.put("/:id/cancel", protect, cancelOrder);

// ─── Admin routes ────────────────────────────────────────────────────────────
router.get("/stats",        protect, restrictTo("admin"), getOrderStats);
router.get("/admin",        protect, restrictTo("admin"), getAllOrdersAdmin);
router.get("/admin/:id",    protect, restrictTo("admin"), getOrderByIdAdmin);
router.put("/admin/:id/status", protect, restrictTo("admin"), updateOrderStatus);

// Customer order detail — must come AFTER /stats, /admin to avoid route capture
router.get("/:id", protect, getOrderById);

export default router;
