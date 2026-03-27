import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import Coupon from "../models/couponModel.js";
import Address from "../models/addressModel.js";
import User from "../models/userModel.js";
import Settings from "../models/settingsModel.js";
import { comboKey, findSimpleVariants, resolveVariantMode, recomputeProductStock } from "../utils/variantHelpers.js";
import logger from "../utils/logger.js";
import { escapeRegex } from "../utils/sanitize.js";
import { sendOrderNotification } from "../utils/notificationService.js";
import cache from "../utils/cache.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Compute shipping cost from Settings based on itemsTotal.
 * Uses settings:global cache (5-min TTL) to avoid DB hit on every order.
 */
const computeShippingCost = async (itemsTotal) => {
  let settings = cache.get("settings:global");
  if (!settings) {
    settings = await Settings.findOne({}).lean();
    if (settings) cache.set("settings:global", settings, 300);
  }
  const defaultCost = settings?.orders?.defaultShippingCost ?? 0;
  const threshold = settings?.orders?.freeShippingThreshold ?? 0;
  if (threshold > 0 && itemsTotal >= threshold) return 0;
  return defaultCost;
};

// Valid status transitions — key is current status, value is array of allowed next statuses
const VALID_TRANSITIONS = {
  pending:    ["confirmed", "cancelled"],
  confirmed:  ["processing", "cancelled"],
  processing: ["shipped"],
  shipped:    ["delivered"],
  delivered:  ["cancelled"],
  cancelled:  [],
};

/**
 * Decrement stock for a cart/order item — 3-way mode-aware.
 * Advanced: exact combo match → decrement single variant.
 * Simple: per-option match → decrement each matching per-option variant.
 * None: global stock decrement.
 */
async function decrementStock(productId, quantity, selectedOptions) {
  const product = await Product.findById(productId).select("variantMode variants");
  if (!product) return;

  const mode = resolveVariantMode(product);
  const hasOpts = selectedOptions && Object.keys(selectedOptions).length > 0;

  if (mode === "advanced" && hasOpts) {
    const targetKey = comboKey(selectedOptions);
    const variant = product.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
    if (variant) {
      await Product.updateOne(
        { _id: productId, "variants._id": variant._id },
        { $inc: { "variants.$.stock": -quantity } }
      );
      await recomputeProductStock(productId);
      return;
    }
  } else if (mode === "simple" && hasOpts) {
    const simpleVars = findSimpleVariants(product, selectedOptions);
    for (const sv of simpleVars) {
      await Product.updateOne(
        { _id: productId, "variants._id": sv._id },
        { $inc: { "variants.$.stock": -quantity } }
      );
    }
    if (simpleVars.length > 0) {
      await recomputeProductStock(productId);
      return;
    }
  }

  // Fallback: global stock decrement
  await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
}

/**
 * Restore stock for an order item — 3-way mode-aware.
 */
