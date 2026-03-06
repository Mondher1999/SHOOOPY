import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Cart from "../../src/models/cartModel.js";

// ─── These tests assume a running MongoDB and seeded admin + product ──────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

describe("Cart API", () => {
  let customerToken;
  let productId;

  beforeAll(async () => {
    // Login as customer
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@test.com", password: "Test1234!" });
    customerToken = loginRes.body.data?.accessToken;

    // Get a product ID
    const productsRes = await request(app).get("/api/products?limit=1");
    productId = productsRes.body.data?.products?.[0]?.id;
  });

  afterEach(async () => {
    // Clear the test user's cart between tests
    await Cart.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────

  it("GET /api/cart — 401 without token", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/items — 401 without token", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── GET cart ─────────────────────────────────────────────────────────────

  it("GET /api/cart — 200 empty cart for new user", async () => {
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.totalPrice).toBe(0);
  });

  // ─── Add item ─────────────────────────────────────────────────────────────

  it("POST /api/cart/items — 400 missing productId", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/productId/i);
  });

  it("POST /api/cart/items — 400 invalid ObjectId", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: "not-valid", quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/items — 400 quantity 0", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 0 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/items — 404 non-existent product", async () => {
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId: "000000000000000000000000", quantity: 1 });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/items — 200 adds item to cart", async () => {
    if (!productId) return; // skip if no products seeded
    const res = await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(1);
    expect(res.body.data.totalPrice).toBeGreaterThan(0);
  });

  // ─── Update quantity ──────────────────────────────────────────────────────

  it("PUT /api/cart/items/:productId — 404 item not in cart", async () => {
    const res = await request(app)
      .put(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ quantity: 2 });
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("PUT /api/cart/items/:productId — 400 missing quantity", async () => {
    const res = await request(app)
      .put(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  // ─── Remove item ──────────────────────────────────────────────────────────

  it("DELETE /api/cart/items/:productId — 404 item not in cart", async () => {
    const res = await request(app)
      .delete(`/api/cart/items/${productId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  // ─── Clear cart ───────────────────────────────────────────────────────────

  it("DELETE /api/cart — 200 clears cart (even if empty)", async () => {
    const res = await request(app)
      .delete("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Cart cleared");
  });

  // ─── Merge cart ───────────────────────────────────────────────────────────

  it("POST /api/cart/merge — 400 items not an array", async () => {
    const res = await request(app)
      .post("/api/cart/merge")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: "invalid" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/merge — 400 invalid productId in items", async () => {
    const res = await request(app)
      .post("/api/cart/merge")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ productId: "bad-id", quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/cart/merge — 200 merges valid items", async () => {
    if (!productId) return;
    const res = await request(app)
      .post("/api/cart/merge")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ productId, quantity: 1 }] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });
});
