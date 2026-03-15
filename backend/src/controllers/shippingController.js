import crypto from "crypto";
import Order from "../models/orderModel.js";
import Settings from "../models/settingsModel.js";
import cache from "../utils/cache.js";
import logger from "../utils/logger.js";
import { createShippingProvider } from "../services/shippingProvider.js";

const isObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || "default-dev-key-change-me";

function decrypt(text) {
  if (!text || !text.includes(":")) return "";
  try {
    const parts = text.split(":");
    let salt, ivHex, encrypted;
    if (parts.length === 3) {
      [salt, ivHex, encrypted] = [Buffer.from(parts[0], "hex"), parts[1], parts[2]];
    } else {
      [ivHex, encrypted] = parts;
      salt = "salt";
    }
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

/**
 * Get decrypted shipping config from settings.
 * Returns null if shipping is not configured.
 */
async function getShippingConfig() {
  let settings = cache.get("settings:global");
  if (!settings) {
    settings = await Settings.findOne({}).lean();
    if (settings) cache.set("settings:global", settings, 300);
  }
  const shipping = settings?.shipping;
  if (!shipping?.enabled) return null;

  return {
    ...shipping,
    apiKey: shipping.apiKey ? decrypt(shipping.apiKey) : "",
  };
}

// ─── POST /api/shipping/:orderId/send ───────────────────────────────────────
// Create a shipment with the delivery company for this order.
export const sendToDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!isObjectId(orderId)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (order.shipping?.trackingNumber) {
      return res.status(409).json({ success: false, error: "Order already has a shipment" });
    }

    const config = await getShippingConfig();
    if (!config) {
      return res.status(400).json({ success: false, error: "Shipping integration is not configured" });
    }

    const provider = createShippingProvider(config);
    if (!provider) {
      return res.status(400).json({ success: false, error: "Shipping provider could not be initialized" });
    }

    const weight = req.body.weight || config.defaultWeight || 1;

    const result = await provider.createShipment(order, weight);

    // Update order with shipping info
    order.shipping = {
      provider: config.providerName || "generic",
      externalId: result.externalId || "",
      trackingNumber: result.trackingNumber || "",
      trackingUrl: result.trackingUrl || "",
      estimatedDelivery: result.estimatedDelivery || null,
      actualDelivery: null,
      carrierStatus: "created",
      carrierStatusLabel: "Shipment created",
      lastSyncedAt: new Date(),
      weight,
    };

    await order.save();

    // Re-fetch with populated user for consistent response
    const updated = await Order.findById(orderId).populate("user", "name email").lean();
    const { _id, __v, ...rest } = updated;

    res.status(200).json({ success: true, data: { id: _id.toString(), ...rest } });
  } catch (error) {
    logger.error("sendToDelivery error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/shipping/:orderId/track ───────────────────────────────────────
// Fetch latest tracking status from the delivery company API.
export const trackShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!isObjectId(orderId)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (!order.shipping?.trackingNumber) {
      return res.status(400).json({ success: false, error: "Order has no shipment to track" });
    }

    const config = await getShippingConfig();
    if (!config) {
      return res.status(400).json({ success: false, error: "Shipping integration is not configured" });
    }

    const provider = createShippingProvider(config);
    if (!provider) {
      return res.status(400).json({ success: false, error: "Shipping provider could not be initialized" });
    }

    const result = await provider.trackShipment(order.shipping.trackingNumber);

    // Update order with latest tracking info
    if (result.carrierStatus) order.shipping.carrierStatus = result.carrierStatus;
    if (result.carrierStatusLabel) order.shipping.carrierStatusLabel = result.carrierStatusLabel;
    if (result.estimatedDelivery) order.shipping.estimatedDelivery = result.estimatedDelivery;
    if (result.actualDelivery) order.shipping.actualDelivery = result.actualDelivery;
    order.shipping.lastSyncedAt = new Date();

    await order.save();

    const updated = await Order.findById(orderId).populate("user", "name email").lean();
    const { _id, __v, ...rest } = updated;

    res.status(200).json({ success: true, data: { id: _id.toString(), ...rest } });
  } catch (error) {
    logger.error("trackShipment error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/shipping/:orderId/cancel ─────────────────────────────────────
// Cancel a shipment with the delivery company.
export const cancelShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!isObjectId(orderId)) {
      return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    if (!order.shipping?.externalId) {
      return res.status(400).json({ success: false, error: "Order has no shipment to cancel" });
    }

    const config = await getShippingConfig();
    if (!config) {
      return res.status(400).json({ success: false, error: "Shipping integration is not configured" });
    }

    const provider = createShippingProvider(config);
    if (!provider) {
      return res.status(400).json({ success: false, error: "Shipping provider could not be initialized" });
    }

    await provider.cancelShipment(order.shipping.externalId);

    // Clear shipping info
    order.shipping.carrierStatus = "cancelled";
    order.shipping.carrierStatusLabel = "Shipment cancelled";
    order.shipping.lastSyncedAt = new Date();

    await order.save();

    const updated = await Order.findById(orderId).populate("user", "name email").lean();
    const { _id, __v, ...rest } = updated;

    res.status(200).json({ success: true, data: { id: _id.toString(), ...rest } });
  } catch (error) {
    logger.error("cancelShipment error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/shipping/webhook ─────────────────────────────────────────────
// Receive status updates from the delivery company (public, verified by secret).
export const shippingWebhook = async (req, res) => {
  try {
    const settings = cache.get("settings:global") || await Settings.findOne({}).lean();
    const webhookSecret = settings?.shipping?.webhookSecret
      ? decrypt(settings.shipping.webhookSecret)
      : "";

    // Verify webhook secret (header only — never accept via query string)
    const providedSecret = req.headers["x-webhook-secret"] || "";
    if (!webhookSecret || !providedSecret) {
      return res.status(401).json({ success: false, error: "Invalid webhook secret" });
    }
    // Timing-safe comparison to prevent timing attacks
    const a = Buffer.from(webhookSecret, "utf8");
    const b = Buffer.from(String(providedSecret), "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ success: false, error: "Invalid webhook secret" });
    }

    const { trackingNumber, status, statusLabel, estimatedDelivery, actualDelivery } = req.body;

    if (!trackingNumber) {
      return res.status(400).json({ success: false, error: "Missing trackingNumber" });
    }

    const order = await Order.findOne({ "shipping.trackingNumber": trackingNumber });
    if (!order) {
      // Not an error — the carrier may send updates for unknown shipments
      return res.status(200).json({ success: true, data: { matched: false } });
    }

    if (status) order.shipping.carrierStatus = String(status);
    if (statusLabel) order.shipping.carrierStatusLabel = String(statusLabel);
    if (estimatedDelivery) {
      const d = new Date(estimatedDelivery);
      if (!isNaN(d.getTime())) order.shipping.estimatedDelivery = d;
    }
    if (actualDelivery) {
      const d = new Date(actualDelivery);
      if (!isNaN(d.getTime())) order.shipping.actualDelivery = d;
    }
    order.shipping.lastSyncedAt = new Date();

    // Auto-update order status based on carrier status
    const carrierLower = String(status || "").toLowerCase();
    if (carrierLower === "delivered" && order.status === "shipped") {
      order.status = "delivered";
      order.statusHistory.push({
        status: "delivered",
        date: new Date(),
        note: "Auto-updated from carrier webhook",
      });
    }

    await order.save();

    res.status(200).json({ success: true, data: { matched: true } });
  } catch (error) {
    logger.error("shippingWebhook error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/shipping/test-connection ─────────────────────────────────────
// Test API credentials with the delivery company.
export const testShippingConnection = async (req, res) => {
  try {
    const config = await getShippingConfig();
    if (!config) {
      return res.status(400).json({ success: false, error: "Shipping integration is not configured" });
    }

    const provider = createShippingProvider(config);
    if (!provider) {
      return res.status(400).json({ success: false, error: "Shipping provider could not be initialized" });
    }

    const result = await provider.validateCredentials();

    if (!result.valid) {
      return res.status(400).json({ success: false, error: result.error || "Connection test failed" });
    }

    res.status(200).json({ success: true, data: { provider: result.provider, status: "connected" } });
  } catch (error) {
    logger.error("testShippingConnection error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
