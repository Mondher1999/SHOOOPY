import Address from "../models/addressModel.js";
import logger from "../utils/logger.js";

const MAX_ADDRESSES = 5;
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── GET /api/addresses ───────────────────────────────────────────────────────
export const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    logger.error("getAddresses error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/addresses ──────────────────────────────────────────────────────
export const createAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, postalCode, country, label } = req.body;

    if (!fullName) return res.status(400).json({ success: false, error: "Missing required field: fullName" });
    if (!phone)    return res.status(400).json({ success: false, error: "Missing required field: phone" });
    if (!street)   return res.status(400).json({ success: false, error: "Missing required field: street" });
    if (!city)     return res.status(400).json({ success: false, error: "Missing required field: city" });
    if (!state)    return res.status(400).json({ success: false, error: "Missing required field: state" });
    if (!postalCode) return res.status(400).json({ success: false, error: "Missing required field: postalCode" });
    if (!country)  return res.status(400).json({ success: false, error: "Missing required field: country" });

    const existingCount = await Address.countDocuments({ user: req.user._id });
    if (existingCount >= MAX_ADDRESSES) {
      return res.status(400).json({
        success: false,
        error: `Maximum of ${MAX_ADDRESSES} addresses allowed`,
      });
    }

    // First address is auto-default; subsequent ones only if explicitly requested
    const isFirst = existingCount === 0;
    const makeDefault = isFirst || req.body.isDefault === true;

    if (makeDefault) {
      // Clear existing default before setting the new one
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const address = await Address.create({
      user: req.user._id,
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country: country || "US",
      label: label || "home",
      isDefault: makeDefault,
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    logger.error("createAddress error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/addresses/:id ───────────────────────────────────────────────────
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid address ID" });
    }

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    const allowedFields = ["fullName", "phone", "street", "city", "state", "postalCode", "country", "label"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        address[field] = req.body[field];
      }
    });

    await address.save();
    res.status(200).json({ success: true, data: address });
  } catch (error) {
    logger.error("updateAddress error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/addresses/:id ────────────────────────────────────────────────
export const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid address ID" });
    }

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    const wasDefault = address.isDefault;
    await address.deleteOne();

    // Promote the most recently created address to default if the deleted one was the default
    if (wasDefault) {
      const next = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.status(200).json({ success: true, data: { message: "Address deleted" } });
  } catch (error) {
    logger.error("deleteAddress error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/addresses/:id/default ──────────────────────────────────────────
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ success: false, error: "Invalid address ID" });
    }

    const address = await Address.findOne({ _id: id, user: req.user._id });
    if (!address) {
      return res.status(404).json({ success: false, error: "Address not found" });
    }

    // Clear previous default, then set the new one
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    res.status(200).json({ success: true, data: address });
  } catch (error) {
    logger.error("setDefaultAddress error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