async function restoreStock(productId, quantity, selectedOptions) {
  const product = await Product.findById(productId).select("variantMode variants");
  if (!product) return;

  const mode = resolveVariantMode(product);
  const hasOpts = selectedOptions && Object.keys(selectedOptions).length > 0;

  if (mode === "advanced" && hasOpts) {
    const targetKey = comboKey(selectedOptions);
    const variant = product.variants.find((v) => comboKey(v.optionCombo) === targetKey);
    if (variant) {
      await Product.updateOne(
        { _id: productId, "variants._id": variant._id },
        { $inc: { "variants.$.stock": quantity } }
      );
      await recomputeProductStock(productId);
      return;
    }
  } else if (mode === "simple" && hasOpts) {
    const simpleVars = findSimpleVariants(product, selectedOptions);
    for (const sv of simpleVars) {
      await Product.updateOne(
        { _id: productId, "variants._id": sv._id },
        { $inc: { "variants.$.stock": quantity } }
      );
    }
    if (simpleVars.length > 0) {
      await recomputeProductStock(productId);
      return;
    }
  }

  // Fallback: global stock restore
  await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } });
}

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
      select: "name images stock price tva isActive variantMode",
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Your cart is empty" });
    }

    // Fetch delivery address (must belong to user)
    const address = await Address.findOne({ _id: addressId, user: req.user._id }).lean();
    if (!address) {
      return res.status(404).json({ success: false, error: "Delivery address not found" });
    }

    // Validate stock for all items before touching any product (variant-aware)
    // Fetch full product data (including variants) for stock validation
    const productIds = cart.items.map((i) => i.product._id);
    const fullProducts = await Product.find({ _id: { $in: productIds } }).select("variantMode variants stock isActive name").lean();
    const fullProductMap = new Map(fullProducts.map((p) => [p._id.toString(), p]));

    const outOfStock = [];
    for (const item of cart.items) {
      const product = item.product;
      if (!product || !product.isActive) {
        outOfStock.push({ name: item.product?.name ?? "Unknown product", available: 0, requested: item.quantity });
        continue;
      }

      const fullProd = fullProductMap.get(product._id.toString());
      const opts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});

      const mode = fullProd ? resolveVariantMode(fullProd) : "none";
      if (mode === "advanced" && Object.keys(opts).length > 0) {
        const targetKey = comboKey(opts);
        const variant = fullProd.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
        if (!variant) {
          outOfStock.push({ name: product.name, available: 0, requested: item.quantity });
        } else if (item.quantity > variant.stock) {
          outOfStock.push({ name: product.name, available: variant.stock, requested: item.quantity });
        }
      } else if (mode === "simple" && Object.keys(opts).length > 0) {
        const simpleVars = findSimpleVariants(fullProd, opts);
        for (const sv of simpleVars) {
          if (item.quantity > sv.stock) {
            const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
            const [, val] = Object.entries(plain)[0];
            outOfStock.push({ name: `${product.name} (${val})`, available: sv.stock, requested: item.quantity });
          }
        }
      } else if (item.quantity > product.stock) {
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

    // Build order items snapshot from cart (including selected variant options)
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name:     item.product.name,
      quantity: item.quantity,
      price:    item.price, // locked-in HT price from cart
      tva:      item.tva || 0, // TVA rate snapshot
      image:    item.product.images[0]?.thumbnail ?? "",
      selectedOptions: item.selectedOptions instanceof Map
        ? Object.fromEntries(item.selectedOptions)
        : (item.selectedOptions || {}),
    }));

    // Calculate TTC totals: each item's TTC = price * (1 + tva/100) * quantity
    const itemsTotal = orderItems.reduce((sum, i) => {
      const ttc = i.price * (1 + (i.tva || 0) / 100);
      return sum + ttc * i.quantity;
    }, 0);
    const shippingCost = await computeShippingCost(itemsTotal);

    // Create order + decrement stock in a transaction to prevent overselling
    const session = await mongoose.startSession();
    let order;
    try {
      await session.withTransaction(async () => {
        // Create order with retry for duplicate orderNumber race condition
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const orderNumber = await generateOrderNumber();
            const [created] = await Order.create([{
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
            }], { session });
            order = created;
            break;
          } catch (err) {
            if (err.code === 11000 && attempt < 2) continue;
            throw err;
          }
        }

        // Decrement stock within the same transaction (variant-aware)
        await Promise.all(
          cart.items.map((item) => {
            const opts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});
            return decrementStock(item.product._id, item.quantity, opts);
          })
        );

        // Clear cart within transaction
        cart.items = [];
        await cart.save({ session });
      });
    } finally {
      await session.endSession();
    }

    // Send order confirmation email (non-blocking)
    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("placeOrder error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/orders/buy-now ──────────────────────────────────────────────────
// Quick order: adds the chosen product to cart, then creates an order with ALL
// cart items (existing + new). Uses inline address (name + phone + address text).
export const buyNow = async (req, res) => {
  try {
    const { productId, quantity = 1, fullName, phone, address, couponCode, selectedOptions, excludeProductIds } = req.body;

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

    // ── Add (or merge) the Buy Now product into the user's cart ──
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    const opts = selectedOptions && typeof selectedOptions === "object" ? selectedOptions : {};

    // Composite identity: same product + same options = same line item
    const optionsKey = JSON.stringify(
      Object.keys(opts).sort().reduce((acc, k) => { acc[k] = opts[k]; return acc; }, {})
    );
    const existingIdx = cart.items.findIndex((i) => {
      if (i.product.toString() !== productId) return false;
      const itemOpts = i.selectedOptions instanceof Map ? Object.fromEntries(i.selectedOptions) : (i.selectedOptions || {});
      const itemKey = JSON.stringify(
        Object.keys(itemOpts).sort().reduce((acc, k) => { acc[k] = itemOpts[k]; return acc; }, {})
      );
      return itemKey === optionsKey;
    });
    // Track original state for rollback on failure
    const prevQuantity = existingIdx >= 0 ? cart.items[existingIdx].quantity : null;

    if (existingIdx >= 0) {
      cart.items[existingIdx].quantity += qty;
      cart.items[existingIdx].price = product.price;
    } else {
      cart.items.push({ product: product._id, quantity: qty, price: product.price, tva: product.tva || 0, selectedOptions: opts });
    }
    await cart.save();

    // ── Re-fetch cart with populated product data ──
    cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      select: "name images stock price tva isActive variantMode",
    });

    // ── Remove excluded items from cart before ordering ──
    if (Array.isArray(excludeProductIds) && excludeProductIds.length > 0) {
      const excludeSet = new Set(excludeProductIds.map(String));
      cart.items = cart.items.filter(
        (item) => !excludeSet.has(item.product._id.toString())
      );
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    // ── Validate stock for ALL items (variant-aware) ──
    const buyNowProductIds = cart.items.map((i) => i.product._id);
    const buyNowFullProducts = await Product.find({ _id: { $in: buyNowProductIds } }).select("variantMode variants stock isActive name").lean();
    const buyNowProductMap = new Map(buyNowFullProducts.map((p) => [p._id.toString(), p]));

    const outOfStock = [];
    for (const item of cart.items) {
      const p = item.product;
      if (!p || !p.isActive) {
        outOfStock.push({ name: p?.name ?? "Unknown product", available: 0, requested: item.quantity });
        continue;
      }
      const fullProd = buyNowProductMap.get(p._id.toString());
      const itemOpts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});
      const mode = fullProd ? resolveVariantMode(fullProd) : "none";

      if (mode === "advanced" && Object.keys(itemOpts).length > 0) {
        const targetKey = comboKey(itemOpts);
        const variant = fullProd.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
        if (!variant) {
          outOfStock.push({ name: p.name, available: 0, requested: item.quantity });
        } else if (item.quantity > variant.stock) {
          outOfStock.push({ name: p.name, available: variant.stock, requested: item.quantity });
        }
      } else if (mode === "simple" && Object.keys(itemOpts).length > 0) {
        const simpleVars = findSimpleVariants(fullProd, itemOpts);
        for (const sv of simpleVars) {
          if (item.quantity > sv.stock) {
            const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
            const [, val] = Object.entries(plain)[0];
            outOfStock.push({ name: `${p.name} (${val})`, available: sv.stock, requested: item.quantity });
          }
        }
      } else if (item.quantity > p.stock) {
        outOfStock.push({ name: p.name, available: p.stock, requested: item.quantity });
      }
    }
    if (outOfStock.length > 0) {
      // Rollback the buyNow item we added to avoid cart pollution
      const rollbackCart = await Cart.findOne({ user: req.user._id });
      if (rollbackCart) {
        if (prevQuantity !== null && existingIdx >= 0 && rollbackCart.items[existingIdx]) {
          rollbackCart.items[existingIdx].quantity = prevQuantity;
        } else if (prevQuantity === null) {
          // Remove the newly added item
          rollbackCart.items.pop();
        }
        await rollbackCart.save();
      }
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    // ── Build order items from full cart (including selected variant options) ──
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      quantity: item.quantity,
      price: item.price,
      tva: item.tva || 0,
      image: item.product.images?.[0]?.thumbnail ?? "",
      selectedOptions: item.selectedOptions instanceof Map
        ? Object.fromEntries(item.selectedOptions)
        : (item.selectedOptions || {}),
    }));

    // ── Calculate TTC totals ──
    const subtotal = orderItems.reduce((sum, i) => {
      const ttc = i.price * (1 + (i.tva || 0) / 100);
      return sum + ttc * i.quantity;
    }, 0);
    let discount = 0;
    let validCoupon = null;

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
            validCoupon = coupon;
          }
        }
      }
    }

    const shippingCost = await computeShippingCost(subtotal);
    const totalPrice = subtotal + shippingCost - discount;

    // Create order with retry for duplicate orderNumber race condition
    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderNumber = await generateOrderNumber();
        order = await Order.create({
          user: req.user._id,
          orderNumber,
          items: orderItems,
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
          notes: "",
          statusHistory: [{ status: "pending", date: new Date(), note: "Buy Now order placed" }],
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue;
        throw err;
      }
    }

    // Increment coupon usage AFTER Order.create succeeds (prevents count drift on failure)
    if (validCoupon) {
      await Coupon.findByIdAndUpdate(validCoupon._id, { $inc: { usedCount: 1 } });
    }

    // ── Decrement stock for ALL items (variant-aware) ──
    await Promise.all(
      cart.items.map((item) => {
        const itemOpts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});
        return decrementStock(item.product._id, item.quantity, itemOpts);
      })
    );

    // ── Clear cart ──
    cart.items = [];
    await cart.save();

    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("buyNow error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/orders/guest/buy-now ──────────────────────────────────────────
// Guest Buy Now: creates an order from the submitted product + inline address.
// No authentication required. Cart items come from the frontend (localStorage).
export const guestBuyNow = async (req, res) => {
  try {
    const { items, fullName, phone, address, couponCode, guestEmail } = req.body;

    if (!fullName || !phone || !address) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    // Validate all product IDs and quantities
    for (const item of items) {
      if (!item.productId || !isObjectId(item.productId)) {
        return res.status(400).json({ success: false, error: "Each item must have a valid productId" });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, error: "Each item must have a quantity >= 1" });
      }
    }

    // Fetch all products
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const outOfStock = [];
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemOpts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};

      // 3-way mode-aware stock check
      const mode = resolveVariantMode(product);
      if (mode === "advanced" && Object.keys(itemOpts).length > 0) {
        const targetKey = comboKey(itemOpts);
        const variant = product.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
        if (!variant) {
          outOfStock.push({ name: product.name, available: 0, requested: qty });
          continue;
        }
        if (qty > variant.stock) {
          outOfStock.push({ name: product.name, available: variant.stock, requested: qty });
          continue;
        }
      } else if (mode === "simple" && Object.keys(itemOpts).length > 0) {
        const simpleVars = findSimpleVariants(product, itemOpts);
        let blocked = false;
        for (const sv of simpleVars) {
          if (qty > sv.stock) {
            const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
            const [, val] = Object.entries(plain)[0];
            outOfStock.push({ name: `${product.name} (${val})`, available: sv.stock, requested: qty });
            blocked = true;
          }
        }
        if (blocked) continue;
      } else if (qty > product.stock) {
        outOfStock.push({ name: product.name, available: product.stock, requested: qty });
        continue;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        tva: product.tva || 0,
        image: product.images?.[0]?.thumbnail ?? "",
        selectedOptions: itemOpts,
      });
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, error: "No valid items" });
    }

    // Calculate TTC totals
    const subtotal = orderItems.reduce((sum, i) => {
      const ttc = i.price * (1 + (i.tva || 0) / 100);
      return sum + ttc * i.quantity;
    }, 0);

    let discount = 0;
    let validCoupon = null;

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
            validCoupon = coupon;
          }
        }
      }
    }

    const shippingCost = await computeShippingCost(subtotal);
    const totalPrice = subtotal + shippingCost - discount;

    // Create guest order with retry for duplicate orderNumber
    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderNumber = await generateOrderNumber();
        order = await Order.create({
          user: null,
          isGuest: true,
          guestEmail: (guestEmail || "").trim(),
          orderNumber,
          items: orderItems,
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
          notes: "",
          statusHistory: [{ status: "pending", date: new Date(), note: "Guest order placed" }],
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue;
        throw err;
      }
    }

    // Increment coupon usage
    if (validCoupon) {
      await Coupon.findByIdAndUpdate(validCoupon._id, { $inc: { usedCount: 1 } });
    }

    // Decrement stock (variant-aware)
    await Promise.all(
      orderItems.map((item) => {
        const opts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};
        return decrementStock(item.product, item.quantity, opts);
      })
    );

    // Non-blocking notification (uses guestEmail if provided)
    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("guestBuyNow error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/orders/guest ─────────────────────────────────────────────────
// Guest checkout: creates an order from cart items (sent from localStorage).
// No authentication required.
export const guestCheckout = async (req, res) => {
  try {
    const { items, shippingAddress, notes, guestEmail } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }
    if (!shippingAddress) {
      return res.status(400).json({ success: false, error: "Missing required field: shippingAddress" });
    }

    const { fullName, phone, street } = shippingAddress;
    if (!fullName || !phone || !street) {
      return res.status(400).json({ success: false, error: "Missing required address fields: fullName, phone, street" });
    }

    // Validate all items
    for (const item of items) {
      if (!item.productId || !isObjectId(item.productId)) {
        return res.status(400).json({ success: false, error: "Each item must have a valid productId" });
      }
      if (!item.quantity || item.quantity < 1) {
        return res.status(400).json({ success: false, error: "Each item must have a quantity >= 1" });
      }
    }

    // Fetch all products
    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const outOfStock = [];
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
      }

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemOpts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};

      // 3-way mode-aware stock check
      const mode = resolveVariantMode(product);
      if (mode === "advanced" && Object.keys(itemOpts).length > 0) {
        const targetKey = comboKey(itemOpts);
        const variant = product.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
        if (!variant) {
          outOfStock.push({ name: product.name, available: 0, requested: qty });
          continue;
        }
        if (qty > variant.stock) {
          outOfStock.push({ name: product.name, available: variant.stock, requested: qty });
          continue;
        }
      } else if (mode === "simple" && Object.keys(itemOpts).length > 0) {
        const simpleVars = findSimpleVariants(product, itemOpts);
        let blocked = false;
        for (const sv of simpleVars) {
          if (qty > sv.stock) {
            const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
            const [, val] = Object.entries(plain)[0];
            outOfStock.push({ name: `${product.name} (${val})`, available: sv.stock, requested: qty });
            blocked = true;
          }
        }
        if (blocked) continue;
      } else if (qty > product.stock) {
        outOfStock.push({ name: product.name, available: product.stock, requested: qty });
        continue;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        tva: product.tva || 0,
        image: product.images?.[0]?.thumbnail ?? "",
        selectedOptions: itemOpts,
      });
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, error: "No valid items" });
    }

    // Calculate TTC totals
    const itemsTotal = orderItems.reduce((sum, i) => {
      const ttc = i.price * (1 + (i.tva || 0) / 100);
      return sum + ttc * i.quantity;
    }, 0);
    const shippingCost = await computeShippingCost(itemsTotal);

    // Create guest order with retry for duplicate orderNumber
    let order;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const orderNumber = await generateOrderNumber();
        order = await Order.create({
          user: null,
          isGuest: true,
          guestEmail: (guestEmail || "").trim(),
          orderNumber,
          items: orderItems,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            street: street.trim(),
            city: (shippingAddress.city || "-").trim(),
            state: (shippingAddress.state || "-").trim(),
            postalCode: (shippingAddress.postalCode || "-").trim(),
            country: (shippingAddress.country || "-").trim(),
            label: shippingAddress.label || "home",
          },
          paymentMethod: "COD",
          totalPrice: itemsTotal + shippingCost,
          shippingCost,
          notes: notes || "",
          statusHistory: [{ status: "pending", date: new Date(), note: "Guest order placed" }],
        });
        break;
      } catch (err) {
        if (err.code === 11000 && attempt < 2) continue;
        throw err;
      }
    }

    // Decrement stock (variant-aware)
    await Promise.all(
      orderItems.map((item) => {
        const opts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};
        return decrementStock(item.product, item.quantity, opts);
      })
    );

    // Non-blocking notification
    sendOrderNotification("placed", order).catch(() => {});

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    logger.error("guestCheckout error:", error);
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

    // Restore stock for all order items (variant-aware)
    await Promise.all(
      order.items.map((item) => {
        const opts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});
        return restoreStock(item.product, item.quantity, opts);
      })
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

    // Enforce valid status transitions
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `Cannot transition from "${order.status}" to "${status}"` });
    }

