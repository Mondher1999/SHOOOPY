import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../../server.js";
import Settings from "../../src/models/settingsModel.js";

// ─── These tests assume a running MongoDB with seeded admin + customer users ──
// Run: NODE_ENV=test node --experimental-vm-modules node_modules/.bin/jest

describe("Settings API", () => {
  let adminToken;
  let customerToken;

  beforeAll(async () => {
    const [admin, customer] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "Test1234!" }),
      request(app).post("/api/auth/login").send({ email: "customer@test.com", password: "Test1234!" }),
    ]);
    adminToken = admin.body.data?.accessToken;
    customerToken = customer.body.data?.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  // ─── GET /api/settings (Public) ──────────────────────────────────────────────

  describe("GET /api/settings", () => {
    it("returns 200 with settings object (public, no auth needed)", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.store).toBeDefined();
      expect(res.body.data.orders).toBeDefined();
      expect(res.body.data.notifications).toBeDefined();
      expect(res.body.data.products).toBeDefined();
      expect(res.body.data.social).toBeDefined();
      expect(res.body.data.legal).toBeDefined();
      expect(res.body.data.seo).toBeDefined();
    });

    it("returns default values on first access", async () => {
      const res = await request(app).get("/api/settings");
      expect(res.body.data.store.name).toBe("ShopFlow");
      expect(res.body.data.store.currency).toBe("USD");
      expect(res.body.data.orders.defaultShippingCost).toBe(0);
      expect(res.body.data.products.lowStockThreshold).toBe(10);
      expect(res.body.data.products.reviewsEnabled).toBe(true);
      expect(res.body.data.products.defaultSortOrder).toBe("newest");
    });
  });

  // ─── PUT /api/settings (Admin only) ─────────────────────────────────────────

  describe("PUT /api/settings", () => {
    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .put("/api/settings")
        .send({ store: { name: "Hacked" } });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("returns 403 for non-admin user", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({ store: { name: "Hacked" } });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for empty body", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("No fields to update");
    });

    it("returns 400 for negative shipping cost", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ orders: { defaultShippingCost: -5 } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for invalid sort order", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ products: { defaultSortOrder: "invalid" } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for low stock threshold < 1", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ products: { lowStockThreshold: 0 } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("returns 400 for max images > 20", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ products: { maxImagesPerProduct: 25 } });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("updates store section successfully", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ store: { name: "Test Store", contactEmail: "test@example.com" } });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.name).toBe("Test Store");
      expect(res.body.data.store.contactEmail).toBe("test@example.com");
    });

    it("updates orders section successfully", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ orders: { defaultShippingCost: 5.99, freeShippingThreshold: 50 } });
      expect(res.status).toBe(200);
      expect(res.body.data.orders.defaultShippingCost).toBe(5.99);
      expect(res.body.data.orders.freeShippingThreshold).toBe(50);
    });

    it("updates social media URLs", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ social: { facebook: "https://facebook.com/test", instagram: "https://instagram.com/test" } });
      expect(res.status).toBe(200);
      expect(res.body.data.social.facebook).toBe("https://facebook.com/test");
      expect(res.body.data.social.instagram).toBe("https://instagram.com/test");
    });

    it("updates legal pages content", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ legal: { termsAndConditions: "Test terms and conditions content" } });
      expect(res.status).toBe(200);
      expect(res.body.data.legal.termsAndConditions).toBe("Test terms and conditions content");
    });

    it("updates SEO settings", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ seo: { metaTitleTemplate: "%s | Test", googleAnalyticsId: "G-TEST123" } });
      expect(res.status).toBe(200);
      expect(res.body.data.seo.metaTitleTemplate).toBe("%s | Test");
      expect(res.body.data.seo.googleAnalyticsId).toBe("G-TEST123");
    });

    it("updates notification toggles", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ notifications: { adminNewOrder: true, adminNotificationEmail: "admin@test.com" } });
      expect(res.status).toBe(200);
      expect(res.body.data.notifications.adminNewOrder).toBe(true);
      expect(res.body.data.notifications.adminNotificationEmail).toBe("admin@test.com");
    });

    it("partial update does not overwrite other sections", async () => {
      // First set store name
      await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ store: { name: "Preserved Name" } });

      // Then update orders
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ orders: { defaultShippingCost: 9.99 } });

      expect(res.body.data.store.name).toBe("Preserved Name");
      expect(res.body.data.orders.defaultShippingCost).toBe(9.99);
    });

    it("trims string values", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ store: { name: "  Trimmed Store  " } });
      expect(res.body.data.store.name).toBe("Trimmed Store");
    });

    // Reset to defaults after tests
    it("resets settings to defaults", async () => {
      const res = await request(app)
        .put("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          store: { name: "ShopFlow", contactEmail: "", contactPhone: "", address: "", description: "", currency: "USD", timezone: "UTC" },
          orders: { defaultShippingCost: 0, minimumOrderAmount: 0, freeShippingThreshold: 0, autoCancelPendingDays: 0 },
          social: { facebook: "", instagram: "", twitter: "", tiktok: "", youtube: "", whatsapp: "" },
          legal: { termsAndConditions: "", privacyPolicy: "", returnPolicy: "", shippingPolicy: "" },
          seo: { metaTitleTemplate: "%s | ShopFlow", metaDescription: "", googleAnalyticsId: "", facebookPixelId: "" },
        });
      expect(res.status).toBe(200);
      expect(res.body.data.store.name).toBe("ShopFlow");
    });
  });
});
