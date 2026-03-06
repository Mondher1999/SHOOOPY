import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Address from "../models/addressModel.js";
import logger from "../utils/logger.js";
import { escapeRegex } from "../utils/sanitize.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Valid status transitions — key is current status, value is array of allowed next statuses
const VALID_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped"],
  shipped:    ["delivered"],
  delivered:  [],
  cancelled:  [],
};

// ─── Order number generator ───────────────────────────────────────────────────
// Format: ORD-YYYYMMDD-XXXX (sequential counter per day, zero-padded to 4 digits)
async function generateOrderNumber() {
  const now = new Date();
  const pad2 = (n) => String(n).padStart(2, "0");
  const datePart = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const prefix = `ORD-${datePart}-`;

  // Count today's orders to get the next sequence number
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const todayCount = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  return `${prefix}${String(todayCount + 1).padStart(4, "0")}`;
}

// ─── POST /api/orders ─────────────────────────────────────────────────────────
// Flow: validate cart → validate address → check & decrement stock → create order → clear cart
export const placeOrder = async (req, res) => {
  try {
    const { addressId, notes } = req.body;

    if (!addressId) {
      return res.status(400).json({ success: false, error: "Missing required field: addressId" });
    }
    if (!isObjectId(addressId)) {
      return res.status(400).json({ success: false, error: "Invalid addressId format" });
    }

    // Fetch cart with populated product data
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name images stock price isActive",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Your cart is empty" });
    }

    // Fetch delivery address (must belong to user)
    const address = await Address.findOne({ _id: addressId, user: req.user._id }).lean();
    if (!address) {
      return res.status(404).json({ success: false, error: "Delivery address not found" });
    }

    // Validate stock for all items before touching any product
    const outOfStock = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        outOfStock.push({ name: item.product?.name ?? "Unknown product", available: 0, requested: item.quantity });
        continue;
      }
      if (item.quantity > product.stock) {
        outOfStock.push({ name: product.name, available: product.stock, requested: item.quantity });
      }
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    // Build order items snapshot from cart
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name:     item.product.name,
      quantity: item.quantity,
      price:    item.price, // locked-in price from cart
      image:    item.product.images[0]?.thumbnail ?? "",
    }));

    // Calculate totals
    const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = 0; // COD — free shipping in this implementation

    const orderNumber = await generateOrderNumber();

    // Create order BEFORE decrementing stock — if Order.create fails (e.g. duplicate
    // order number race condition), no stock changes are made and the error bubbles cleanly.
    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items: orderItems,
      shippingAddress: {
        fullName:   address.fullName,
        phone:      address.phone,
        street:     address.street,
        city:       address.city,
        state:      address.state,
        postalCode: address.postalCode,
        country:    address.country,
        label:      address.label,
      },
      paymentMethod: "COD",
      totalPrice:  itemsTotal + shippingCost,
      shippingCost,
      notes: notes || "",
      statusHistory: [{ status: "pending", date: new Date(), note: "Order placed" }],
    });

    // Decrement stock only after the order document is safely created
    await Promise.all(
      cart.items.map((item) =>
        Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } })
      )
    );

    // Clear cart after successful order creation
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("placeOrder error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/orders/my-orders ────────────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const filter = { user: req.user._id };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getMyOrders error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("getOrderById error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/orders/:id/cancel ───────────────────────────────────────────────
// Only cancellable while status is pending or confirmed.
// Stock is restored when an order is cancelled.
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (!["pending", "confirmed"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: `Order cannot be cancelled at status: ${order.status}`,
      });
    }

    // Restore stock for all order items
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
      )
    );

    order.status = "cancelled";
    order.statusHistory.push({
      status: "cancelled",
      date: new Date(),
      note: "Cancelled by customer",
    });

    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("cancelOrder error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── ADMIN: GET /api/orders/admin ───────────────────────────────────────────
// Paginated list of all orders with optional status/search/date filters.
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = {};

    // Status filter
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (req.query.status && validStatuses.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    // Search by order number or customer name (populated later via pipeline)
    // For orderNumber direct match:
    if (req.query.search) {
      const escaped = escapeRegex(req.query.search.trim());
      filter.orderNumber = { $regex: escaped, $options: "i" };
    }

    // Date range filters
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const start = new Date(req.query.startDate);
        if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        if (!isNaN(end.getTime())) {
          end.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = end;
        }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getAllOrdersAdmin error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── ADMIN: GET /api/orders/admin/:id ───────────────────────────────────────
// Full order detail with populated user info.
export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    logger.error("getOrderByIdAdmin error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── ADMIN: PUT /api/orders/admin/:id/status ────────────────────────────────
// Validates status transition, updates status, appends to statusHistory.
// Stock is restored if admin cancels an order.
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: "Missing required field: status" });
    }
    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, error: "Missing required field: note" });
    }
    if (note.trim().length > 500) {
      return res.status(400).json({ success: false, error: "Note must be 500 characters or less" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot transition from "${order.status}" to "${status}". Allowed transitions: ${(allowed || []).join(", ") || "none (terminal status)"}`,
      });
    }

    // Restore stock if admin cancels
    if (status === "cancelled") {
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
        )
      );
    }

    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: note.trim(),
    });

    await order.save();

    // Re-fetch with populated user for consistent admin response
    const updated = await Order.findById(id).populate("user", "name email").lean();

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error("updateOrderStatus error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── ADMIN: GET /api/orders/stats ───────────────────────────────────────────
// Aggregated order statistics: totals, by status, and daily revenue.
export const getOrderStats = async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [totals, byStatus, dailyRevenue] = await Promise.all([
      // Total orders & revenue (all time)
      Order.aggregate([
        { $match: { status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: "$totalPrice" },
          },
        },
      ]),

      // Orders by status (all time)
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),

      // Daily revenue for the requested period (non-cancelled)
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            revenue: { $sum: "$totalPrice" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const totalData = totals[0] || { totalOrders: 0, totalRevenue: 0 };

    // Convert byStatus array to object
    const ordersByStatus = {};
    for (const s of byStatus) {
      ordersByStatus[s._id] = s.count;
    }

    res.status(200).json({
      success: true,
      data: {
        totalOrders: totalData.totalOrders,
        totalRevenue: totalData.totalRevenue,
        ordersByStatus,
        dailyRevenue: dailyRevenue.map((d) => ({
          date: d._id,
          revenue: d.revenue,
          orders: d.orders,
        })),
      },
    });
  } catch (error) {
    logger.error("getOrderStats error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
