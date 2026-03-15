import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Subscriber from "../../src/models/subscriberModel.js";

// ─── These tests assume a running MongoDB and seeded admin user ─────────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

describe("Subscribers API", () => {
  let adminToken;
  let createdSubscriberIds = [];
  const testEmail = `test-subscriber-${Date.now()}@example.com`;
  const duplicateEmail = `test-dup-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Login as admin
    const admin = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@test.com", password: "Test1234!" });
    adminToken = admin.body.data?.accessToken;
  });

  afterAll(async () => {
    // Cleanup test subscribers
    if (createdSubscriberIds.length > 0) {
      await Subscriber.deleteMany({ _id: { $in: createdSubscriberIds } });
    }
    // Also clean up by email patterns used in tests
    await Subscriber.deleteMany({ email: { $regex: /^test-(subscriber|dup|invalid)-/ } });
    await mongoose.connection.close();
  });

  // ─── Public: POST /api/subscribers ──────────────────────────────────────────

  describe("POST /api/subscribers", () => {
    it("returns 201 for valid email subscription", async () => {
      const res = await request(app)
        .post("/api/subscribers")
        .send({ email: testEmail });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("email", testEmail);
      expect(res.body.data).toHaveProperty("subscribedAt");

      // Track for cleanup — find the created doc to get its _id
      const doc = await Subscriber.findOne({ email: testEmail });
      if (doc) createdSubscriberIds.push(doc._id);
    });

    it("returns 400 for missing email", async () => {
      const res = await request(app)
        .post("/api/subscribers")
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/email/i);
    });

    it("returns 400 for invalid email format", async () => {
      const res = await request(app)
        .post("/api/subscribers")
        .send({ email: "not-an-email" });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid/i);
    });

    it("returns 409 for duplicate email", async () => {
      // First subscription
      const first = await request(app)
        .post("/api/subscribers")
        .send({ email: duplicateEmail });
      expect(first.status).toBe(201);

      const doc = await Subscriber.findOne({ email: duplicateEmail });
      if (doc) createdSubscriberIds.push(doc._id);

      // Duplicate subscription
      const res = await request(app)
        .post("/api/subscribers")
        .send({ email: duplicateEmail });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/already subscribed/i);
    });

    it("returns 200 when reactivating an inactive subscriber", async () => {
      const reactivateEmail = `test-subscriber-reactivate-${Date.now()}@example.com`;

      // Subscribe
      await request(app).post("/api/subscribers").send({ email: reactivateEmail });
      const doc = await Subscriber.findOne({ email: reactivateEmail });
      if (doc) {
        createdSubscriberIds.push(doc._id);
        // Deactivate directly in DB
        doc.isActive = false;
        await doc.save();
      }

      // Re-subscribe should return 200 (reactivation)
      const res = await request(app)
        .post("/api/subscribers")
        .send({ email: reactivateEmail });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("email", reactivateEmail);
    });
  });

  // ─── Admin: GET /api/subscribers ────────────────────────────────────────────

  describe("GET /api/subscribers", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/subscribers");
      expect(res.status).toBe(401);
    });

    it("returns 200 with subscribers array for admin", async () => {
      const res = await request(app)
        .get("/api/subscribers")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.subscribers)).toBe(true);
      expect(res.body.data).toHaveProperty("total");
      expect(res.body.data).toHaveProperty("page");
      expect(res.body.data).toHaveProperty("pages");
    });

    it("supports pagination params", async () => {
      const res = await request(app)
        .get("/api/subscribers?page=1&limit=5")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
    });
  });

  // ─── Admin: DELETE /api/subscribers/:id ─────────────────────────────────────

  describe("DELETE /api/subscribers/:id", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).delete("/api/subscribers/000000000000000000000000");
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid subscriber ID", async () => {
      const res = await request(app)
        .delete("/api/subscribers/invalid-id")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 404 for non-existent subscriber", async () => {
      const res = await request(app)
        .delete("/api/subscribers/000000000000000000000000")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it("returns 200 when soft-deleting an active subscriber", async () => {
      // Create a subscriber to delete
      const deleteEmail = `test-subscriber-delete-${Date.now()}@example.com`;
      await request(app).post("/api/subscribers").send({ email: deleteEmail });
      const doc = await Subscriber.findOne({ email: deleteEmail });
      expect(doc).not.toBeNull();
      createdSubscriberIds.push(doc._id);

      const res = await request(app)
        .delete(`/api/subscribers/${doc._id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify soft delete
      const updated = await Subscriber.findById(doc._id);
      expect(updated.isActive).toBe(false);
    });
  });

  // ─── Admin: GET /api/subscribers/export ─────────────────────────────────────

  describe("GET /api/subscribers/export", () => {
    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/subscribers/export");
      expect(res.status).toBe(401);
    });

    it("returns 200 with CSV content for admin", async () => {
      const res = await request(app)
        .get("/api/subscribers/export")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toMatch(/text\/csv/);
      expect(res.headers["content-disposition"]).toMatch(/subscribers\.csv/);
      // CSV should start with header row
      expect(res.text).toMatch(/^email,subscribedAt,source/);
    });
  });
});
