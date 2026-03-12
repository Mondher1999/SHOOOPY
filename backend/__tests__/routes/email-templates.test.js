/**
 * Unit tests for bilingual email templates.
 * Tests all 7 template types in EN and FR, verifying structure and language correctness.
 */
import { describe, it, expect } from "@jest/globals";
import {
  emailVerificationTemplate,
  passwordResetTemplate,
  welcomeEmailTemplate,
  orderConfirmationTemplate,
  orderShippedTemplate,
  orderDeliveredTemplate,
  orderCancelledTemplate,
} from "../../src/utils/emailTemplates.js";

const MOCK_CONFIG = { shopName: "TestShop", subjects: {}, currency: "USD" };
const MOCK_ORDER = {
  _id: "64abc123",
  orderNumber: "ORD-001",
  items: [{ name: "Widget", quantity: 2, price: 9.99 }],
  shippingCost: 5,
  totalPrice: 24.98,
  shippingAddress: {
    fullName: "John Doe",
    street: "123 Main St",
    city: "Tunis",
    state: "TN",
    postalCode: "1000",
    country: "Tunisia",
    phone: "+216 99 000 000",
  },
};

describe("emailVerificationTemplate", () => {
  it("renders English subject and content", () => {
    const result = emailVerificationTemplate("Alice", "http://example.com/verify", MOCK_CONFIG, "en");
    expect(result.subject).toContain("Verify your email");
    expect(result.html).toContain("Welcome to TestShop, Alice");
    expect(result.html).toContain("lang=\"en\"");
    expect(result.html).toContain("http://example.com/verify");
  });

  it("renders French subject and content", () => {
    const result = emailVerificationTemplate("Alice", "http://example.com/verify", MOCK_CONFIG, "fr");
    expect(result.subject).toContain("Vérifiez");
    expect(result.html).toContain("Bienvenue sur TestShop");
    expect(result.html).toContain("lang=\"fr\"");
  });

  it("falls back to English for unknown language", () => {
    const result = emailVerificationTemplate("Alice", "http://example.com/verify", MOCK_CONFIG, "zh");
    expect(result.html).toContain("Welcome to TestShop");
  });

  it("escapes HTML in user name", () => {
    const result = emailVerificationTemplate("<script>alert(1)</script>", "http://x.com", MOCK_CONFIG, "en");
    expect(result.html).not.toContain("<script>");
    expect(result.html).toContain("&lt;script&gt;");
  });

  it("includes fallback text version", () => {
    const result = emailVerificationTemplate("Alice", "http://example.com/verify", MOCK_CONFIG, "en");
    expect(result.text).toContain("http://example.com/verify");
    expect(typeof result.text).toBe("string");
  });
});

describe("passwordResetTemplate", () => {
  it("renders English content with 15-minute expiry notice", () => {
    const result = passwordResetTemplate("Bob", "http://example.com/reset", MOCK_CONFIG, "en");
    expect(result.subject).toContain("Reset your password");
    expect(result.html).toContain("15 minutes");
  });

  it("renders French content", () => {
    const result = passwordResetTemplate("Bob", "http://example.com/reset", MOCK_CONFIG, "fr");
    expect(result.subject).toContain("Réinitialisez");
    expect(result.html).toContain("15 minutes");
    expect(result.html).toContain("Bonjour Bob");
  });
});

describe("welcomeEmailTemplate", () => {
  it("renders English welcome", () => {
    const result = welcomeEmailTemplate("Charlie", MOCK_CONFIG, "en");
    expect(result.subject).toContain("Welcome to TestShop");
    expect(result.html).toContain("Cash on Delivery");
  });

  it("renders French welcome", () => {
    const result = welcomeEmailTemplate("Charlie", MOCK_CONFIG, "fr");
    expect(result.subject).toContain("Bienvenue sur TestShop");
    expect(result.html).toContain("paiement à la livraison");
  });
});

