/**
 * Category routes integration tests — Jest + Supertest
 * Run: npx jest __tests__/routes/categories.test.js
 *
 * Requires: running MongoDB (set MONGODB_URI_TEST in .env.test)
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/userModel.js";
import Category from "../../src/models/categoryModel.js";

let adminToken;
let customerToken;
let createdCategoryId;

beforeAll(async () => {
  // Create admin and customer test users
  const admin = await User.create({
    name: "Cat Admin",
    email: "cat.admin.test@shopflow.com",
    password: "Admin@12345",
    role: "admin",
    isVerified: true,
  });

  const customer = await User.create({
    name: "Cat Customer",
    email: "cat.customer.test@shopflow.com",
    password: "Test@12345",
    role: "customer",
    isVerified: true,
  });

  const adminLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "cat.admin.test@shopflow.com", password: "Admin@12345" });
  adminToken = adminLogin.body.data.accessToken;

  const custLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "cat.customer.test@shopflow.com", password: "Test@12345" });
  customerToken = custLogin.body.data.accessToken;
});

afterAll(async () => {
  await Category.deleteMany({ name: /^Test Category/ });
  await User.deleteMany({ email: /cat\.(admin|customer)\.test@shopflow\.com/ });
  await mongoose.connection.close();
});

// ── GET /api/categories ────────────────────────────────────────────────────────
describe("GET /api/categories", () => {
  it("returns empty list when no categories", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("is public — no auth required", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
  });
});

// ── GET /api/categories/tree ───────────────────────────────────────────────────
describe("GET /api/categories/tree", () => {
  it("returns tree structure (public)", async () => {
    const res = await request(app).get("/api/categories/tree");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── POST /api/categories ───────────────────────────────────────────────────────
describe("POST /api/categories", () => {
  it("returns 401 without auth token", async () => {
    const res = await request(app)
      .post("/api/categories")
      .send({ name: "Test Category Unauth" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 for customer role", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Test Category Customer" });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "no name" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/name/i);
  });

  it("creates category successfully (admin)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Category Alpha", description: "A test category" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Test Category Alpha");
    expect(res.body.data.slug).toBe("test-category-alpha");
    expect(res.body.data.id).toBeDefined();
    createdCategoryId = res.body.data.id;
  });

  it("returns 409 for duplicate name", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Category Alpha" });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/categories/:id ────────────────────────────────────────────────────
describe("GET /api/categories/:id", () => {
  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app).get("/api/categories/invalid-id");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 for non-existent category", async () => {
    const res = await request(app).get("/api/categories/000000000000000000000000");
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("returns category by ID", async () => {
    const res = await request(app).get(`/api/categories/${createdCategoryId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(createdCategoryId);
  });
});

// ── PUT /api/categories/:id ────────────────────────────────────────────────────
describe("PUT /api/categories/:id", () => {
  it("returns 401 without auth", async () => {
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .send({ description: "updated" });
    expect(res.status).toBe(401);
  });

  it("returns 403 for customer role", async () => {
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ description: "updated" });
    expect(res.status).toBe(403);
  });

  it("updates category as admin", async () => {
    const res = await request(app)
      .put(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ description: "Updated description" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe("Updated description");
  });
});

// ── DELETE /api/categories/:id ─────────────────────────────────────────────────
describe("DELETE /api/categories/:id", () => {
  it("returns 401 without auth", async () => {
    const res = await request(app).delete(`/api/categories/${createdCategoryId}`);
    expect(res.status).toBe(401);
  });

  it("returns 403 for customer role", async () => {
    const res = await request(app)
      .delete(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it("deletes category as admin", async () => {
    const res = await request(app)
      .delete(`/api/categories/${createdCategoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBeDefined();
  });

  it("returns 404 after deletion", async () => {
    const res = await request(app).get(`/api/categories/${createdCategoryId}`);
    expect(res.status).toBe(404);
  });
});
