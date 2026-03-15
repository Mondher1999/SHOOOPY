import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import Address from "../models/addressModel.js";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import { escapeRegex } from "../utils/sanitize.js";
import { sendOrderNotification } from "../utils/notificationService.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Valid status transitions — key is current status, value is array of allowed next statuses
const VALID_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped"],
  shipped:    ["delivered"],
  delivered:  ["cancelled"],
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

    // Send order confirmation email (non-blocking)
    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("placeOrder error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/orders/buy-now ──────────────────────────────────────────────────
// Direct single-product order — bypasses cart. Inline address (name + phone + address text).
export const buyNow = async (req, res) => {
  try {
    const { productId, quantity = 1, fullName, phone, address, couponCode, selectedOptions } = req.body;

    if (!productId || !fullName || !phone || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid productId format" });
    }

    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const qty = Math.max(1, parseInt(quantity) || 1);
    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock: [{ name: product.name, available: product.stock, requested: qty }] },
      });
    }

    // Calculate pricing
    const subtotal = product.price * qty;
    let discount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true }).lean();
      if (coupon && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())) {
        if (!(coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)) {
          if (!(coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount)) {
            if (coupon.type === "percentage") {
              discount = (subtotal * coupon.value) / 100;
              if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
            } else {
              discount = coupon.value;
            }
            discount = Math.min(discount, subtotal);
            discount = Math.round(discount * 100) / 100;
            // Increment usage
            await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } });
          }
        }
      }
    }

    const shippingCost = 0;
    const totalPrice = subtotal + shippingCost - discount;

    const orderNumber = await generateOrderNumber();

    const order = await Order.create({
      user: req.user._id,
      orderNumber,
      items: [{
        product: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        image: product.images?.[0]?.thumbnail ?? "",
      }],
      shippingAddress: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: address.trim(),
        city: "-",
        state: "-",
        postalCode: "-",
        country: "-",
        label: "home",
      },
      paymentMethod: "COD",
      totalPrice,
      shippingCost,
      notes: selectedOptions ? JSON.stringify(selectedOptions) : "",
      statusHistory: [{ status: "pending", date: new Date(), note: "Buy Now order placed" }],
    });

    // Decrement stock
    await Product.findByIdAndUpdate(productId, { $inc: { stock: -qty } });

    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("buyNow error:", error);
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

    const mapped = orders.map((o) => ({ ...o, id: o._id.toString() }));

    res.status(200).json({
      success: true,
      data: {
        orders: mapped,
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

    res.status(200).json({ success: true, data: { ...order, id: order._id.toString() } });
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

    // Send cancellation email (non-blocking)
    sendOrderNotification("cancelled", order, { cancelledBy: "customer" }).catch(() => {});

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

    // .lean() bypasses toJSON transform — manually add id so the frontend
    // receives the expected { id, _id, ... } shape matching the AdminOrder type.
    const mapped = orders.map((o) => ({ ...o, id: o._id.toString() }));

    res.status(200).json({
      success: true,
      data: {
        orders: mapped,
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

    res.status(200).json({ success: true, data: { ...order, id: order._id.toString() } });
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
    if (note && note.trim().length > 500) {
      return res.status(400).json({ success: false, error: "Note must be 500 characters or less" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
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

    // Send status notification email (non-blocking)
    const notificationMap = { shipped: "shipped", delivered: "delivered", cancelled: "cancelled" };
    if (notificationMap[status]) {
      sendOrderNotification(notificationMap[status], order, { cancelledBy: "admin" }).catch(() => {});
    }

    // Re-fetch with populated user for consistent admin response
    const updated = await Order.findById(id).populate("user", "name email").lean();

    res.status(200).json({ success: true, data: { ...updated, id: updated._id.toString() } });
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

// ─── ADMIN: POST /api/orders/admin ──────────────────────────────────────────
// Manual order creation — admin places order on behalf of a customer.
// Order starts at "confirmed" status (admin-placed, skips pending).
export const createOrderAdmin = async (req, res) => {
  try {
    const { userId, items, shippingAddress, notes, notifyCustomer } = req.body;

    // ── Validate required fields ──────────────────────────────────────────
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, error: "Missing required field: shippingAddress" });
    }

    const requiredAddressFields = ["fullName", "phone", "street", "city", "state", "postalCode", "country"];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field] || !shippingAddress[field].trim()) {
        return res.status(400).json({ success: false, error: `Missing required address field: ${field}` });
      }
    }

    // ── Validate items format ─────────────────────────────────────────────
    for (const item of items) {
      if (!item.productId || !isObjectId(item.productId)) {
        return res.status(400).json({ success: false, error: "Each item must have a valid productId" });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, error: "Each item must have a quantity >= 1" });
      }
    }

    // ── Resolve order owner (customer or admin fallback) ─────────────────
    let orderUserId = req.user._id; // default: admin's own ID
    let customer = null;

    if (userId) {
      if (!isObjectId(userId)) {
        return res.status(400).json({ success: false, error: "Invalid userId format" });
      }
      customer = await User.findById(userId).select("name email").lean();
      if (!customer) {
        return res.status(404).json({ success: false, error: "Customer not found" });
      }
      orderUserId = userId;
    }

    // ── Fetch all products & validate stock ───────────────────────────────
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const productMap = new Map();
    for (const p of products) {
      productMap.set(p._id.toString(), p);
    }

    const outOfStock = [];
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || !product.isActive) {
        return res.status(404).json({
          success: false,
          error: `Product not found or inactive: ${item.productId}`,
        });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      if (qty > product.stock) {
        outOfStock.push({ name: product.name, available: product.stock, requested: qty });
        continue;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        image: product.images?.[0]?.thumbnail ?? "",
      });
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    // ── Calculate totals ──────────────────────────────────────────────────
    const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = 0;

    const orderNumber = await generateOrderNumber();

    // ── Create order ──────────────────────────────────────────────────────
    const order = await Order.create({
      user: orderUserId,
      orderNumber,
      items: orderItems,
      shippingAddress: {
        fullName:   shippingAddress.fullName.trim(),
        phone:      shippingAddress.phone.trim(),
        street:     shippingAddress.street.trim(),
        city:       shippingAddress.city.trim(),
        state:      shippingAddress.state.trim(),
        postalCode: shippingAddress.postalCode.trim(),
        country:    shippingAddress.country.trim(),
        label:      shippingAddress.label || "home",
      },
      paymentMethod: "COD",
      totalPrice: itemsTotal + shippingCost,
      shippingCost,
      notes: notes || "",
      status: "confirmed",
      statusHistory: [
        { status: "confirmed", date: new Date(), note: "Manual order created by admin" },
      ],
    });

    // ── Decrement stock ───────────────────────────────────────────────────
    await Promise.all(
      orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    // ── Optionally notify customer (only if a real customer was selected) ─
    if (notifyCustomer && customer) {
      sendOrderNotification("placed", order).catch(() => {});
    }

    // Re-fetch with populated user for consistent admin response
    const populated = await Order.findById(order._id).populate("user", "name email").lean();

    res.status(201).json({ success: true, data: { ...populated, id: populated._id.toString() } });
  } catch (error) {
    logger.error("createOrderAdmin error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
