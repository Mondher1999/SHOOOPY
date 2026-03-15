import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Wishlist from "../../src/models/wishlistModel.js";

// ─── These tests assume a running MongoDB and seeded customer + product ────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

describe("Wishlist API", () => {
  let customerToken;
  let productId;

  beforeAll(async () => {
    const cust = await request(app)
      .post("/api/auth/login")
      .send({ email: "customer@test.com", password: "Test1234!" });
    customerToken = cust.body.data?.accessToken;

    // Get a product
    const products = await request(app).get("/api/products?limit=1");
    productId = products.body.data?.products?.[0]?.id;
  });

  afterAll(async () => {
    // Cleanup test wishlist
    await Wishlist.deleteMany({});
    await mongoose.connection.close();
  });

  // ─── Auth enforcement ───────────────────────────────────────────────────────

  describe("Auth enforcement", () => {
    it("GET /api/wishlist returns 401 without auth", async () => {
      const res = await request(app).get("/api/wishlist");
      expect(res.status).toBe(401);
    });

    it("POST /api/wishlist/:productId returns 401 without auth", async () => {
      const res = await request(app).post(`/api/wishlist/${productId}`);
      expect(res.status).toBe(401);
    });

    it("DELETE /api/wishlist/:productId returns 401 without auth", async () => {
      const res = await request(app).delete(`/api/wishlist/${productId}`);
      expect(res.status).toBe(401);
    });

    it("DELETE /api/wishlist returns 401 without auth", async () => {
      const res = await request(app).delete("/api/wishlist");
      expect(res.status).toBe(401);
    });
  });

  // ─── CRUD operations ───────────────────────────────────────────────────────

  describe("CRUD operations", () => {
    it("GET /api/wishlist returns empty wishlist", async () => {
      const res = await request(app)
        .get("/api/wishlist")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toEqual([]);
    });

    it("POST /api/wishlist/:productId adds product", async () => {
      const res = await request(app)
        .post(`/api/wishlist/${productId}`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });

    it("POST /api/wishlist/:productId returns 409 for duplicate", async () => {
      const res = await request(app)
        .post(`/api/wishlist/${productId}`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("DELETE /api/wishlist/:productId removes product", async () => {
      const res = await request(app)
        .delete(`/api/wishlist/${productId}`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(0);
    });

    it("DELETE /api/wishlist clears entire wishlist", async () => {
      // Add item back first
      await request(app)
        .post(`/api/wishlist/${productId}`)
        .set("Authorization", `Bearer ${customerToken}`);

      const res = await request(app)
        .delete("/api/wishlist")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  // ─── Validation ──────────────────────────────────────────────────────────────

  describe("Validation", () => {
    it("returns 400 for invalid productId format", async () => {
      const res = await request(app)
        .post("/api/wishlist/invalid-id")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent product", async () => {
      const res = await request(app)
        .post("/api/wishlist/000000000000000000000000")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });

    it("returns 404 when removing non-existent item", async () => {
      const res = await request(app)
        .delete("/api/wishlist/000000000000000000000000")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
