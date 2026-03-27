import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./src/config/db.js";
import logger from "./src/utils/logger.js";
import { correlationId } from "./src/middlewares/correlationId.js";
import healthRoutes from "./src/routes/healthRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import categoryRoutes from "./src/routes/categoryRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import uploadRoutes from "./src/routes/uploadRoutes.js";
import cartRoutes from "./src/routes/cartRoutes.js";
import addressRoutes from "./src/routes/addressRoutes.js";
import orderRoutes from "./src/routes/orderRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import wishlistRoutes from "./src/routes/wishlistRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import settingsRoutes from "./src/routes/settingsRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import couponRoutes from "./src/routes/couponRoutes.js";
import faqRoutes from "./src/routes/faqRoutes.js";
import subscriberRoutes from "./src/routes/subscriberRoutes.js";
import shippingRoutes from "./src/routes/shippingRoutes.js";
import redirectRoutes from "./src/routes/redirectRoutes.js";
import exportRoutes from "./src/routes/exportRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ─── Correlation ID — must be first for log traceability ────────────────────
app.use(correlationId);

// ─── Security Middleware ────────────────────────────────────────────────────
if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  logger.warn("SECURITY: FRONTEND_URL not set — CORS falls back to localhost:3002");
}
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3002",
    credentials: true,
  })
);

// Global rate limit: 500 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Auth-specific rate limit: 250 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many authentication attempts, please try again later." },
});

// Export-specific rate limit: 10 requests per 15 minutes per IP (resource-intensive)
const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many export requests, please try again later." },
});

// ─── Request Parsing ────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// HTTP request logging (dev only — morgan writes to stdout which we accept for HTTP logs)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── Static Files — uploaded avatars ────────────────────────────────────────
app.use("/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads"), { dotfiles: "deny" }));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/health", healthRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/subscribers", subscriberRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/redirects", redirectRoutes);
app.use("/api/export", exportLimiter, exportRoutes);

// ─── Global Error Handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", { correlationId: req.correlationId, error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: "Something went wrong" });
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`ShopFlow backend running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

export default app;
