import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";
import logger from "../utils/logger.js";

// Validate ObjectId format
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── Shared helper: return a fully-populated wishlist ────────────────────────
async function getPopulatedWishlist(userId) {
  return Wishlist.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug images price compareAtPrice stock ratings isActive",
  });
}

// ─── GET /api/wishlist ───────────────────────────────────────────────────────
export const getWishlist = async (req, res) => {
  try {
    const wishlist = await getPopulatedWishlist(req.user._id);

    if (!wishlist) {
      return res.status(200).json({ success: true, data: { items: [] } });
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    logger.error("getWishlist error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/wishlist/:productId ───────────────────────────────────────────
export const addItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [{ product: productId }],
      });
    } else {
      // Check for duplicate
      const alreadyInList = wishlist.items.some(
        (item) => item.product.toString() === productId
      );

      if (alreadyInList) {
        return res.status(409).json({ success: false, error: "Product already in wishlist" });
      }

      wishlist.items.push({ product: productId });
      await wishlist.save();
    }

    const populated = await getPopulatedWishlist(req.user._id);
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    logger.error("addItem error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/wishlist/:productId ─────────────────────────────────────────
export const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID format" });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, error: "Wishlist not found" });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: "Product not in wishlist" });
    }

    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    const populated = await getPopulatedWishlist(req.user._id);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("removeItem error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/wishlist ────────────────────────────────────────────────────
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(200).json({ success: true, data: null });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({ success: true, data: null });
  } catch (error) {
    logger.error("clearWishlist error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
