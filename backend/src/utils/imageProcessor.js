import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import logger from "./logger.js";

/**
 * Image sizes generated for every uploaded product image.
 * All variants are converted to webp for optimal compression.
 */
const SIZES = {
  thumbnail: { width: 150, height: 150 },
  medium:    { width: 600, height: 600 },
  large:     { width: 1200, height: 1200 },
};

/**
 * Process a single uploaded image file into multiple optimised sizes.
 *
 * @param {string} sourcePath  - Absolute path to the temporary original file
 * @param {string} destDir     - Directory where variants will be written
 * @param {string} baseName    - Base filename without extension (e.g. "img-1234567890")
 * @returns {Promise<{ original: string, thumbnail: string, medium: string, large: string }>}
 *          Paths relative to the uploads root (suitable for serving via /uploads/…)
 */
export async function processProductImage(sourcePath, destDir, baseName) {
  await fs.mkdir(destDir, { recursive: true });

  // Copy original into destination directory unchanged
  const originalExt = path.extname(sourcePath);
  const originalFilename = `${baseName}-original${originalExt}`;
  const originalDest = path.join(destDir, originalFilename);
  await fs.copyFile(sourcePath, originalDest);

  const variants = {};

  for (const [sizeName, dims] of Object.entries(SIZES)) {
    const filename = `${baseName}-${sizeName}.webp`;
    const destPath = path.join(destDir, filename);

    await sharp(sourcePath)
      .resize(dims.width, dims.height, {
        fit: "inside",        // preserve aspect ratio, never upscale beyond original
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(destPath);

    variants[sizeName] = filename;
    logger.info(`imageProcessor: created ${sizeName} → ${destPath}`);
  }

  return {
    original:  originalFilename,
    thumbnail: variants.thumbnail,
    medium:    variants.medium,
    large:     variants.large,
  };
}
