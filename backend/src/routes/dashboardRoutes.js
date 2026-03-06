import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getDashboardStats,
  getRevenueChart,
  getTopProducts,
  getRecentOrders,
  getLowStockProducts,
} from "../controllers/dashboardController.js";

const router = express.Router();

// All dashboard routes require admin access
router.use(protect, restrictTo("admin"));

router.get("/stats", getDashboardStats);
router.get("/revenue-chart", getRevenueChart);
router.get("/top-products", getTopProducts);
router.get("/recent-orders", getRecentOrders);
router.get("/low-stock", getLowStockProducts);

export default router;
