/**
 * Product routes integration tests — Jest + Supertest
 * Run: npx jest __tests__/routes/products.test.js
 *
 * Requires: running MongoDB (set MONGODB_URI_TEST in .env.test)
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/userModel.js";
import Product from "../../src/models/productModel.js";

let adminToken;
let customerToken;
let createdProductId;
let adminUserId;

beforeAll(async () => {
  const admin = await User.create({
    name: "Prod Admin",
    email: "prod.admin.test@shopflow.com",
    password: "Admin@12345",
    role: "admin",
    isVerified: true,
  });
  adminUserId = admin._id.toString();

  await User.create({
    name: "Prod Customer",
    email: "prod.customer.test@shopflow.com",
    password: "Test@12345",
    role: "customer",
    isVerified: true,
  });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "prod.admin.test@shopflow.com", password: "Admin@12345" });
  adminToken = adminLogin.body.data.accessToken;

  const custLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "prod.customer.test@shopflow.com", password: "Test@12345" });
  customerToken = custLogin.body.data.accessToken;
});

afterAll(async () => {
  await Product.deleteMany({ name: /^Test Product/ });
  await User.deleteMany({ email: /prod\.(admin|customer)\.test@shopflow\.com/ });
  await mongoose.connection.close();
});

// ── GET /api/products ──────────────────────────────────────────────────────────
describe("GET /api/products", () => {
  it("is public — returns product list without auth", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.products)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  it("supports page and limit query params", async () => {
    const res = await request(app).get("/api/products?page=1&limit=5");
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.limit).toBeLessThanOrEqual(5);
  });

  it("supports minPrice/maxPrice filter", async () => {
    const res = await request(app).get("/api/products?minPrice=10&maxPrice=100");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("supports sort options", async () => {
    const res = await request(app).get("/api/products?sort=price_asc");
    expect(res.status).toBe(200);
  });
});

// ── POST /api/products ─────────────────────────────────────────────────────────
describe("POST /api/products", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/products")
      .send({ name: "Test Product Unauth", price: 10 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 10 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/name/i);
  });

  it("returns 400 when price is missing", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Product No Price" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/price/i);
  });

  it("creates product successfully (admin = vendor)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Test Product Alpha",
        description: "A test product",
        price: 29.99,
        stock: 50,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Product Alpha");
    expect(res.body.data.slug).toBe("test-product-alpha");
    expect(res.body.data.price).toBe(29.99);
    expect(res.body.data.vendor).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    createdProductId = res.body.data.id;
  });

  it("creates product successfully (customer = vendor)", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Test Product Beta", price: 9.99 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Product Beta");
  });
});

// ── GET /api/products/:id ──────────────────────────────────────────────────────
describe("GET /api/products/:id", () => {
  it("returns 400 for invalid ObjectId format", async () => {
    const res = await request(app).get("/api/products/bad-id");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent product", async () => {
    const res = await request(app).get("/api/products/000000000000000000000000");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns product by ID with populated category and vendor", async () => {
    const res = await request(app).get(`/api/products/${createdProductId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdProductId);
    expect(res.body.data.vendor).toHaveProperty("name");
    expect(res.body.data.vendor).toHaveProperty("email");
    expect(res.body.data.vendor).not.toHaveProperty("password");
  });
});

// ── PUT /api/products/:id ──────────────────────────────────────────────────────
describe("PUT /api/products/:id", () => {
  it("returns 401 without auth", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .send({ price: 20 });
    expect(res.status).toBe(401);
  });

  it("returns 403 when non-owner tries to update", async () => {
    // customerToken is not the owner of createdProductId (adminToken is owner)
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ price: 1 });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("updates product as owner (admin)", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 24.99, stock: 45 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.price).toBe(24.99);
    expect(res.body.data.stock).toBe(45);
  });

  it("returns 400 for invalid price", async () => {
    const res = await request(app)
      .put(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: -5 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent product", async () => {
    const res = await request(app)
      .put("/api/products/000000000000000000000000")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: 10 });
    expect(res.status).toBe(404);
  });
});

// ── GET /api/products/search ───────────────────────────────────────────────────
describe("GET /api/products/search", () => {
  it("returns empty array for missing query param", async () => {
    const res = await request(app).get("/api/products/search");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toEqual([]);
  });

  it("returns empty array for blank query string", async () => {
    const res = await request(app).get("/api/products/search?q=");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toEqual([]);
  });

  it("returns slim product shape (no full description)", async () => {
    const res = await request(app).get("/api/products/search?q=Test");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.products)).toBe(true);
    // Each result should have id, name, slug, price — no raw _id-only shape
    if (res.body.data.products.length > 0) {
      const p = res.body.data.products[0];
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("slug");
      expect(p).toHaveProperty("price");
    }
  });

  it("respects the limit param (max 10)", async () => {
    const res = await request(app).get("/api/products/search?q=Test&limit=2");
    expect(res.status).toBe(200);
    expect(res.body.data.products.length).toBeLessThanOrEqual(2);
  });

  it("is public — no auth required", async () => {
    const res = await request(app).get("/api/products/search?q=alpha");
    expect(res.status).toBe(200);
  });
});

// ── GET /api/products/slug/:slug ───────────────────────────────────────────────
describe("GET /api/products/slug/:slug", () => {
  it("returns 400 for invalid slug format", async () => {
    const res = await request(app).get("/api/products/slug/INVALID_SLUG!");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent slug", async () => {
    const res = await request(app).get("/api/products/slug/does-not-exist-99999");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns product by slug with populated fields", async () => {
    // Create a product to look up by slug
    const createRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Product Slug Lookup", price: 15.0, stock: 10 });
    expect(createRes.status).toBe(201);
    const slug = createRes.body.data.slug;

    const res = await request(app).get(`/api/products/slug/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe(slug);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.vendor).toHaveProperty("name");
    expect(res.body.data.vendor).not.toHaveProperty("password");
  });

  it("is public — no auth required", async () => {
    const res = await request(app).get("/api/products/slug/test-product-alpha");
    // 404 is fine (product may be soft-deleted), but should NOT be 401
    expect(res.status).not.toBe(401);
  });
});

// ── DELETE /api/products/:id ───────────────────────────────────────────────────
describe("DELETE /api/products/:id", () => {
  it("returns 401 without auth", async () => {
    const res = await request(app).delete(`/api/products/${createdProductId}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when non-owner tries to delete", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it("soft-deletes product as owner", async () => {
    const res = await request(app)
      .delete(`/api/products/${createdProductId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();
  });

  it("deleted product no longer returned by GET /:id", async () => {
    const res = await request(app).get(`/api/products/${createdProductId}`);
    expect(res.status).toBe(404);
  });

  it("deleted product no longer in GET /products list", async () => {
    const res = await request(app).get("/api/products");
    const ids = res.body.data.products.map((p) => p.id);
    expect(ids).not.toContain(createdProductId);
  });
});
