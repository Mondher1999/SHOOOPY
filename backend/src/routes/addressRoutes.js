import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";

const router = express.Router();

// All address routes require authentication
router.get("/",             protect, getAddresses);
router.post("/",            protect, createAddress);
router.put("/:id",          protect, updateAddress);
router.delete("/:id",       protect, deleteAddress);
router.put("/:id/default",  protect, setDefaultAddress);

export default router;
