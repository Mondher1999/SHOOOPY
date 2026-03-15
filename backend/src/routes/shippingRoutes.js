import express from "express";
import rateLimit from "express-rate-limit";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  sendToDelivery,
  trackShipment,
  cancelShipment,
  shippingWebhook,
  testShippingConnection,
} from "../controllers/shippingController.js";

const router = express.Router();

// Admin endpoints — protected
router.post("/test-connection", protect, restrictTo("admin"), testShippingConnection);
router.post("/:orderId/send", protect, restrictTo("admin"), sendToDelivery);
router.get("/:orderId/track", protect, restrictTo("admin"), trackShipment);
router.post("/:orderId/cancel", protect, restrictTo("admin"), cancelShipment);

// Webhook — public (verified by secret in controller), rate-limited
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many webhook requests" },
});
router.post("/webhook", webhookLimiter, shippingWebhook);

export default router;
