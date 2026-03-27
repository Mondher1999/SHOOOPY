import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import logger from "../utils/logger.js";
import { escapeCSV } from "../utils/sanitize.js";

// ─── GET /api/export/products ───────────────────────────────────────────────
export const exportProducts = async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category", "name")
      .lean();

    const header = "ID,Name,SKU,Price,CompareAtPrice,Stock,Category,IsActive,CreatedAt\n";
    const rows = products.map((p) => {
      const cols = [
        p._id.toString(),
        escapeCSV(p.name),
        escapeCSV(p.sku),
        p.price,
        p.compareAtPrice || "",
        p.stock,
        escapeCSV(p.category?.name),
        p.isActive,
        p.createdAt ? new Date(p.createdAt).toISOString() : "",
      ];
      return cols.join(",");
    }).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="products-${Date.now()}.csv"`);
    res.status(200).send(header + rows);
  } catch (error) {
    logger.error("exportProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/export/orders ─────────────────────────────────────────────────
export const exportOrders = async (req, res) => {
  try {
    const filter = {};
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (req.query.status && validStatuses.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        const s = new Date(req.query.startDate);
        if (!isNaN(s.getTime())) filter.createdAt.$gte = s;
      }
      if (req.query.endDate) {
        const e = new Date(req.query.endDate);
        if (!isNaN(e.getTime())) { e.setHours(23, 59, 59, 999); filter.createdAt.$lte = e; }
      }
      if (Object.keys(filter.createdAt).length === 0) delete filter.createdAt;
    }

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const header = "OrderNumber,Customer,Email,Status,ItemsCount,Subtotal,Shipping,Discount,Total,PaymentMethod,Date\n";
    const rows = orders.map((o) => {
      const itemsTotal = o.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const cols = [
        escapeCSV(o.orderNumber),
        escapeCSV(o.user?.name),
        escapeCSV(o.user?.email),
        escapeCSV(o.status),
        o.items.length,
        itemsTotal.toFixed(2),
        (o.shippingCost || 0).toFixed(2),
        (o.discountAmount || 0).toFixed(2),
        o.totalPrice.toFixed(2),
        escapeCSV(o.paymentMethod),
        o.createdAt ? new Date(o.createdAt).toISOString() : "",
      ];
      return cols.join(",");
    }).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="orders-${Date.now()}.csv"`);
    res.status(200).send(header + rows);
  } catch (error) {
    logger.error("exportOrders error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/import/products ──────────────────────────────────────────────
export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No CSV file uploaded" });
    }

    const csvText = req.file.buffer.toString("utf-8");
    const lines = csvText.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      return res.status(400).json({ success: false, error: "CSV file is empty or has no data rows" });
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const nameIdx = headers.indexOf("name");
    const priceIdx = headers.indexOf("price");
    const stockIdx = headers.indexOf("stock");
    const skuIdx = headers.indexOf("sku");

    if (nameIdx === -1 || priceIdx === -1) {
      return res.status(400).json({ success: false, error: "CSV must contain 'Name' and 'Price' columns" });
    }

    const imported = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const name = cols[nameIdx];
      const price = parseFloat(cols[priceIdx]);

      if (!name || name.length > 200) {
        errors.push({ line: i + 1, error: "Missing or invalid name (max 200 chars)" });
        continue;
      }
      if (isNaN(price) || price < 0) {
        errors.push({ line: i + 1, error: "Invalid price (must be >= 0)" });
        continue;
      }

      const stock = stockIdx !== -1 ? parseInt(cols[stockIdx]) || 0 : 0;
      if (stock < 0) {
        errors.push({ line: i + 1, error: "Stock cannot be negative" });
        continue;
      }

      try {
        const productData = {
          name,
          price,
          stock,
          vendor: req.user._id,
        };
        if (skuIdx !== -1 && cols[skuIdx]) productData.sku = cols[skuIdx];

        const product = await Product.create(productData);
        imported.push({ id: product._id.toString(), name: product.name });
      } catch (err) {
        errors.push({ line: i + 1, error: err.message });
      }
    }

    res.status(200).json({ success: true, data: { imported: imported.length, errors, products: imported } });
  } catch (error) {
    logger.error("importProducts error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
