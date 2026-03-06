import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import logger from "../utils/logger.js";

// Validate ObjectId format
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── Shared helper: return a fully-populated cart ────────────────────────────
async function getPopulatedCart(userId) {
  return Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug images stock price isActive",
  });
}

// ─── GET /api/cart ───────────────────────────────────────────────────────────
export const getCart = async (req, res) => {
  try {
    const cart = await getPopulatedCart(req.user._id);

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], totalPrice: 0 } });
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    logger.error("getCart error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/cart/items ────────────────────────────────────────────────────
export const addItem = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: "Missing required field: productId" });
    }
    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid productId format" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
    }

    const product = await Product.findById(productId).lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    const requestedQty = existingItem ? existingItem.quantity + quantity : quantity;

    if (requestedQty > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQty;
      existingItem.price = product.price; // refresh snapshot
    } else {
      cart.items.push({ product: productId, quantity, price: product.price });
    }

    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("addItem error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/cart/items/:productId ─────────────────────────────────────────
export const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid productId format" });
    }
    if (quantity === undefined) {
      return res.status(400).json({ success: false, error: "Missing required field: quantity" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found in cart" });
    }

    // Stock check
    const product = await Product.findById(productId).select("stock isActive").lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.stock} unit(s) available in stock`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("updateQuantity error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/cart/items/:productId ──────────────────────────────────────
export const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid productId format" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const beforeCount = cart.items.length;
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    if (cart.items.length === beforeCount) {
      return res.status(404).json({ success: false, error: "Item not found in cart" });
    }

    await cart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("removeItem error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/cart ────────────────────────────────────────────────────────
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(200).json({ success: true, data: { message: "Cart cleared" } });
  } catch (error) {
    logger.error("clearCart error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/cart/merge ────────────────────────────────────────────────────
// Called on login to merge guest localStorage cart with server cart.
// Server cart wins on quantity conflicts (keeps the higher quantity, up to stock limit).
export const mergeCart = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: "Missing required field: items" });
    }

    // Validate all items upfront
    for (const item of items) {
      if (!item.productId || !isObjectId(item.productId)) {
        return res.status(400).json({ success: false, error: "Invalid productId in items" });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ success: false, error: "Quantity must be a positive integer" });
      }
    }

    // Fetch all products in parallel instead of sequentially
    const [cart, products] = await Promise.all([
      Cart.findOne({ user: req.user._id }),
      Promise.all(
        items.map((item) =>
          Product.findById(item.productId).select("stock price isActive").lean()
        )
      ),
    ]);

    const resolvedCart = cart ?? new Cart({ user: req.user._id, items: [] });

    items.forEach((guestItem, idx) => {
      const product = products[idx];
      if (!product || !product.isActive) return; // skip unavailable products silently

      const existingItem = resolvedCart.items.find(
        (i) => i.product.toString() === guestItem.productId
      );

      if (existingItem) {
        // Keep the higher quantity, capped at available stock
        const merged = Math.max(existingItem.quantity, guestItem.quantity);
        existingItem.quantity = Math.min(merged, product.stock);
        existingItem.price = product.price;
      } else {
        const qty = Math.min(guestItem.quantity, product.stock);
        if (qty > 0) {
          resolvedCart.items.push({ product: guestItem.productId, quantity: qty, price: product.price });
        }
      }
    });

    await resolvedCart.save();

    const populated = await getPopulatedCart(req.user._id);
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    logger.error("mergeCart error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
