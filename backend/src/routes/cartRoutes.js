import express from "express";
import { protect } from "../middlewares/auth.js";
import {
  getCart,
  addItem,
  updateQuantity,
  removeItem,
  clearCart,
  mergeCart,
} from "../controllers/cartController.js";

const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get("/", getCart);
router.post("/merge", mergeCart);
router.post("/items", addItem);
router.put("/items/:productId", updateQuantity);
router.delete("/items/:productId", removeItem);
router.delete("/", clearCart);

export default router;
