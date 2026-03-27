import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import { findVariant, findSimpleVariants, resolveVariantMode } from "../utils/variantHelpers.js";
import logger from "../utils/logger.js";

// Validate ObjectId format
const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// ─── Shared helper: return a fully-populated cart ────────────────────────────
async function getPopulatedCart(userId) {
  return Cart.findOne({ user: userId }).populate({
    path: "items.product",
    select: "name slug images stock price tva isActive",
  });
}

// ─── Composite identity: productId + sorted selectedOptions JSON ─────────────
// Allows "Blue M" and "Red L" to be separate line items for the same product.
function optionsKey(opts) {
  if (!opts || (opts instanceof Map && opts.size === 0)) return "{}";
  const plain = opts instanceof Map ? Object.fromEntries(opts) : opts;
  const sorted = Object.keys(plain).sort().reduce((acc, k) => { acc[k] = plain[k]; return acc; }, {});
  return JSON.stringify(sorted);
}

function cartItemMatches(item, productId, selectedOptions) {
  if (item.product.toString() !== productId) return false;
  return optionsKey(item.selectedOptions) === optionsKey(selectedOptions);
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
    const { productId, quantity = 1, selectedOptions } = req.body;

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

    // Composite match: same product + same selected options = same line item
    const opts = selectedOptions && typeof selectedOptions === "object" ? selectedOptions : {};
    const existingItem = cart.items.find((item) => cartItemMatches(item, productId, opts));

    const requestedQty = existingItem ? existingItem.quantity + quantity : quantity;

    // 3-way variant-aware stock check
    const mode = resolveVariantMode(product);
    if (mode === "advanced") {
      const variant = findVariant(product, opts);
      if (!variant) {
        return res.status(400).json({ success: false, error: "This variant combination is not available" });
      }
      if (requestedQty > variant.stock) {
        return res.status(400).json({ success: false, error: `Only ${variant.stock} unit(s) available for this variant` });
      }
    } else if (mode === "simple") {
      const simpleVars = findSimpleVariants(product, opts);
      for (const sv of simpleVars) {
        const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
        const [, val] = Object.entries(plain)[0];
        if (requestedQty > sv.stock) {
          return res.status(400).json({ success: false, error: `Only ${sv.stock} unit(s) available for ${val}` });
        }
      }
    } else if (requestedQty > product.stock) {
      return res.status(400).json({ success: false, error: `Only ${product.stock} unit(s) available in stock` });
    }

    if (existingItem) {
      existingItem.quantity = requestedQty;
      existingItem.price = product.price; // refresh snapshot
      existingItem.tva = product.tva || 0;
    } else {
      cart.items.push({ product: productId, quantity, price: product.price, tva: product.tva || 0, selectedOptions: opts });
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
    const { quantity, selectedOptions } = req.body;

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

    // Composite match: if selectedOptions provided, match by product + options
    const opts = selectedOptions && typeof selectedOptions === "object" ? selectedOptions : {};
    const item = cart.items.find((i) => cartItemMatches(i, productId, opts));
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found in cart" });
    }

    // 3-way stock check
    const product = await Product.findById(productId).select("stock isActive variantMode variants").lean();
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    const mode = resolveVariantMode(product);
    if (mode === "advanced") {
      const variant = findVariant(product, opts);
      if (!variant) {
        return res.status(400).json({ success: false, error: "This variant combination is not available" });
      }
      if (quantity > variant.stock) {
        return res.status(400).json({ success: false, error: `Only ${variant.stock} unit(s) available for this variant` });
      }
    } else if (mode === "simple") {
      const simpleVars = findSimpleVariants(product, opts);
      for (const sv of simpleVars) {
        const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
        const [, val] = Object.entries(plain)[0];
        if (quantity > sv.stock) {
          return res.status(400).json({ success: false, error: `Only ${sv.stock} unit(s) available for ${val}` });
        }
      }
    } else if (quantity > product.stock) {
      return res.status(400).json({ success: false, error: `Only ${product.stock} unit(s) available in stock` });
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

// ─── POST /api/cart/items/remove  OR  DELETE /api/cart/items/:productId ──────
// POST body: { productId, selectedOptions? } — preferred, supports variant disambiguation
// DELETE param: productId — legacy compat, removes first match (empty options)
export const removeItem = async (req, res) => {
  try {
    // Accept productId from body (POST) or params (DELETE)
    const productId = req.body.productId || req.params.productId;
    const selectedOptions = req.body.selectedOptions;

    if (!productId || !isObjectId(productId)) {
      return res.status(400).json({ success: false, error: "Invalid productId format" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const opts = selectedOptions && typeof selectedOptions === "object" ? selectedOptions : {};
    const beforeCount = cart.items.length;
    cart.items = cart.items.filter((i) => !cartItemMatches(i, productId, opts));

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
          Product.findById(item.productId).select("stock price tva isActive variantMode variants").lean()
        )
      ),
    ]);

    const resolvedCart = cart ?? new Cart({ user: req.user._id, items: [] });

    items.forEach((guestItem, idx) => {
      const product = products[idx];
      if (!product || !product.isActive) return; // skip unavailable products silently

      const opts = guestItem.selectedOptions && typeof guestItem.selectedOptions === "object"
        ? guestItem.selectedOptions : {};

      const existingItem = resolvedCart.items.find(
        (i) => cartItemMatches(i, guestItem.productId, opts)
      );

      // Determine effective stock (3-way mode-aware)
      let effectiveStock = product.stock;
      const mode = resolveVariantMode(product);
      if (mode === "advanced") {
        const variant = findVariant(product, opts);
        if (!variant) return; // skip combos that don't exist as variants
        effectiveStock = variant.stock;
      } else if (mode === "simple") {
        const simpleVars = findSimpleVariants(product, opts);
        if (simpleVars.length > 0) {
          effectiveStock = Math.min(...simpleVars.map((sv) => sv.stock));
        }
      }

      if (existingItem) {
        // Keep the higher quantity, capped at available stock
        const merged = Math.max(existingItem.quantity, guestItem.quantity);
        existingItem.quantity = Math.min(merged, effectiveStock);
        existingItem.price = product.price;
        existingItem.tva = product.tva || 0;
      } else {
        const qty = Math.min(guestItem.quantity, effectiveStock);
        if (qty > 0) {
          resolvedCart.items.push({ product: guestItem.productId, quantity: qty, price: product.price, tva: product.tva || 0, selectedOptions: opts });
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