// Restore stock if admin cancels (variant-aware)
    if (status === "cancelled") {
      await Promise.all(
        order.items.map((item) => {
          const opts = item.selectedOptions instanceof Map ? Object.fromEntries(item.selectedOptions) : (item.selectedOptions || {});
          return restoreStock(item.product, item.quantity, opts);
        })
      );
    }

    order.status = status;
    order.statusHistory.push({
      status,
      date: new Date(),
      note: (note || "").trim(),
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
    const { userId, items, shippingAddress, notes, notifyCustomer, shippingCost: shippingCostOverride } = req.body;

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
      const itemOpts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};

      // 3-way mode-aware stock check
      const mode = resolveVariantMode(product);
      if (mode === "advanced" && Object.keys(itemOpts).length > 0) {
        const targetKey = comboKey(itemOpts);
        const variant = product.variants.find((v) => v.enabled && comboKey(v.optionCombo) === targetKey);
        if (!variant) {
          outOfStock.push({ name: product.name, available: 0, requested: qty });
          continue;
        }
        if (qty > variant.stock) {
          outOfStock.push({ name: product.name, available: variant.stock, requested: qty });
          continue;
        }
      } else if (mode === "simple" && Object.keys(itemOpts).length > 0) {
        const simpleVars = findSimpleVariants(product, itemOpts);
        let blocked = false;
        for (const sv of simpleVars) {
          if (qty > sv.stock) {
            const plain = sv.optionCombo instanceof Map ? Object.fromEntries(sv.optionCombo) : sv.optionCombo;
            const [, val] = Object.entries(plain)[0];
            outOfStock.push({ name: `${product.name} (${val})`, available: sv.stock, requested: qty });
            blocked = true;
          }
        }
        if (blocked) continue;
      } else if (mode === "none" && qty > product.stock) {
        outOfStock.push({ name: product.name, available: product.stock, requested: qty });
        continue;
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: qty,
        price: product.price,
        tva: product.tva || 0,
        image: product.images?.[0]?.thumbnail ?? "",
        selectedOptions: item.selectedOptions && typeof item.selectedOptions === "object"
          ? item.selectedOptions : {},
      });
    }

    if (outOfStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items are out of stock",
        data: { outOfStock },
      });
    }

    // ── Calculate totals (TTC = HT × (1 + tva/100)) ──────────────────────
    const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * (1 + (i.tva || 0) / 100) * i.quantity, 0);
    const shippingCost = (shippingCostOverride !== undefined && shippingCostOverride !== null && !isNaN(parseFloat(shippingCostOverride)) && parseFloat(shippingCostOverride) >= 0)
      ? parseFloat(shippingCostOverride)
      : await computeShippingCost(itemsTotal);

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

    // ── Decrement stock (variant-aware) ──────────────────────────────────
    await Promise.all(
      orderItems.map((item) => {
        const opts = item.selectedOptions && typeof item.selectedOptions === "object" ? item.selectedOptions : {};
        return decrementStock(item.product, item.quantity, opts);
      })
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
