/**
 * Upload routes integration tests — Jest + Supertest
 * Run: npx jest __tests__/routes/uploads.test.js
 *
 * Requires: running MongoDB (set MONGODB_URI_TEST in .env.test)
 * Note: Tests skip disk-based assertions (sharp output) — they verify HTTP contracts.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/userModel.js";
import Product from "../../src/models/productModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Small 1×1 pixel JPEG for testing — avoids needing real image files
const FIXTURE_IMAGE = path.join(__dirname, "../fixtures/test-image.jpg");

let adminToken;
let customerToken;
let testProductId;

beforeAll(async () => {
  // Ensure fixture directory + minimal JPEG exist
  const fixtureDir = path.join(__dirname, "../fixtures");
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
  if (!fs.existsSync(FIXTURE_IMAGE)) {
    // Minimal valid JPEG (smallest possible — 1×1 white pixel)
    const minimalJpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k=",
      "base64"
    );
    fs.writeFileSync(FIXTURE_IMAGE, minimalJpeg);
  }

  // Create admin user
  const admin = await User.create({
    name: "Upload Admin",
    email: "upload.admin.test@shopflow.com",
    password: "Admin@12345",
    role: "admin",
    isVerified: true,
  });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "upload.admin.test@shopflow.com", password: "Admin@12345" });
  adminToken = adminLogin.body.data.accessToken;

  // Create customer user
  await User.create({
    name: "Upload Customer",
    email: "upload.customer.test@shopflow.com",
    password: "Customer@12345",
    role: "customer",
    isVerified: true,
  });

  const customerLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "upload.customer.test@shopflow.com", password: "Customer@12345" });
  customerToken = customerLogin.body.data.accessToken;

  // Create a test product
  const product = await Product.create({
    name: "Upload Test Product",
    price: 10,
    vendor: admin._id,
  });
  testProductId = product._id.toString();
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ["upload.admin.test@shopflow.com", "upload.customer.test@shopflow.com"] } });
  await Product.deleteMany({ name: "Upload Test Product" });
  await mongoose.connection.close();
});

// ─── POST /api/uploads/product-images ─────────────────────────────────────────

describe("POST /api/uploads/product-images", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .field("productId", testProductId)
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 for customer role", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${customerToken}`)
      .field("productId", testProductId)
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when productId is missing", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${adminToken}`)
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/productId/i);
  });

  it("returns 400 for invalid productId format", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("productId", "not-an-objectid")
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent product", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("productId", "000000000000000000000000")
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when no files are attached", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("productId", testProductId);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("successfully uploads a valid image and returns image objects", async () => {
    const res = await request(app)
      .post("/api/uploads/product-images")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("productId", testProductId)
      .attach("files", FIXTURE_IMAGE);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.images)).toBe(true);
    expect(res.body.data.images.length).toBe(1);

    const img = res.body.data.images[0];
    expect(img).toHaveProperty("original");
    expect(img).toHaveProperty("thumbnail");
    expect(img).toHaveProperty("medium");
    expect(img).toHaveProperty("large");
    // All URLs should point to the correct product directory
    expect(img.original).toContain(`/uploads/products/${testProductId}/`);
    expect(img.thumbnail).toContain(`/uploads/products/${testProductId}/`);
  });
});

// ─── DELETE /api/uploads/product-images/:fileId ───────────────────────────────

describe("DELETE /api/uploads/product-images/:fileId", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .delete(`/api/uploads/product-images/${testProductId}:somefile.jpg`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid fileId (path traversal attempt)", async () => {
    const badFileId = encodeURIComponent("../../../etc/passwd");
    const res = await request(app)
      .delete(`/api/uploads/product-images/${badFileId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid fileId format (missing colon separator)", async () => {
    const res = await request(app)
      .delete("/api/uploads/product-images/invalidfileid")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 when image not found in product", async () => {
    const fileId = encodeURIComponent(`${testProductId}:nonexistent-original.jpg`);
    const res = await request(app)
      .delete(`/api/uploads/product-images/${fileId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── PATCH /api/uploads/product-images/:productId/reorder ────────────────────

describe("PATCH /api/uploads/product-images/:productId/reorder", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .patch(`/api/uploads/product-images/${testProductId}/reorder`)
      .send({ images: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 for invalid productId", async () => {
    const res = await request(app)
      .patch("/api/uploads/product-images/invalid-id/reorder")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ images: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when images field is missing", async () => {
    const res = await request(app)
      .patch(`/api/uploads/product-images/${testProductId}/reorder`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("successfully reorders product images", async () => {
    const mockImages = [
      { original: "/uploads/products/id/img-original.jpg", thumbnail: "/uploads/products/id/img-thumbnail.webp", medium: "/uploads/products/id/img-medium.webp", large: "/uploads/products/id/img-large.webp" },
    ];

    const res = await request(app)
      .patch(`/api/uploads/product-images/${testProductId}/reorder`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ images: mockImages });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
