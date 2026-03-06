import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Order from "../../src/models/orderModel.js";
import Address from "../../src/models/addressModel.js";
import Cart from "../../src/models/cartModel.js";

// ─── These tests assume a running MongoDB and seeded customer + product ────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

const VALID_ADDRESS_BODY = {
  fullName:   "Test User",
  phone:      "9876543210",
  street:     "456 Oak Avenue",
  city:       "Chicago",
  state:      "IL",
  postalCode: "60601",
  country:    "US",
  label:      "home",
};

describe("Orders API", () => {
  let customerToken;
  let otherToken;
  let productId;
  let addressId;

  beforeAll(async () => {
    const [c1, c2] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "customer@test.com",  password: "Test1234!" }),
      request(app).post("/api/auth/login").send({ email: "customer2@test.com", password: "Test1234!" }),
    ]);
    customerToken = c1.body.data?.accessToken;
    otherToken    = c2.body.data?.accessToken;

    // Get a product
    const products = await request(app).get("/api/products?limit=1");
    productId = products.body.data?.products?.[0]?.id;
  });

  beforeAll(async () => {
    // Create a test address for checkout
    const addrRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS_BODY);
    addressId = addrRes.body.data?.id;
  });

  afterEach(async () => {
    await Promise.all([
      Order.deleteMany({}),
      Cart.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await Address.deleteMany({});
    await mongoose.connection.close();
  });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it("POST /api/orders — 401 without token", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ addressId });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/orders/my-orders — 401 without token", async () => {
    const res = await request(app).get("/api/orders/my-orders");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── POST — place order ────────────────────────────────────────────────────

  it("POST /api/orders — 400 missing addressId", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/addressId/i);
  });

  it("POST /api/orders — 400 invalid ObjectId for addressId", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId: "not-an-id" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/orders — 400 empty cart", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/cart is empty/i);
  });

  it("POST /api/orders — 404 address not found / wrong user", async () => {
    // Add item to cart first
    if (productId) {
      await request(app)
        .post("/api/cart/items")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ productId, quantity: 1 });
    }

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId: "000000000000000000000000" });

    // Either 404 (not found) or 400 (empty cart if no product seeded)
    expect([400, 404]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/orders — 201 places order (requires product + address)", async () => {
    if (!productId || !addressId) return; // skip if not seeded

    // Add to cart
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderNumber).toMatch(/^ORD-\d{8}-\d{4}$/);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.paymentMethod).toBe("COD");
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.shippingAddress.fullName).toBe(VALID_ADDRESS_BODY.fullName);
    expect(res.body.data.statusHistory).toHaveLength(1);

    // Verify cart was cleared
    const cart = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(cart.body.data.items).toHaveLength(0);
  });

  // ─── GET my-orders ─────────────────────────────────────────────────────────

  it("GET /api/orders/my-orders — 200 returns paginated orders", async () => {
    const res = await request(app)
      .get("/api/orders/my-orders?page=1&limit=5")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.orders)).toBe(true);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 5,
      total: expect.any(Number),
      pages: expect.any(Number),
    });
  });

  // ─── GET order by ID ───────────────────────────────────────────────────────

  it("GET /api/orders/:id — 400 invalid ObjectId", async () => {
    const res = await request(app)
      .get("/api/orders/not-an-id")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/orders/:id — 404 non-existent order", async () => {
    const res = await request(app)
      .get("/api/orders/000000000000000000000000")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("GET /api/orders/:id — 404 another user's order", async () => {
    if (!productId || !addressId) return;

    // Place order as customer
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 1 });
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = orderRes.body.data?.id;
    if (!orderId) return;

    // Try to access as other user (expect 404 — not their order)
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });

  // ─── PUT — cancel order ────────────────────────────────────────────────────

  it("PUT /api/orders/:id/cancel — 400 invalid ObjectId", async () => {
    const res = await request(app)
      .put("/api/orders/bad-id/cancel")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(400);
  });

  it("PUT /api/orders/:id/cancel — 404 non-existent order", async () => {
    const res = await request(app)
      .put("/api/orders/000000000000000000000000/cancel")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(404);
  });

  it("PUT /api/orders/:id/cancel — 200 cancels pending order, restores stock", async () => {
    if (!productId || !addressId) return;

    // Get current stock
    const productBefore = await request(app).get(`/api/products/${productId}`);
    const stockBefore = productBefore.body.data?.stock ?? 0;

    // Add to cart and place order
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 1 });
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = orderRes.body.data?.id;
    if (!orderId) return;

    // Cancel
    const cancelRes = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe("cancelled");
    expect(cancelRes.body.data.statusHistory.at(-1).status).toBe("cancelled");

    // Verify stock restored
    const productAfter = await request(app).get(`/api/products/${productId}`);
    expect(productAfter.body.data?.stock).toBe(stockBefore);
  });

  it("PUT /api/orders/:id/cancel — 400 cannot cancel non-pending order", async () => {
    if (!productId || !addressId) return;

    // Place and immediately cancel to get a cancelled order
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ productId, quantity: 1 });
    const orderRes = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ addressId });
    const orderId = orderRes.body.data?.id;
    if (!orderId) return;

    await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    // Try to cancel again
    const res = await request(app)
      .put(`/api/orders/${orderId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/cannot be cancelled/i);
  });
});
