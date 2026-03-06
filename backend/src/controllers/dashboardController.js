import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import cache from "../utils/cache.js";
import logger from "../utils/logger.js";

// ─── GET /api/dashboard/stats ────────────────────────────────────────────────
// KPI overview: total revenue, orders, users, products, today's stats, new users
export const getDashboardStats = async (req, res) => {
  try {
    const cached = cache.get("dashboard:stats");
    if (cached) return res.status(200).json({ success: true, data: cached });

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      orderTotals,
      ordersByStatus,
      ordersToday,
      totalUsers,
      newUsersThisMonth,
      totalProducts,
    ] = await Promise.all([
      // All-time revenue & order count (excluding cancelled)
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: "$totalPrice" } } },
      ]),

      // Orders by status
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Today's orders & revenue
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $ne: "cancelled" } } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
      ]),

      // Total active users
      User.countDocuments({ isActive: true }),

      // New users this month
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),

      // Total active products
      Product.countDocuments({ isActive: true }),
    ]);

    const totals = orderTotals[0] || { totalOrders: 0, totalRevenue: 0 };
    const todayData = ordersToday[0] || { count: 0, revenue: 0 };

    const statusMap = {};
    for (const s of ordersByStatus) {
      statusMap[s._id] = s.count;
    }

    const data = {
      totalRevenue: totals.totalRevenue,
      totalOrders: totals.totalOrders,
      totalUsers,
      totalProducts,
      ordersToday: todayData.count,
      revenueToday: todayData.revenue,
      newUsersThisMonth,
      ordersByStatus: statusMap,
    };

    cache.set("dashboard:stats", data, 120); // 2 min TTL

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("getDashboardStats error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/dashboard/revenue-chart?days=30 ────────────────────────────────
// Daily revenue for the last N days (for line chart)
export const getRevenueChart = async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));

    const cacheKey = `dashboard:revenue:${days}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = dailyRevenue.map((d) => ({
      date: d._id,
      revenue: d.revenue,
      orders: d.orders,
    }));

    cache.set(cacheKey, data, 300); // 5 min TTL

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("getRevenueChart error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/dashboard/top-products?limit=5 ─────────────────────────────────
// Top selling products by quantity sold (from delivered/non-cancelled orders)
export const getTopProducts = async (req, res) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));

    const cacheKey = `dashboard:top-products:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const topProducts = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          image: { $first: "$items.image" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: limit },
    ]);

    const data = topProducts.map((p) => ({
      productId: p._id,
      name: p.name,
      image: p.image,
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
    }));

    cache.set(cacheKey, data, 300); // 5 min TTL

    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("getTopProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/dashboard/recent-orders?limit=10 ──────────────────────────────
// Most recent orders with populated user info
export const getRecentOrders = async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    logger.error("getRecentOrders error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/dashboard/low-stock?threshold=10 ──────────────────────────────
// Active products with stock below the threshold
export const getLowStockProducts = async (req, res) => {
  try {
    const threshold = Math.min(100, Math.max(1, parseInt(req.query.threshold) || 10));

    const cacheKey = `dashboard:low-stock:${threshold}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const products = await Product.find({
      isActive: true,
      stock: { $lte: threshold },
    })
      .select("name slug stock images")
      .sort({ stock: 1 })
      .limit(20)
      .lean();

    cache.set(cacheKey, products, 120); // 2 min TTL

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    logger.error("getLowStockProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