describe("orderConfirmationTemplate", () => {
  it("renders EN order confirmation with order number", () => {
    const result = orderConfirmationTemplate(MOCK_ORDER, "Dana", MOCK_CONFIG, "en");
    expect(result.subject).toBe("Order Confirmed — #ORD-001");
    expect(result.html).toContain("Order #ORD-001");
    expect(result.html).toContain("Cash on Delivery");
    expect(result.html).toContain("Widget");
  });

  it("renders FR order confirmation", () => {
    const result = orderConfirmationTemplate(MOCK_ORDER, "Dana", MOCK_CONFIG, "fr");
    expect(result.subject).toBe("Commande confirmée — #ORD-001");
    expect(result.html).toContain("Commande #ORD-001");
    expect(result.html).toContain("Contre remboursement");
  });

  it("formats currency correctly", () => {
    const result = orderConfirmationTemplate(MOCK_ORDER, "Dana", MOCK_CONFIG, "en");
    expect(result.html).toContain("$24.98");
    expect(result.html).toContain("$5.00");
  });

  it("escapes special characters in product name", () => {
    const orderWithHtml = {
      ...MOCK_ORDER,
      items: [{ name: '<b>Hack</b>', quantity: 1, price: 10 }],
    };
    const result = orderConfirmationTemplate(orderWithHtml, "Dana", MOCK_CONFIG, "en");
    expect(result.html).not.toContain("<b>Hack</b>");
    expect(result.html).toContain("&lt;b&gt;");
  });
});

describe("orderShippedTemplate", () => {
  it("renders EN shipped email", () => {
    const result = orderShippedTemplate(MOCK_ORDER, "Eve", MOCK_CONFIG, "en");
    expect(result.subject).toContain("on its way");
    expect(result.html).toContain("Shipped");
  });

  it("renders FR shipped email", () => {
    const result = orderShippedTemplate(MOCK_ORDER, "Eve", MOCK_CONFIG, "fr");
    expect(result.subject).toContain("en route");
    expect(result.html).toContain("expédiée");
  });
});

describe("orderDeliveredTemplate", () => {
  it("renders EN delivered email with total paid", () => {
    const result = orderDeliveredTemplate(MOCK_ORDER, "Frank", MOCK_CONFIG, "en");
    expect(result.subject).toBe("Order Delivered — #ORD-001");
    expect(result.html).toContain("$24.98");
    expect(result.html).toContain("Total paid");
  });

  it("renders FR delivered email", () => {
    const result = orderDeliveredTemplate(MOCK_ORDER, "Frank", MOCK_CONFIG, "fr");
    expect(result.subject).toBe("Commande livrée — #ORD-001");
    expect(result.html).toContain("Total payé");
  });
});

describe("orderCancelledTemplate", () => {
  it("renders EN cancelled by admin", () => {
    const result = orderCancelledTemplate(MOCK_ORDER, "Grace", "admin", MOCK_CONFIG, "en");
    expect(result.subject).toBe("Order Cancelled — #ORD-001");
    expect(result.html).toContain("by our team");
  });

  it("renders EN cancelled by customer", () => {
    const result = orderCancelledTemplate(MOCK_ORDER, "Grace", "customer", MOCK_CONFIG, "en");
    expect(result.html).toContain("at your request");
  });

  it("renders FR cancelled", () => {
    const result = orderCancelledTemplate(MOCK_ORDER, "Grace", "admin", MOCK_CONFIG, "fr");
    expect(result.subject).toBe("Commande annulée — #ORD-001");
    expect(result.html).toContain("par notre équipe");
  });

  it("includes item table in cancelled email", () => {
    const result = orderCancelledTemplate(MOCK_ORDER, "Grace", "customer", MOCK_CONFIG, "en");
    expect(result.html).toContain("Widget");
  });
});

describe("HTML structure", () => {
  it("all templates produce valid DOCTYPE", () => {
    const templates = [
      emailVerificationTemplate("A", "http://x.com", MOCK_CONFIG),
      passwordResetTemplate("A", "http://x.com", MOCK_CONFIG),
      welcomeEmailTemplate("A", MOCK_CONFIG),
      orderConfirmationTemplate(MOCK_ORDER, "A", MOCK_CONFIG),
      orderShippedTemplate(MOCK_ORDER, "A", MOCK_CONFIG),
      orderDeliveredTemplate(MOCK_ORDER, "A", MOCK_CONFIG),
      orderCancelledTemplate(MOCK_ORDER, "A", "customer", MOCK_CONFIG),
    ];
    for (const t of templates) {
      expect(t.html).toMatch(/^<!DOCTYPE html>/);
      expect(t.html).toContain("</html>");
      expect(t.subject).toBeTruthy();
      expect(t.text).toBeTruthy();
    }
  });

  it("all templates have lang attribute defaulting to en", () => {
    const result = emailVerificationTemplate("A", "http://x.com", MOCK_CONFIG);
    expect(result.html).toContain('lang="en"');
  });
});
