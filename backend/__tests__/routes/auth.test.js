/**
 * Auth endpoint tests — requires Jest + Supertest
 * Setup: npm install -D jest supertest @jest/globals
 * Run: npx jest --testPathPattern=auth.test.js
 *
 * NOTE: Tests require a running MongoDB instance (MONGODB_URI in .env.test)
 * and valid JWT secrets. Set up .env.test before running.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import User from "../../src/models/userModel.js";

const TEST_USER = {
  name: "Test User",
  email: "auth-test@shopflow.com",
  password: "Password123!",
};

let accessToken = "";
let refreshToken = "";

beforeAll(async () => {
  // Remove leftover test user
  await User.deleteOne({ email: TEST_USER.email });
});

afterAll(async () => {
  await User.deleteOne({ email: TEST_USER.email });
  await mongoose.connection.close();
});

// ─── Register ────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("returns 201 and tokens with valid data", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(TEST_USER.email);
    // Sensitive fields must NOT appear
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.user.refreshToken).toBeUndefined();
    // id should be present, _id should not
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.user._id).toBeUndefined();
  });

  it("returns 409 when email already exists", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Email already registered");
  });

  it("returns 400 when name is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "x@test.com", password: "Password123!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name/i);
  });

  it("returns 400 when email is invalid format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "not-an-email", password: "Password123!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 400 when password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "y@test.com", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });
});

// ─── Login ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("returns 200 and tokens with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: TEST_USER.password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.password).toBeUndefined();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("returns 401 with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "WrongPassword!" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 with non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@shopflow.com", password: "Password123!" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid email or password");
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "Password123!" });
    expect(res.status).toBe(400);
  });
});

// ─── Get Me ──────────────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("returns 200 and user object with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(TEST_USER.email);
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.data.id).toBeDefined();
  });

  it("returns 401 with no auth header", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 with malformed token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer notavalidtoken");
    expect(res.status).toBe(401);
  });

  it("returns 401 without Bearer prefix", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", accessToken);
    expect(res.status).toBe(401);
  });
});

// ─── Refresh Token ───────────────────────────────────────────────────────────

describe("POST /api/auth/refresh-token", () => {
  it("returns 200 with new tokens for valid refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Update tokens for subsequent tests
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("returns 401 when refresh token is reused (rotation)", async () => {
    // First use — should succeed
    const firstRes = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });
    expect(firstRes.status).toBe(200);
    // Second use of same token — must fail (rotated)
    const secondRes = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken });
    expect(secondRes.status).toBe(401);
    accessToken = firstRes.body.data.accessToken;
    refreshToken = firstRes.body.data.refreshToken;
  });

  it("returns 400 when refresh token is missing", async () => {
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 401 with invalid JWT", async () => {
    const res = await request(app)
      .post("/api/auth/refresh-token")
      .send({ refreshToken: "invalid.jwt.token" });
    expect(res.status).toBe(401);
  });
});

// ─── Forgot Password ─────────────────────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  it("returns 200 for existing email (no enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: TEST_USER.email });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 200 for non-existent email (no enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nobody@shopflow.com" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Same message — can't tell if email exists
    expect(res.body.data.message).toContain("If that email exists");
  });

  it("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({});
    expect(res.status).toBe(400);
  });
});

// ─── Logout ──────────────────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("returns 200 when authenticated", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it("returns 401 without auth token", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(401);
  });
});
