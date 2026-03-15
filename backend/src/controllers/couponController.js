import Coupon from "../models/couponModel.js";
import logger from "../utils/logger.js";
import { escapeRegex } from "../utils/sanitize.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── POST /api/coupons ──────────────────────────────────────────────────────
export const createCoupon = async (req, res) => {
  try {
    const { code, type, value, maxDiscount, minOrderAmount, maxUses, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({ success: false, error: "Missing required fields: code, type, value" });
    }

    if (!["percentage", "fixed"].includes(type)) {
      return res.status(400).json({ success: false, error: "Type must be 'percentage' or 'fixed'" });
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
      return res.status(400).json({ success: false, error: "Value must be a positive number" });
    }

    if (type === "percentage" && numValue > 100) {
      return res.status(400).json({ success: false, error: "Percentage value cannot exceed 100" });
    }

    // Check uniqueness
    const existing = await Coupon.findOne({ code: code.toUpperCase().trim() }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: "A coupon with this code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type,
      value: numValue,
      maxDiscount: parseFloat(maxDiscount) || 0,
      minOrderAmount: parseFloat(minOrderAmount) || 0,
      maxUses: parseInt(maxUses) || 0,
      expiresAt: expiresAt || null,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    logger.error("createCoupon error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/coupons ───────────────────────────────────────────────────────
export const getAllCoupons = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.code = { $regex: escapeRegex(req.query.search.trim()), $options: "i" };
    }
    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;

    const [coupons, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        coupons: coupons.map((c) => ({ ...c, id: c._id.toString() })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error("getAllCoupons error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/coupons/:id ───────────────────────────────────────────────────
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    const allowedFields = ["code", "type", "value", "maxDiscount", "minOrderAmount", "maxUses", "expiresAt", "isActive"];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "code") {
          coupon.code = String(req.body.code).toUpperCase().trim();
        } else if (field === "type") {
          if (!["percentage", "fixed"].includes(req.body.type)) {
            return res.status(400).json({ success: false, error: "Type must be 'percentage' or 'fixed'" });
          }
          coupon.type = req.body.type;
        } else if (["value", "maxDiscount", "minOrderAmount", "maxUses"].includes(field)) {
          coupon[field] = parseFloat(req.body[field]) || 0;
        } else if (field === "isActive") {
          coupon.isActive = Boolean(req.body.isActive);
        } else if (field === "expiresAt") {
          coupon.expiresAt = req.body.expiresAt || null;
        }
      }
    }

    await coupon.save();
    res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    logger.error("updateCoupon error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/coupons/:id ────────────────────────────────────────────────
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ success: false, error: "Coupon not found" });
    }

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("deleteCoupon error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/coupons/validate ─────────────────────────────────────────────
// Authenticated — validate a coupon code and calculate discount for given subtotal
export const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, error: "Missing required field: code" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), isActive: true }).lean();
    if (!coupon) {
      return res.status(404).json({ success: false, error: "Invalid or expired coupon code" });
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: "This coupon has expired" });
    }

    // Check max uses
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ success: false, error: "This coupon has reached its usage limit" });
    }

    // Check minimum order amount
    const orderSubtotal = parseFloat(subtotal) || 0;
    if (coupon.minOrderAmount > 0 && orderSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount for this coupon is $${coupon.minOrderAmount}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (orderSubtotal * coupon.value) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, orderSubtotal);
    discount = Math.round(discount * 100) / 100;

    res.status(200).json({
      success: true,
      data: {
        couponId: coupon._id.toString(),
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    });
  } catch (error) {
    logger.error("validateCoupon error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
