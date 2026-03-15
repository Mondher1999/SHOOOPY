import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Review from "../../src/models/reviewModel.js";

// ─── These tests assume a running MongoDB and seeded customer + product ────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

describe("Reviews API", () => {
  let customerToken;
  let adminToken;
  let productId;
  let createdReviewId;

  beforeAll(async () => {
    const [cust, admin] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "customer@test.com", password: "Test1234!" }),
      request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "Test1234!" }),
    ]);
    customerToken = cust.body.data?.accessToken;
    adminToken = admin.body.data?.accessToken;

    // Get a product
    const products = await request(app).get("/api/products?limit=1");
    productId = products.body.data?.products?.[0]?.id;
  });

  afterAll(async () => {
    // Cleanup test reviews
    if (createdReviewId) {
      await Review.findByIdAndDelete(createdReviewId);
    }
    await mongoose.connection.close();
  });

  // ─── Public: GET product reviews ────────────────────────────────────────────

  describe("GET /api/reviews/product/:productId", () => {
    it("returns 200 with reviews array (public)", async () => {
      const res = await request(app).get(`/api/reviews/product/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.reviews)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.ratingDistribution).toBeDefined();
      expect(res.body.data.ratingDistribution).toHaveLength(5);
    });

    it("returns 400 for invalid productId", async () => {
      const res = await request(app).get("/api/reviews/product/invalid-id");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("supports pagination params", async () => {
      const res = await request(app).get(`/api/reviews/product/${productId}?page=1&limit=5&sort=-rating`);
      expect(res.status).toBe(200);
      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  // ─── Protected: eligibility check ───────────────────────────────────────────

  describe("GET /api/reviews/eligibility/:productId", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get(`/api/reviews/eligibility/${productId}`);
      expect(res.status).toBe(401);
    });

    it("returns 200 with eligibility data", async () => {
      const res = await request(app)
        .get(`/api/reviews/eligibility/${productId}`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("canReview");
      expect(res.body.data).toHaveProperty("hasDeliveredOrder");
    });
  });

  // ─── Protected: create review ───────────────────────────────────────────────

  describe("POST /api/reviews", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .send({ product: productId, rating: 5, title: "Great", comment: "Excellent product quality" });
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing fields", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ product: productId });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for invalid rating", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ product: productId, rating: 6, title: "Good", comment: "Some comment here" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid productId", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ product: "invalid", rating: 5, title: "Test", comment: "Some comment text" });
      expect(res.status).toBe(400);
    });
  });

  // ─── Protected: update review ───────────────────────────────────────────────

  describe("PUT /api/reviews/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).put("/api/reviews/000000000000000000000000");
      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent review", async () => {
      const res = await request(app)
        .put("/api/reviews/000000000000000000000000")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ rating: 4 });
      expect(res.status).toBe(404);
    });

    it("returns 400 for invalid review ID", async () => {
      const res = await request(app)
        .put("/api/reviews/invalid-id")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ rating: 4 });
      expect(res.status).toBe(400);
    });
  });

  // ─── Protected: delete review ───────────────────────────────────────────────

  describe("DELETE /api/reviews/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/reviews/000000000000000000000000");
      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent review", async () => {
      const res = await request(app)
        .delete("/api/reviews/000000000000000000000000")
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
