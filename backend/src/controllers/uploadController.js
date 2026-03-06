import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";
import { validateFileId, assertWithin } from "../utils/sanitize.js";
import { processProductImage } from "../utils/imageProcessor.js";
import Product from "../models/productModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRODUCTS_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/products");
const VALID_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// ─── POST /api/uploads/product-images ─────────────────────────────────────────
// Accepts up to 10 images (multipart/form-data field: "files").
// Requires "productId" in the request body.
// Returns the array of image objects to push into product.images.
export const uploadProductImages = async (req, res) => {
  const uploadedTempFiles = (req.files ?? []).map((f) => f.path);

  try {
    const { productId } = req.body;

    if (!productId?.trim())
      return res.status(400).json({ success: false, error: "Missing required field: productId" });

    if (!VALID_OBJECT_ID.test(productId))
      return res.status(400).json({ success: false, error: "Invalid productId" });

    if (!uploadedTempFiles.length)
      return res.status(400).json({ success: false, error: "No images provided" });

    // Verify product exists and requester is owner or admin
    const product = await Product.findById(productId).lean();
    if (!product)
      return res.status(404).json({ success: false, error: "Product not found" });

    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, error: "Not authorized to upload images for this product" });

    // Per-product upload directory — safe path, no user input in directory name
    const productDir = path.join(PRODUCTS_UPLOAD_DIR, productId);

    // assertWithin: validate productDir before parallel processing begins
    assertWithin(productDir, PRODUCTS_UPLOAD_DIR);

    // Process all images in parallel — each file is independent, no assembly race
    const imageObjects = await Promise.all(
      uploadedTempFiles.map(async (tempPath) => {
        const baseName = path.basename(tempPath, path.extname(tempPath));
        const filenames = await processProductImage(tempPath, productDir, baseName);

        // Clean up temp file after successful processing
        await fs.unlink(tempPath).catch((e) => logger.warn("temp cleanup failed:", e));

        return {
          original:  `/uploads/products/${productId}/${filenames.original}`,
          thumbnail: `/uploads/products/${productId}/${filenames.thumbnail}`,
          medium:    `/uploads/products/${productId}/${filenames.medium}`,
          large:     `/uploads/products/${productId}/${filenames.large}`,
        };
      })
    );

    // Append new image objects to the product's images array
    await Product.findByIdAndUpdate(productId, { $push: { images: { $each: imageObjects } } });

    logger.info(`uploadProductImages: ${imageObjects.length} images processed for product ${productId}`);
    res.status(201).json({ success: true, data: { images: imageObjects } });
  } catch (error) {
    // Best-effort cleanup of temp files on error
    for (const tempPath of uploadedTempFiles) {
      await fs.unlink(tempPath).catch(() => null);
    }
    logger.error("uploadProductImages error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── DELETE /api/uploads/product-images/:fileId ────────────────────────────────
// fileId format: "{productId}:{encodedFilename}" — both segments validated individually.
// Removes the optimised variants from disk and removes the image object from product.images.
export const deleteProductImage = async (req, res) => {
  try {
    const { fileId } = req.params;

    // Validate the overall fileId (alphanumeric, hyphens, colons, underscores, dots)
    if (!fileId || !/^[a-zA-Z0-9_\-.:]+$/.test(fileId))
      return res.status(400).json({ success: false, error: "Invalid fileId" });

    // fileId format: "{productId}:{filename}"
    const colonIdx = fileId.indexOf(":");
    if (colonIdx === -1)
      return res.status(400).json({ success: false, error: "Invalid fileId format" });

    const productId = fileId.slice(0, colonIdx);
    const filename = fileId.slice(colonIdx + 1);

    if (!VALID_OBJECT_ID.test(productId))
      return res.status(400).json({ success: false, error: "Invalid productId in fileId" });

    if (!validateFileId(filename.replace(/\.[a-z]+$/, "").replace(/-(?:original|thumbnail|medium|large)$/, "")))
      return res.status(400).json({ success: false, error: "Invalid filename in fileId" });

    // Verify product exists and requester is owner or admin
    const product = await Product.findById(productId).lean();
    if (!product)
      return res.status(404).json({ success: false, error: "Product not found" });

    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, error: "Not authorized to delete this image" });

    // Find the image set in the product — match by original filename
    const targetOriginalUrl = `/uploads/products/${productId}/${filename}`;
    const imageSet = product.images.find((img) => img.original === targetOriginalUrl);

    if (!imageSet)
      return res.status(404).json({ success: false, error: "Image not found in product" });

    const productDir = path.join(PRODUCTS_UPLOAD_DIR, productId);

    // Delete all 4 variants from disk — assertWithin each resolved path
    const urlsToDelete = [imageSet.original, imageSet.thumbnail, imageSet.medium, imageSet.large];
    for (const url of urlsToDelete) {
      const relPath = url.replace("/uploads/products/", "");
      const filePath = path.join(PRODUCTS_UPLOAD_DIR, relPath);
      assertWithin(filePath, PRODUCTS_UPLOAD_DIR);
      await fs.unlink(filePath).catch((e) => logger.warn(`delete variant failed (${filePath}):`, e));
    }

    // Remove image set from product document
    await Product.findByIdAndUpdate(productId, {
      $pull: { images: { original: targetOriginalUrl } },
    });

    logger.info(`deleteProductImage: removed image set for product ${productId}, file ${filename}`);
    res.status(200).json({ success: true, data: { message: "Image deleted successfully" } });
  } catch (error) {
    logger.error("deleteProductImage error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PATCH /api/uploads/product-images/:productId/reorder ─────────────────────
// Saves a new images array order to the product document.
// Body: { images: [{ original, thumbnail, medium, large }] }
export const reorderProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!VALID_OBJECT_ID.test(productId))
      return res.status(400).json({ success: false, error: "Invalid product ID" });

    const { images } = req.body;
    if (!Array.isArray(images))
      return res.status(400).json({ success: false, error: "Missing required field: images" });

    const product = await Product.findById(productId).lean();
    if (!product)
      return res.status(404).json({ success: false, error: "Product not found" });

    const isOwner = product.vendor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin)
      return res.status(403).json({ success: false, error: "Not authorized to reorder images for this product" });

    await Product.findByIdAndUpdate(productId, { $set: { images } });

    res.status(200).json({ success: true, data: { message: "Images reordered successfully" } });
  } catch (error) {
    logger.error("reorderProductImages error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};
