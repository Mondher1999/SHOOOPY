import express from "express";
import multer from "multer";
import { protect, restrictTo } from "../middlewares/auth.js";
import { exportProducts, exportOrders, importProducts } from "../controllers/exportController.js";

const router = express.Router();

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
});

router.get("/products", protect, restrictTo("admin"), exportProducts);
router.get("/orders", protect, restrictTo("admin"), exportOrders);
router.post("/products", protect, restrictTo("admin"), csvUpload.single("file"), importProducts);

export default router;
