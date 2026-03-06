import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Temporary landing directory; images are moved to per-product dirs after processing
export const TEMP_DIR = path.join(__dirname, "../../uploads/temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 10;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    // Timestamp + random suffix prevents filename collisions
    const unique = `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  // Both MIME type AND extension must be valid — prevents bypass via renamed files
  if (mimeOk && extOk) {
    cb(null, true);
  } else {
    logger.warn(`Rejected product upload: mime=${file.mimetype} ext=${ext}`);
    cb(new Error("Only image files (JPEG, PNG, WebP) are allowed"), false);
  }
}

const _uploadProductImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: MAX_FILES },
}).array("files", MAX_FILES);

/**
 * Wraps multer to return structured 400 errors.
 * Use in uploadRoutes instead of _uploadProductImages directly.
 */
export function uploadProductImages(req, res, next) {
  _uploadProductImages(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "Image too large. Max size is 5 MB per file." });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ success: false, error: "Too many files. Max 10 images per upload." });
    }
    return res.status(400).json({ success: false, error: err.message || "Upload failed" });
  });
}
