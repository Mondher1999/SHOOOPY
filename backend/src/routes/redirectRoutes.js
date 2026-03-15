import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  resolveRedirect,
  getAllRedirects,
  createRedirect,
  updateRedirect,
  deleteRedirect,
} from "../controllers/redirectController.js";

const router = express.Router();

// ─── Public: resolve a redirect ───────────────────────────────────────────────
router.get("/resolve", resolveRedirect);

// ─── Admin-only ───────────────────────────────────────────────────────────────
router.get("/", protect, restrictTo("admin"), getAllRedirects);
router.post("/", protect, restrictTo("admin"), createRedirect);
router.put("/:id", protect, restrictTo("admin"), updateRedirect);
router.delete("/:id", protect, restrictTo("admin"), deleteRedirect);

export default router;
