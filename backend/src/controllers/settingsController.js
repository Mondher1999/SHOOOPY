import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import Settings from "../models/settingsModel.js";
import Review from "../models/reviewModel.js";
import PRODUCT_TYPE_CATALOG, { isValidProductType } from "../constants/productTypeCatalog.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";
import { assertWithin } from "../utils/sanitize.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_CACHE_KEY = "settings:global";
const SETTINGS_CACHE_TTL = 300; // 5 minutes

const ENCRYPTION_KEY = process.env.SETTINGS_ENCRYPTION_KEY || process.env.JWT_ACCESS_SECRET || "default-dev-key-change-me";
if (!process.env.SETTINGS_ENCRYPTION_KEY && !process.env.JWT_ACCESS_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("FATAL: SETTINGS_ENCRYPTION_KEY must be set in production. Refusing to start with default key.");
  }
  logger.warn("SECURITY: Using default encryption key. Set SETTINGS_ENCRYPTION_KEY in production.");
}

// ─── Encryption helpers for SMTP password ────────────────────────────────────
function encrypt(text) {
  if (!text) return "";
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return salt.toString("hex") + ":" + iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  if (!text || !text.includes(":")) return "";
  try {
    const parts = text.split(":");
    // Support legacy format (iv:encrypted) and new format (salt:iv:encrypted)
    let salt, ivHex, encrypted;
    if (parts.length === 3) {
      [salt, ivHex, encrypted] = [Buffer.from(parts[0], "hex"), parts[1], parts[2]];
    } else {
      // Legacy: static salt
      [ivHex, encrypted] = parts;
      salt = "salt";
    }
    const iv = Buffer.from(ivHex, "hex");
    const key = crypto.scryptSync(ENCRYPTION_KEY, salt, 32);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

// ─── Helper: normalize lean doc ─────────────────────────────────────────────
function normalizeLean(doc) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  // Mask SMTP password
  if (rest.smtp) {
    rest.smtp = { ...rest.smtp, pass: rest.smtp.pass ? "••••••••" : "" };
  }
  return { id: _id?.toString(), ...rest };
}

// ─── GET /api/settings ──────────────────────────────────────────────────────
// Public — needed for footer social links, legal pages, and SEO
// NOTE: We intentionally avoid .lean() here because Mongoose hydrated documents
// apply schema defaults for fields missing in older MongoDB documents (e.g.
// maintenance, homepage, emailTemplates added in later sprints).
export const getSettings = async (_req, res) => {
  try {
    const cached = cache.get(SETTINGS_CACHE_KEY);
    if (cached) return res.status(200).json({ success: true, data: cached });

    let doc = await Settings.findOne({});
    if (!doc) {
      doc = await Settings.create({});
    }
    const settings = doc.toJSON();

    cache.set(SETTINGS_CACHE_KEY, settings, SETTINGS_CACHE_TTL);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    logger.error("getSettings error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── PUT /api/settings ──────────────────────────────────────────────────────
// Admin-only — accepts partial updates using dot notation for $set
export const updateSettings = async (req, res) => {
  try {
    const {
      store, orders, notifications, products, social, legal, seo,
      maintenance, homepage, header, footer, emailTemplates, smtp, typography, colorPalette,
      navigation,
    } = req.body;
    const updates = {};

    // ── Store ────────────────────────────────────────────────────────────
    if (store) {
      const strFields = ["name", "description", "contactEmail", "contactPhone", "address", "currency", "timezone", "logo", "favicon"];
      for (const field of strFields) {
        if (store[field] !== undefined) {
          updates[`store.${field}`] = String(store[field]).trim();
        }
      }
      if (store.showcaseMode !== undefined) {
        updates["store.showcaseMode"] = Boolean(store.showcaseMode);
      }
      if (store.logoEnabled !== undefined) {
        updates["store.logoEnabled"] = Boolean(store.logoEnabled);
      }
      if (store.buyNowEnabled !== undefined) {
        updates["store.buyNowEnabled"] = Boolean(store.buyNowEnabled);
      }
    }

    // ── Orders ──────────────────────────────────────────────────────────
    if (orders) {
      const numFields = ["defaultShippingCost", "minimumOrderAmount", "freeShippingThreshold", "autoCancelPendingDays"];
      for (const field of numFields) {
        if (orders[field] !== undefined) {
          const val = parseFloat(orders[field]);
          if (isNaN(val) || val < 0) {
            return res.status(400).json({ success: false, error: `Invalid value for orders.${field}` });
          }
          updates[`orders.${field}`] = val;
        }
      }
    }

    // ── Notifications ───────────────────────────────────────────────────
    if (notifications) {
      const boolFields = ["orderConfirmation", "orderStatusUpdate", "welcomeEmail", "adminNewOrder", "adminLowStock"];
      for (const field of boolFields) {
        if (notifications[field] !== undefined) {
          updates[`notifications.${field}`] = Boolean(notifications[field]);
        }
      }
      if (notifications.adminNotificationEmail !== undefined) {
        updates["notifications.adminNotificationEmail"] = String(notifications.adminNotificationEmail).trim();
      }
    }

    // ── Products ────────────────────────────────────────────────────────
    if (products) {
      if (products.lowStockThreshold !== undefined) {
        const val = parseInt(products.lowStockThreshold, 10);
        if (isNaN(val) || val < 1) {
          return res.status(400).json({ success: false, error: "Low stock threshold must be at least 1" });
        }
        updates["products.lowStockThreshold"] = val;
      }
      if (products.maxImagesPerProduct !== undefined) {
        const val = parseInt(products.maxImagesPerProduct, 10);
        if (isNaN(val) || val < 1 || val > 20) {
          return res.status(400).json({ success: false, error: "Max images must be between 1 and 20" });
        }
        updates["products.maxImagesPerProduct"] = val;
      }
      if (products.reviewsEnabled !== undefined) {
        updates["products.reviewsEnabled"] = Boolean(products.reviewsEnabled);
      }
      if (products.defaultSortOrder !== undefined) {
        const valid = ["newest", "price_asc", "price_desc", "rating"];
        if (!valid.includes(products.defaultSortOrder)) {
          return res.status(400).json({ success: false, error: "Invalid default sort order" });
        }
        updates["products.defaultSortOrder"] = products.defaultSortOrder;
      }
      if (products.productTypes !== undefined) {
        if (!Array.isArray(products.productTypes)) {
          return res.status(400).json({ success: false, error: "Product types must be an array" });
        }
        const cleanedTypes = products.productTypes.map((t) => String(t).trim()).filter(Boolean);
        const invalidTypes = cleanedTypes.filter((t) => !isValidProductType(t));
        if (invalidTypes.length > 0) {
          return res.status(400).json({ success: false, error: `Invalid product types: ${invalidTypes.join(", ")}` });
        }
        updates["products.productTypes"] = cleanedTypes;
      }
    }

    // ── Social Media ────────────────────────────────────────────────────
    if (social) {
      const socialFields = ["facebook", "instagram", "twitter", "tiktok", "youtube", "whatsapp"];
      for (const field of socialFields) {
        if (social[field] !== undefined) {
          updates[`social.${field}`] = String(social[field]).trim();
        }
      }
    }

    // ── Legal Pages ─────────────────────────────────────────────────────
    if (legal) {
      const legalFields = ["termsAndConditions", "privacyPolicy", "returnPolicy", "shippingPolicy"];
      for (const field of legalFields) {
        if (legal[field] !== undefined) {
          updates[`legal.${field}`] = String(legal[field]);
        }
      }
    }

    // ── SEO ─────────────────────────────────────────────────────────────
    if (seo) {
      const seoFields = ["metaTitleTemplate", "metaDescription", "googleAnalyticsId", "facebookPixelId"];
      for (const field of seoFields) {
        if (seo[field] !== undefined) {
          updates[`seo.${field}`] = String(seo[field]).trim();
        }
      }
    }

    // ── Maintenance Mode ────────────────────────────────────────────────
    if (maintenance) {
      if (maintenance.enabled !== undefined) {
        updates["maintenance.enabled"] = Boolean(maintenance.enabled);
      }
      if (maintenance.message !== undefined) {
        updates["maintenance.message"] = String(maintenance.message).trim();
      }
    }

    // ── Homepage ────────────────────────────────────────────────────────
    if (homepage) {
      // Homepage template (free string — validated in frontend registry)
      if (homepage.template !== undefined) {
        const template = String(homepage.template).trim();
        if (!template) {
          return res.status(400).json({ success: false, error: "Homepage template cannot be empty" });
        }
        updates["homepage.template"] = template;
      }

      // Legacy homepage mode (backward compat)
      if (homepage.mode !== undefined) {
        const mode = String(homepage.mode).trim();
        if (!["dynamic", "hardcoded"].includes(mode)) {
          return res.status(400).json({ success: false, error: "Invalid homepage mode" });
        }
        updates["homepage.mode"] = mode;
      }

      // All valid section keys across all templates
      const allSectionKeys = [
        // Dynamic template
        "hero", "valuePropositions", "collections", "featuredProducts",
        "promoBanner", "newArrivals", "testimonials", "brandStory",
        "instagram", "trustBar", "newsletter", "partners", "recentlyViewed",
        // Classic template
        "trustBadges", "trendingCategories", "topSelling",
        "welcome", "aboutUs", "brand", "seoHeadline", "gallery",
        // Bold template
        "categories", "socialProof",
        // Artisan template
        "craftStory",
        // Magazine template
        "editorial",
        // Elegant template (uses shared keys: hero, collections, featuredProducts, promoBanner, newArrivals, newsletter)
        "brandStory",
        // Noir template
        "noirCinematicHero", "noirBrandStatement", "noirProductGallery",
        "noirBenefitsTriptych", "noirStorySection", "noirTestimonials",
        "noirProductDetails", "noirPurchaseSection", "noirTrustFooter",
        // Surge template
        "surgeAnnouncementBar", "surgeHeroWithCta", "surgeSocialProofBar",
        "surgeProblemSolution", "surgeVideoDemo", "surgeBenefitsCarousel",
        "surgeComparison", "surgeTestimonialsGrid", "surgeMidPageCta",
        "surgeHowItWorks", "surgeFaqSection", "surgeFinalCta",
        "surgeGuaranteeBadge",
      ];

      // Section visibility
      if (homepage.sections !== undefined) {
        for (const [key, val] of Object.entries(homepage.sections)) {
          if (allSectionKeys.includes(key)) {
            updates[`homepage.sections.${key}`] = Boolean(val);
          }
        }
      }

      // Section ordering — validates all keys belong to allSectionKeys, no duplicates
      if (homepage.sectionOrder !== undefined) {
        if (
          !Array.isArray(homepage.sectionOrder) ||
          homepage.sectionOrder.length === 0 ||
          new Set(homepage.sectionOrder).size !== homepage.sectionOrder.length ||
          !homepage.sectionOrder.every((k) => allSectionKeys.includes(k))
        ) {
          return res.status(400).json({ success: false, error: "Invalid section order" });
        }
        updates["homepage.sectionOrder"] = homepage.sectionOrder;
      }

      // Hero slides
      if (homepage.slides !== undefined) {
        if (!Array.isArray(homepage.slides) || homepage.slides.length > 10) {
          return res.status(400).json({ success: false, error: "Slides must be an array with max 10 items" });
        }
        updates["homepage.slides"] = homepage.slides.map((s) => ({
          title: String(s.title || "").trim(),
          subtitle: String(s.subtitle || "").trim(),
          ctaText: String(s.ctaText || "Shop Now").trim(),
          ctaLink: String(s.ctaLink || "/products").trim(),
          imageUrl: String(s.imageUrl || "").trim(),
          type: ["image", "video"].includes(s.type) ? s.type : "image",
          videoUrl: String(s.videoUrl || "").trim(),
          posterUrl: String(s.posterUrl || "").trim(),
        }));
      }

      // Announcement bar
      if (homepage.announcement !== undefined) {
        const a = homepage.announcement;
        if (a.enabled !== undefined) updates["homepage.announcement.enabled"] = Boolean(a.enabled);
        if (a.text !== undefined) updates["homepage.announcement.text"] = String(a.text).trim().slice(0, 200);
        if (a.link !== undefined) updates["homepage.announcement.link"] = String(a.link).trim().slice(0, 500);
        if (a.bgColor !== undefined) {
          const color = String(a.bgColor).trim();
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return res.status(400).json({ success: false, error: "Invalid background color format" });
          }
          updates["homepage.announcement.bgColor"] = color;
        }
        if (a.textColor !== undefined) {
          const color = String(a.textColor).trim();
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return res.status(400).json({ success: false, error: "Invalid text color format" });
          }
          updates["homepage.announcement.textColor"] = color;
        }
        if (a.dismissible !== undefined) updates["homepage.announcement.dismissible"] = Boolean(a.dismissible);
      }

      // Promo banner
      if (homepage.promoBanner !== undefined) {
        const pb = homepage.promoBanner;
        for (const f of ["title", "subtitle", "ctaText", "ctaLink", "imageUrl"]) {
          if (pb[f] !== undefined) updates[`homepage.promoBanner.${f}`] = String(pb[f]).trim();
        }
        if (pb.countdownEnd !== undefined) {
          if (pb.countdownEnd === null || pb.countdownEnd === "") {
            updates["homepage.promoBanner.countdownEnd"] = null;
          } else {
            const d = new Date(pb.countdownEnd);
            if (isNaN(d.getTime())) {
              return res.status(400).json({ success: false, error: "Invalid countdown end date" });
            }
            updates["homepage.promoBanner.countdownEnd"] = d;
          }
        }
      }

      // Featured products
      if (homepage.featuredProducts !== undefined) {
        const fp = homepage.featuredProducts;
        if (fp.title !== undefined) updates["homepage.featuredProducts.title"] = String(fp.title).trim();
        if (fp.mode !== undefined) {
          if (!["auto", "manual"].includes(fp.mode)) {
            return res.status(400).json({ success: false, error: "Featured products mode must be 'auto' or 'manual'" });
          }
          updates["homepage.featuredProducts.mode"] = fp.mode;
        }
        if (fp.sortBy !== undefined) {
          if (!["newest", "bestseller", "rating"].includes(fp.sortBy)) {
            return res.status(400).json({ success: false, error: "Invalid featured products sort" });
          }
          updates["homepage.featuredProducts.sortBy"] = fp.sortBy;
        }
        if (fp.limit !== undefined) {
          const val = parseInt(fp.limit, 10);
          if (isNaN(val) || val < 4 || val > 12) {
            return res.status(400).json({ success: false, error: "Featured products limit must be between 4 and 12" });
          }
          updates["homepage.featuredProducts.limit"] = val;
        }
        if (fp.productIds !== undefined) {
          if (!Array.isArray(fp.productIds) || fp.productIds.length > 12) {
            return res.status(400).json({ success: false, error: "Product IDs must be an array with max 12 items" });
          }
          const VALID_OID = /^[0-9a-fA-F]{24}$/;
          updates["homepage.featuredProducts.productIds"] = fp.productIds.map((id) => String(id).trim()).filter((id) => VALID_OID.test(id));
        }
      }

      // Collections grid
      if (homepage.collections !== undefined) {
        const c = homepage.collections;
        if (c.title !== undefined) updates["homepage.collections.title"] = String(c.title).trim();
        if (c.limit !== undefined) {
          const val = parseInt(c.limit, 10);
          if (isNaN(val) || val < 3 || val > 6) {
            return res.status(400).json({ success: false, error: "Collections limit must be between 3 and 6" });
          }
          updates["homepage.collections.limit"] = val;
        }
        if (c.categoryIds !== undefined) {
          if (!Array.isArray(c.categoryIds) || c.categoryIds.length > 6) {
            return res.status(400).json({ success: false, error: "Category IDs must be an array with max 6 items" });
          }
          const VALID_CID = /^[0-9a-fA-F]{24}$/;
          updates["homepage.collections.categoryIds"] = c.categoryIds.map((id) => String(id).trim()).filter((id) => VALID_CID.test(id));
        }
        if (c.displayMode !== undefined) {
          if (!["grid", "slider"].includes(c.displayMode)) {
            return res.status(400).json({ success: false, error: "Collections display mode must be 'grid' or 'slider'" });
          }
          updates["homepage.collections.displayMode"] = c.displayMode;
        }
      }

      // New arrivals
      if (homepage.newArrivals !== undefined) {
        const na = homepage.newArrivals;
        if (na.title !== undefined) updates["homepage.newArrivals.title"] = String(na.title).trim();
        if (na.limit !== undefined) {
          const val = parseInt(na.limit, 10);
          if (isNaN(val) || val < 4 || val > 8) {
            return res.status(400).json({ success: false, error: "New arrivals limit must be between 4 and 8" });
          }
          updates["homepage.newArrivals.limit"] = val;
        }
      }

      // Testimonials
      if (homepage.testimonials !== undefined) {
        const te = homepage.testimonials;
        if (te.title !== undefined) updates["homepage.testimonials.title"] = String(te.title).trim();
        if (te.mode !== undefined) {
          if (!["auto", "manual"].includes(te.mode)) {
            return res.status(400).json({ success: false, error: "Testimonials mode must be 'auto' or 'manual'" });
          }
          updates["homepage.testimonials.mode"] = te.mode;
        }
        if (te.items !== undefined) {
          if (!Array.isArray(te.items) || te.items.length > 6) {
            return res.status(400).json({ success: false, error: "Testimonials must be an array with max 6 items" });
          }
          updates["homepage.testimonials.items"] = te.items.map((item) => ({
            name: String(item.name || "").trim(),
            quote: String(item.quote || "").trim(),
            location: String(item.location || "").trim(),
            rating: Math.min(5, Math.max(1, parseInt(item.rating) || 5)),
            avatar: String(item.avatar || "").trim(),
          }));
        }
      }

      // Brand story
      if (homepage.brandStory !== undefined) {
        const bs = homepage.brandStory;
        for (const f of ["title", "body", "ctaText", "ctaLink", "imageUrl"]) {
          if (bs[f] !== undefined) updates[`homepage.brandStory.${f}`] = String(bs[f]).trim();
        }
        if (bs.imagePosition !== undefined) {
          if (!["left", "right"].includes(bs.imagePosition)) {
            return res.status(400).json({ success: false, error: "Image position must be 'left' or 'right'" });
          }
          updates["homepage.brandStory.imagePosition"] = bs.imagePosition;
        }
      }

      // Trust bar
      if (homepage.trustBar !== undefined) {
        const tb = homepage.trustBar;
        if (tb.items !== undefined) {
          if (!Array.isArray(tb.items) || tb.items.length > 5) {
            return res.status(400).json({ success: false, error: "Trust bar must have max 5 items" });
          }
          const validIcons = [
            "Truck", "Shield", "RotateCcw", "Headphones", "Leaf", "Gem",
            "Package", "Zap", "Heart", "Star", "Clock", "Award",
            "CheckCircle", "ThumbsUp", "Lock", "CreditCard",
          ];
          updates["homepage.trustBar.items"] = tb.items.map((item) => ({
            icon: validIcons.includes(item.icon) ? item.icon : "Shield",
            title: String(item.title || "").trim(),
            description: String(item.description || "").trim(),
          }));
        }
      }

      // Newsletter section
      if (homepage.newsletter !== undefined) {
        const nl = homepage.newsletter;
        for (const f of ["title", "subtitle", "placeholder", "buttonText"]) {
          if (nl[f] !== undefined) updates[`homepage.newsletter.${f}`] = String(nl[f]).trim().slice(0, 200);
        }
        if (nl.bgColor !== undefined) {
          const color = String(nl.bgColor).trim();
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return res.status(400).json({ success: false, error: "Invalid newsletter background color" });
          }
          updates["homepage.newsletter.bgColor"] = color;
        }
        if (nl.textColor !== undefined) {
          const color = String(nl.textColor).trim();
          if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return res.status(400).json({ success: false, error: "Invalid newsletter text color" });
          }
          updates["homepage.newsletter.textColor"] = color;
        }
      }

      // Instagram section
      if (homepage.instagram !== undefined) {
        const ig = homepage.instagram;
        if (ig.username !== undefined) updates["homepage.instagram.username"] = String(ig.username).trim().slice(0, 100);
        if (ig.images !== undefined) {
          if (!Array.isArray(ig.images) || ig.images.length > 6) {
            return res.status(400).json({ success: false, error: "Instagram images must be an array with max 6 items" });
          }
          updates["homepage.instagram.images"] = ig.images.map((img) => ({
            url: String(img.url || "").trim(),
            link: String(img.link || "").trim(),
          }));
        }
      }

      // Value propositions
      if (homepage.valuePropositions !== undefined) {
        const vp = homepage.valuePropositions;
        if (vp.items !== undefined) {
          if (!Array.isArray(vp.items) || vp.items.length > 4) {
            return res.status(400).json({ success: false, error: "Value propositions must have max 4 items" });
          }
          const validIcons = [
            "Truck", "Shield", "RotateCcw", "Headphones", "Leaf", "Gem",
            "Package", "Zap", "Heart", "Star", "Clock", "Award",
            "CheckCircle", "ThumbsUp", "Lock", "CreditCard",
          ];
          updates["homepage.valuePropositions.items"] = vp.items.map((item) => ({
            icon: validIcons.includes(item.icon) ? item.icon : "Shield",
            title: String(item.title || "").trim(),
            description: String(item.description || "").trim(),
          }));
        }
      }

      // Partners / brand logos
      if (homepage.partners !== undefined) {
        const pt = homepage.partners;
        if (pt.items !== undefined) {
          if (!Array.isArray(pt.items) || pt.items.length > 8) {
            return res.status(400).json({ success: false, error: "Partners must have max 8 items" });
          }
          updates["homepage.partners.items"] = pt.items.map((item) => ({
            imageUrl: String(item.imageUrl || "").trim(),
            link: String(item.link || "").trim(),
            name: String(item.name || "").trim().slice(0, 100),
          }));
        }
      }

      // Promotional popup
      if (homepage.popup !== undefined) {
        const pp = homepage.popup;
        if (pp.enabled !== undefined) updates["homepage.popup.enabled"] = Boolean(pp.enabled);
        for (const f of ["title", "body", "ctaText", "ctaLink", "imageUrl"]) {
          if (pp[f] !== undefined) updates[`homepage.popup.${f}`] = String(pp[f]).trim().slice(0, 500);
        }
        if (pp.trigger !== undefined) {
          if (!["exit", "timed", "scroll"].includes(pp.trigger)) {
            return res.status(400).json({ success: false, error: "Invalid popup trigger type" });
          }
          updates["homepage.popup.trigger"] = pp.trigger;
        }
        if (pp.delay !== undefined) {
          const val = parseInt(pp.delay, 10);
          if (isNaN(val) || val < 1 || val > 60) {
            return res.status(400).json({ success: false, error: "Popup delay must be between 1 and 60 seconds" });
          }
          updates["homepage.popup.delay"] = val;
        }
        if (pp.scrollPercent !== undefined) {
          const val = parseInt(pp.scrollPercent, 10);
          if (isNaN(val) || val < 10 || val > 100) {
            return res.status(400).json({ success: false, error: "Scroll percent must be between 10 and 100" });
          }
          updates["homepage.popup.scrollPercent"] = val;
        }
        if (pp.frequency !== undefined) {
          if (!["once", "session", "daily"].includes(pp.frequency)) {
            return res.status(400).json({ success: false, error: "Invalid popup frequency" });
          }
          updates["homepage.popup.frequency"] = pp.frequency;
        }
      }

      // Legacy announcement text
      if (homepage.announcementText !== undefined) {
        updates["homepage.announcementText"] = String(homepage.announcementText).trim();
      }
    }

    // ── Navigation ─────────────────────────────────────────────────────
    if (navigation) {
      if (navigation.mainMenu !== undefined) {
        if (!Array.isArray(navigation.mainMenu) || navigation.mainMenu.length > 20) {
          return res.status(400).json({ success: false, error: "Navigation menu must be an array with max 20 items" });
        }

        const BUILTIN_PAGES = [
          "shop", "categories", "new-arrivals", "contact", "faq",
          "terms", "privacy", "shipping-policy", "refund-policy", "wishlist",
        ];

        const validateNavItem = (item) => ({
          id: String(item.id || "").trim().slice(0, 50),
          type: ["builtin", "custom"].includes(item.type) ? item.type : "builtin",
          builtinPage: item.type === "builtin" && BUILTIN_PAGES.includes(item.builtinPage) ? item.builtinPage : "",
          label: String(item.label || "").trim().slice(0, 100),
          labelFr: String(item.labelFr || "").trim().slice(0, 100),
          href: String(item.href || "").trim().slice(0, 500),
          enabled: item.enabled !== false,
          openInNewTab: Boolean(item.openInNewTab),
        });

        updates["navigation.mainMenu"] = navigation.mainMenu.map((item) => {
          const validated = validateNavItem(item);
          validated.children = Array.isArray(item.children)
            ? item.children.slice(0, 10).map(validateNavItem)
            : [];
          return validated;
        });
      }
    }

    // ── Header ────────────────────────────────────────────────────────
    if (header) {
      if (header.enabled !== undefined) {
        updates["header.enabled"] = Boolean(header.enabled);
      }
      if (header.variant !== undefined) {
        const v = String(header.variant).trim();
        if (!["classic", "minimal", "centered", "bold", "elegant", "zen", "playful", "tech", "artisan", "magazine"].includes(v)) {
          return res.status(400).json({ success: false, error: "Invalid header variant" });
        }
        updates["header.variant"] = v;
      }
      if (header.mode !== undefined) {
        const m = String(header.mode).trim();
        if (!["dynamic", "hardcoded"].includes(m)) {
          return res.status(400).json({ success: false, error: "Invalid header mode" });
        }
        updates["header.mode"] = m;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────
    if (footer) {
      if (footer.enabled !== undefined) {
        updates["footer.enabled"] = Boolean(footer.enabled);
      }
      if (footer.variant !== undefined) {
        const v = String(footer.variant).trim();
        if (!["luxury", "minimal", "columns", "bold", "elegant", "zen", "playful", "tech", "artisan", "magazine"].includes(v)) {
          return res.status(400).json({ success: false, error: "Invalid footer variant" });
        }
        updates["footer.variant"] = v;
      }
      if (footer.mode !== undefined) {
        const m = String(footer.mode).trim();
        if (!["dynamic", "hardcoded"].includes(m)) {
          return res.status(400).json({ success: false, error: "Invalid footer mode" });
        }
        updates["footer.mode"] = m;
      }
    }

    // ── Email Templates ─────────────────────────────────────────────────
    if (emailTemplates) {
      const tplFields = [
        "orderConfirmationSubject", "orderShippedSubject", "orderDeliveredSubject",
        "orderCancelledSubject", "welcomeSubject", "verificationSubject", "passwordResetSubject",
      ];
      for (const field of tplFields) {
        if (emailTemplates[field] !== undefined) {
          updates[`emailTemplates.${field}`] = String(emailTemplates[field]).trim();
        }
      }
    }

    // ── SMTP Configuration ──────────────────────────────────────────────
    if (smtp) {
      const smtpStrFields = ["host", "user", "fromName", "fromEmail"];
      for (const field of smtpStrFields) {
        if (smtp[field] !== undefined) {
          updates[`smtp.${field}`] = String(smtp[field]).trim();
        }
      }
      if (smtp.port !== undefined) {
        const val = parseInt(smtp.port, 10);
        if (isNaN(val) || val < 1 || val > 65535) {
          return res.status(400).json({ success: false, error: "SMTP port must be between 1 and 65535" });
        }
        updates["smtp.port"] = val;
      }
      if (smtp.secure !== undefined) {
        updates["smtp.secure"] = Boolean(smtp.secure);
      }
      // Encrypt password before storing — skip if masked value sent back
      if (smtp.pass !== undefined && smtp.pass !== "••••••••") {
        updates["smtp.pass"] = smtp.pass ? encrypt(smtp.pass) : "";
      }
    }

    // ── Typography ──────────────────────────────────────────────────────────
    if (typography) {
      const ALLOWED_HEADING_FONTS = [
        "", "DM Serif Display", "Playfair Display", "Cormorant Garamond", "Bodoni Moda",
        "Libre Baskerville", "Lora", "Noto Serif", "EB Garamond", "Crimson Text", "Source Serif 4",
      ];
      const ALLOWED_BODY_FONTS = [
        "", "DM Sans", "Inter", "Nunito Sans", "Lato", "Open Sans",
        "Raleway", "Montserrat", "Work Sans", "Poppins", "Source Sans 3",
      ];

      if (typography.headingFont !== undefined) {
        const val = String(typography.headingFont).trim();
        if (!ALLOWED_HEADING_FONTS.includes(val)) {
          return res.status(400).json({ success: false, error: "Invalid heading font" });
        }
        updates["typography.headingFont"] = val;
      }
      if (typography.bodyFont !== undefined) {
        const val = String(typography.bodyFont).trim();
        if (!ALLOWED_BODY_FONTS.includes(val)) {
          return res.status(400).json({ success: false, error: "Invalid body font" });
        }
        updates["typography.bodyFont"] = val;
      }
      if (typography.baseFontSize !== undefined) {
        const val = parseInt(typography.baseFontSize, 10);
        if (isNaN(val) || val < 14 || val > 20) {
          return res.status(400).json({ success: false, error: "Base font size must be between 14 and 20" });
        }
        updates["typography.baseFontSize"] = val;
      }
      if (typography.headingLetterSpacing !== undefined) {
        const val = parseFloat(typography.headingLetterSpacing);
        if (isNaN(val) || val < 0 || val > 0.3) {
          return res.status(400).json({ success: false, error: "Heading letter spacing must be between 0 and 0.3" });
        }
        updates["typography.headingLetterSpacing"] = val;
      }
      if (typography.headingTextTransform !== undefined) {
        if (!["uppercase", "none"].includes(typography.headingTextTransform)) {
          return res.status(400).json({ success: false, error: "Heading text transform must be uppercase or none" });
        }
        updates["typography.headingTextTransform"] = typography.headingTextTransform;
      }
    }

    // ── Color Palette ───────────────────────────────────────────────────────
    if (colorPalette) {
      const HEX_RE = /^#[0-9a-fA-F]{6}$/;
      const colorFields = ["bg", "bgAlt", "text", "textMuted", "dark", "accentText", "border", "sale"];
      for (const field of colorFields) {
        if (colorPalette[field] !== undefined) {
          const val = String(colorPalette[field]).trim();
          if (!HEX_RE.test(val)) {
            return res.status(400).json({ success: false, error: `Invalid hex color for ${field}` });
          }
          updates[`colorPalette.${field}`] = val;
        }
      }
      if (colorPalette.preset !== undefined) {
        const ALLOWED_PRESETS = ["classic", "warmIvory", "coolSlate", "midnight", "blushRose", "custom"];
        const preset = String(colorPalette.preset).trim();
        if (!ALLOWED_PRESETS.includes(preset)) {
          return res.status(400).json({ success: false, error: "Invalid color preset" });
        }
        updates["colorPalette.preset"] = preset;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: "No fields to update" });
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    // Invalidate cache
    cache.del(SETTINGS_CACHE_KEY);
    cache.del("settings:product-types-catalog");
    cache.del("settings:enabled-product-types");

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    logger.error("updateSettings error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/settings/upload ──────────────────────────────────────────────
// Admin-only — upload logo, favicon, or hero slide images
export const uploadSettingsFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const { field } = req.body;
    if (!field) {
      return res.status(400).json({ success: false, error: "Missing required field: field" });
    }

    // Validate field name
    const validFields = ["logo", "favicon"];
    const isHeroField = /^hero-\d+$/.test(field);
    const isHomepageImage = ["promo-banner", "brand-story", "popup-image"].includes(field);
    const isTestimonialAvatar = /^testimonial-\d+$/.test(field);
    const isPartnerLogo = /^partner-\d+$/.test(field);
    if (!validFields.includes(field) && !isHeroField && !isHomepageImage && !isTestimonialAvatar && !isPartnerLogo) {
      return res.status(400).json({ success: false, error: "Invalid field name" });
    }

    // Ensure upload directory exists
    const uploadDir = path.join(__dirname, "../../uploads/settings");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Build file path
    const ext = path.extname(req.file.originalname).toLowerCase();
    const filename = `${field}${ext}`;
    const filePath = path.join(uploadDir, filename);
    assertWithin(filePath, uploadDir);

    // Write file
    fs.writeFileSync(filePath, req.file.buffer);

    const fileUrl = `/uploads/settings/${filename}`;

    // Update settings
    const updates = {};
    if (field === "logo") {
      updates["store.logo"] = fileUrl;
    } else if (field === "favicon") {
      updates["store.favicon"] = fileUrl;
    } else if (isHeroField || isHomepageImage || isTestimonialAvatar || isPartnerLogo) {
      // Return URL for frontend to include in settings update
      cache.del(SETTINGS_CACHE_KEY);
      return res.status(200).json({ success: true, data: { url: fileUrl } });
    }

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    cache.del(SETTINGS_CACHE_KEY);
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    logger.error("uploadSettingsFile error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── POST /api/settings/test-email ──────────────────────────────────────────
// Admin-only — send a test email using SMTP settings
// Accepts optional { smtp: { host, port, secure, user, pass, fromName, fromEmail } }
// in the request body so users can test BEFORE saving settings.
export const sendTestEmail = async (req, res) => {
  try {
    const bodySmtp = req.body?.smtp;
    const settingsDoc = await Settings.findOne({}).select("smtp notifications store.name").lean();
    const storeName = settingsDoc?.store?.name || "ShopFlow";

    let transportConfig;
    let fromName, fromEmail;

    if (bodySmtp?.host && bodySmtp?.user) {
      // Use SMTP config from request body (test unsaved settings)
      let pass = bodySmtp.pass || "";
      // If password is the masked value, read actual password from DB
      if (pass === "••••••••") {
        pass = settingsDoc?.smtp?.pass ? decrypt(settingsDoc.smtp.pass) : "";
      }
      if (!pass) {
        return res.status(400).json({ success: false, error: "SMTP password is required" });
      }
      transportConfig = {
        host: bodySmtp.host,
        port: parseInt(bodySmtp.port, 10) || 587,
        secure: Boolean(bodySmtp.secure),
        auth: { user: bodySmtp.user, pass },
      };
      fromName = bodySmtp.fromName || storeName;
      fromEmail = bodySmtp.fromEmail || bodySmtp.user;
    } else {
      // Read from DB
      if (!settingsDoc) {
        return res.status(400).json({ success: false, error: "Settings not found" });
      }
      const smtp = settingsDoc.smtp || {};
      const fromEnv = !smtp.host || !smtp.user;

      if (fromEnv) {
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
          return res.status(400).json({ success: false, error: "SMTP not configured — fill in host, user, and password, then try again" });
        }
        transportConfig = {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || "587", 10),
          secure: process.env.SMTP_SECURE === "true",
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        };
      } else {
        const decryptedPass = decrypt(smtp.pass);
        if (!decryptedPass) {
          return res.status(400).json({ success: false, error: "SMTP password could not be decrypted — please re-enter and save it" });
        }
        transportConfig = {
          host: smtp.host,
          port: smtp.port || 587,
          secure: smtp.secure || false,
          auth: { user: smtp.user, pass: decryptedPass },
        };
      }

      fromName = fromEnv ? storeName : (smtp.fromName || storeName);
      fromEmail = fromEnv ? (process.env.SMTP_FROM || process.env.SMTP_USER) : (smtp.fromEmail || smtp.user);
    }

    const toEmail = settingsDoc?.notifications?.adminNotificationEmail || req.user.email;

    const transporter = nodemailer.createTransport(transportConfig);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: toEmail,
      subject: `${storeName} — Email de test`,
      text: `Ceci est un email de test de ${storeName}. Si vous le recevez, votre configuration SMTP fonctionne correctement.`,
      html: `<div style="font-family:sans-serif;padding:24px;"><h2>${storeName} — Email de test</h2><p>Si vous recevez cet email, votre configuration SMTP fonctionne correctement.</p></div>`,
    });

    res.status(200).json({ success: true, data: { messageId: info.messageId, sentTo: toEmail } });
  } catch (error) {
    logger.error("sendTestEmail error:", error);
    res.status(400).json({ success: false, error: `Failed to send test email: ${error.message}` });
  }
};

// ─── GET /api/settings/top-reviews ───────────────────────────────────────────
// Public — returns top reviews for auto testimonials on homepage
export const getTopReviews = async (_req, res) => {
  try {
    const cacheKey = "settings:top-reviews";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const reviews = await Review.find({ rating: { $gte: 4 } })
      .sort({ rating: -1, createdAt: -1 })
      .limit(3)
      .populate("user", "name avatar")
      .lean();

    const data = reviews.map((r) => ({
      name: r.user?.name || "Anonymous",
      quote: r.comment,
      location: "",
      rating: r.rating,
      avatar: r.user?.avatar || "",
    }));

    cache.set(cacheKey, data, 300);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error("getTopReviews error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/settings/product-types-catalog ────────────────────────────────
// Public — returns the full product type catalog (all types with attributes)
export const getProductTypeCatalog = async (_req, res) => {
  try {
    const cacheKey = "settings:product-types-catalog";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    cache.set(cacheKey, PRODUCT_TYPE_CATALOG, 600); // 10 min
    res.status(200).json({ success: true, data: PRODUCT_TYPE_CATALOG });
  } catch (error) {
    logger.error("getProductTypeCatalog error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── GET /api/settings/product-types ────────────────────────────────────────
// Public — returns only admin-enabled product types (subset of catalog)
export const getEnabledProductTypes = async (_req, res) => {
  try {
    const cacheKey = "settings:enabled-product-types";
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ success: true, data: cached });

    const settings = await Settings.findOne({}).lean();
    const enabledKeys = settings?.products?.productTypes ?? [];

    const enabled = {};
    for (const key of enabledKeys) {
      if (PRODUCT_TYPE_CATALOG[key]) {
        enabled[key] = PRODUCT_TYPE_CATALOG[key];
      }
    }

    cache.set(cacheKey, enabled, 300); // 5 min
    res.status(200).json({ success: true, data: enabled });
  } catch (error) {
    logger.error("getEnabledProductTypes error:", error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

// ─── Export decrypt for sendEmail.js to use ──────────────────────────────────
export { decrypt as decryptSmtpPass };
