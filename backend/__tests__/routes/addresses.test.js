import { describe, it, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Address from "../../src/models/addressModel.js";

// ─── These tests assume a running MongoDB and seeded customer user ────────────
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

const VALID_ADDRESS = {
  fullName:   "Jane Doe",
  phone:      "1234567890",
  street:     "123 Main Street",
  city:       "New York",
  state:      "NY",
  postalCode: "10001",
  country:    "US",
  label:      "home",
};

describe("Addresses API", () => {
  let customerToken;
  let otherToken;

  beforeAll(async () => {
    const [c1, c2] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "customer@test.com",  password: "Test1234!" }),
      request(app).post("/api/auth/login").send({ email: "customer2@test.com", password: "Test1234!" }),
    ]);
    customerToken = c1.body.data?.accessToken;
    otherToken    = c2.body.data?.accessToken;
  });

  afterEach(async () => {
    await Address.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it("GET /api/addresses — 401 without token", async () => {
    const res = await request(app).get("/api/addresses");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("POST /api/addresses — 401 without token", async () => {
    const res = await request(app).post("/api/addresses").send(VALID_ADDRESS);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // ─── GET addresses ─────────────────────────────────────────────────────────

  it("GET /api/addresses — 200 empty array for new user", async () => {
    const res = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  // ─── POST — create address ──────────────────────────────────────────────────

  it("POST /api/addresses — 201 creates address", async () => {
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fullName).toBe(VALID_ADDRESS.fullName);
    expect(res.body.data.isDefault).toBe(true); // first address auto-defaults
    expect(res.body.data.id).toBeDefined();
  });

  it("POST /api/addresses — 400 missing fullName", async () => {
    const { fullName: _, ...body } = VALID_ADDRESS;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/fullName/i);
  });

  it("POST /api/addresses — 400 missing phone", async () => {
    const { phone: _, ...body } = VALID_ADDRESS;
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/phone/i);
  });

  it("POST /api/addresses — second address does NOT auto-default", async () => {
    await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);

    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ ...VALID_ADDRESS, label: "work" });

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(false);
  });

  it("POST /api/addresses — 400 when limit of 5 reached", async () => {
    // Create 5 addresses first
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post("/api/addresses")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ ...VALID_ADDRESS, street: `${i + 1} Main St` });
    }
    const res = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/maximum/i);
  });

  // ─── PUT — update address ──────────────────────────────────────────────────

  it("PUT /api/addresses/:id — 200 updates fields", async () => {
    const createRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    const id = createRes.body.data.id;

    const res = await request(app)
      .put(`/api/addresses/${id}`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ city: "Brooklyn" });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe("Brooklyn");
    expect(res.body.data.street).toBe(VALID_ADDRESS.street); // unchanged
  });

  it("PUT /api/addresses/:id — 404 not found / wrong user", async () => {
    const createRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    const id = createRes.body.data.id;

    // Other user cannot update
    const res = await request(app)
      .put(`/api/addresses/${id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ city: "Boston" });
    expect(res.status).toBe(404);
  });

  it("PUT /api/addresses/:id — 400 invalid ObjectId", async () => {
    const res = await request(app)
      .put("/api/addresses/not-an-id")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ city: "Chicago" });
    expect(res.status).toBe(400);
  });

  // ─── PUT — set default ─────────────────────────────────────────────────────

  it("PUT /api/addresses/:id/default — 200 sets default and clears others", async () => {
    // Create two addresses
    const [a1, a2] = await Promise.all([
      request(app).post("/api/addresses").set("Authorization", `Bearer ${customerToken}`).send(VALID_ADDRESS),
      request(app).post("/api/addresses").set("Authorization", `Bearer ${customerToken}`).send({ ...VALID_ADDRESS, label: "work" }),
    ]);

    // Set second as default
    const id2 = a2.body.data.id;
    const res = await request(app)
      .put(`/api/addresses/${id2}/default`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isDefault).toBe(true);

    // First should no longer be default
    const list = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`);
    const defaults = list.body.data.filter((a) => a.isDefault);
    expect(defaults).toHaveLength(1);
    expect(defaults[0].id).toBe(id2);
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  it("DELETE /api/addresses/:id — 200 deletes address", async () => {
    const createRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    const id = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/addresses/${id}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const list = await request(app)
      .get("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`);
    expect(list.body.data).toHaveLength(0);
  });

  it("DELETE /api/addresses/:id — 404 wrong user", async () => {
    const createRes = await request(app)
      .post("/api/addresses")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(VALID_ADDRESS);
    const id = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/addresses/${id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(404);
  });
});
