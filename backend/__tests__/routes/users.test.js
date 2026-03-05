/**
 * User routes integration tests — Jest + Supertest
 * Run: npx jest __tests__/routes/users.test.js
 *
 * Requires: running MongoDB (set MONGODB_URI_TEST in .env.test)
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/userModel.js";

let customerToken;
let adminToken;
let customerId;
let adminId;

beforeAll(async () => {
  // Create test users
  const customer = await User.create({
    name: "Test Customer",
    email: "customer.test@shopflow.com",
    password: "Test@12345",
    role: "customer",
    isVerified: true,
  });
  customerId = customer._id.toString();

  const admin = await User.create({
    name: "Test Admin",
    email: "admin.test@shopflow.com",
    password: "Admin@12345",
    role: "admin",
    isVerified: true,
  });
  adminId = admin._id.toString();

  // Obtain tokens
  const custLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "customer.test@shopflow.com", password: "Test@12345" });
  customerToken = custLogin.body.data?.accessToken;

  const admLogin = await request(app)
    .post("/api/auth/login")
    .send({ email: "admin.test@shopflow.com", password: "Admin@12345" });
  adminToken = admLogin.body.data?.accessToken;
});

afterAll(async () => {
  await User.deleteMany({ email: { $in: ["customer.test@shopflow.com", "admin.test@shopflow.com"] } });
  await mongoose.connection.close();
});

// ─── GET /api/users/profile ────────────────────────────────────────────────
describe("GET /api/users/profile", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns profile for authenticated user", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty("email", "customer.test@shopflow.com");
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data).not.toHaveProperty("refreshToken");
  });
});

// ─── PUT /api/users/profile ────────────────────────────────────────────────
describe("PUT /api/users/profile", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).put("/api/users/profile").send({ name: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty body", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("updates name successfully", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("returns 409 if email already taken", async () => {
    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ email: "admin.test@shopflow.com" });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

// ─── PUT /api/users/change-password ──────────────────────────────────────────
describe("PUT /api/users/change-password", () => {
  it("returns 401 without token", async () => {
    const res = await request(app)
      .put("/api/users/change-password")
      .send({ currentPassword: "Test@12345", newPassword: "New@12345" });
    expect(res.status).toBe(401);
  });

  it("returns 400 if currentPassword missing", async () => {
    const res = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ newPassword: "New@12345" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/currentPassword/);
  });

  it("returns 400 if newPassword too short", async () => {
    const res = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ currentPassword: "Test@12345", newPassword: "short" });
    expect(res.status).toBe(400);
  });

  it("returns 400 if currentPassword is incorrect", async () => {
    const res = await request(app)
      .put("/api/users/change-password")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ currentPassword: "WrongPass!", newPassword: "NewPass@1234" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/incorrect/);
  });
});

// ─── GET /api/users (admin) ────────────────────────────────────────────────
describe("GET /api/users", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("returns 403 for customer role", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns paginated user list for admin", async () => {
    const res = await request(app)
      .get("/api/users?page=1&limit=5")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.users)).toBe(true);
    expect(res.body.data.pagination).toHaveProperty("page", 1);
    expect(res.body.data.pagination).toHaveProperty("limit", 5);
  });

  it("filters users by search query", async () => {
    const res = await request(app)
      .get("/api/users?search=Test+Customer")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.users.every((u) => /Test Customer/i.test(u.name) || /customer.test/i.test(u.email))).toBe(true);
  });
});

// ─── GET /api/users/:id ────────────────────────────────────────────────────
describe("GET /api/users/:id", () => {
  it("returns 400 for invalid ObjectId", async () => {
    const res = await request(app)
      .get("/api/users/notanid")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent user", async () => {
    const res = await request(app)
      .get("/api/users/000000000000000000000000")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it("returns user by id for admin", async () => {
    const res = await request(app)
      .get(`/api/users/${customerId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(customerId);
    expect(res.body.data).not.toHaveProperty("password");
  });
});

// ─── PUT /api/users/:id/role ───────────────────────────────────────────────
describe("PUT /api/users/:id/role", () => {
  it("returns 403 for customer", async () => {
    const res = await request(app)
      .put(`/api/users/${customerId}/role`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ role: "admin" });
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid role value", async () => {
    const res = await request(app)
      .put(`/api/users/${customerId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "superadmin" });
    expect(res.status).toBe(400);
  });

  it("updates role for admin", async () => {
    const res = await request(app)
      .put(`/api/users/${customerId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe("admin");

    // Restore
    await request(app)
      .put(`/api/users/${customerId}/role`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ role: "customer" });
  });
});

// ─── PUT /api/users/:id/ban ────────────────────────────────────────────────
describe("PUT /api/users/:id/ban", () => {
  it("returns 403 for customer", async () => {
    const res = await request(app)
      .put(`/api/users/${customerId}/ban`)
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(403);
  });

  it("returns 400 when admin tries to ban themselves", async () => {
    const res = await request(app)
      .put(`/api/users/${adminId}/ban`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Cannot ban/);
  });

  it("bans and unbans a user", async () => {
    const ban = await request(app)
      .put(`/api/users/${customerId}/ban`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(ban.status).toBe(200);
    expect(ban.body.data.isActive).toBe(false);

    const unban = await request(app)
      .put(`/api/users/${customerId}/ban`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(unban.status).toBe(200);
    expect(unban.body.data.isActive).toBe(true);
  });
});
