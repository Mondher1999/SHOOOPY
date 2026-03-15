import express from "express";
import { protect, restrictTo } from "../middlewares/auth.js";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAddressesAdmin,
} from "../controllers/addressController.js";

const router = express.Router();

// ─── Admin routes (must come before /:id to avoid route conflict) ───────────
router.get("/admin/:userId", protect, restrictTo("admin"), getAddressesAdmin);

// ─── Customer routes (authenticated) ────────────────────────────────────────
router.get("/",             protect, getAddresses);
router.post("/",            protect, createAddress);
router.put("/:id",          protect, updateAddress);
router.delete("/:id",       protect, deleteAddress);
router.put("/:id/default",  protect, setDefaultAddress);

export default router;
