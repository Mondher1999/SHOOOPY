import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AVATARS_DIR = path.join(__dirname, "../../uploads/avatars");

// Ensure upload directory exists at startup
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
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
    logger.warn(`Rejected upload: mime=${file.mimetype} ext=${ext}`);
    cb(new Error("Only image files (JPEG, PNG, WebP, GIF) are allowed"), false);
  }
}

const _uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
}).single("avatar");

/**
 * Wraps multer to return structured 400 errors instead of falling through to
 * the generic 500 handler. Use this in routes instead of _uploadAvatar directly.
 */
export function uploadAvatar(req, res, next) {
  _uploadAvatar(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ success: false, error: "Image too large. Max size is 5 MB." });
    }
    return res.status(400).json({ success: false, error: err.message || "Upload failed" });
  });
}

export { AVATARS_DIR };
