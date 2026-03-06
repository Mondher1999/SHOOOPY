import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getWishlist,
  addItem,
  removeItem,
  clearWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

router.get("/", getWishlist);
router.delete("/", clearWishlist);
router.post("/:productId", addItem);
router.delete("/:productId", removeItem);

export default router;
