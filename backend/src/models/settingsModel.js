import { Schema, model } from "mongoose";

const settingsSchema = new Schema(
  {
    // ─── Store ──────────────────────────────────────────────────────────
    store: {
      name: { type: String, default: "ShopFlow" },
      description: { type: String, default: "" },
      contactEmail: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
      address: { type: String, default: "" },
      currency: { type: String, default: "USD" },
      timezone: { type: String, default: "UTC" },
      logo: { type: String, default: "" },
      logoEnabled: { type: Boolean, default: true },
      favicon: { type: String, default: "" },
      showcaseMode: { type: Boolean, default: false },
      buyNowEnabled: { type: Boolean, default: true },
    },

    // ─── Orders ─────────────────────────────────────────────────────────
    orders: {
      defaultShippingCost: { type: Number, default: 0, min: 0 },
      minimumOrderAmount: { type: Number, default: 0, min: 0 },
      freeShippingThreshold: { type: Number, default: 0, min: 0 },
      autoCancelPendingDays: { type: Number, default: 0, min: 0 },
    },

    // ─── Email / Notifications ──────────────────────────────────────────
    notifications: {
      orderConfirmation: { type: Boolean, default: true },
      orderStatusUpdate: { type: Boolean, default: true },
      welcomeEmail: { type: Boolean, default: true },
      adminNewOrder: { type: Boolean, default: false },
      adminLowStock: { type: Boolean, default: false },
      adminNotificationEmail: { type: String, default: "" },
    },

    // ─── Products ───────────────────────────────────────────────────────
    products: {
      lowStockThreshold: { type: Number, default: 10, min: 1 },
      maxImagesPerProduct: { type: Number, default: 10, min: 1, max: 20 },
      reviewsEnabled: { type: Boolean, default: true },
      defaultSortOrder: {
        type: String,
        enum: ["newest", "price_asc", "price_desc", "rating"],
        default: "newest",
      },
      productTypes: [{ type: String }],
    },

    // ─── Social Media ───────────────────────────────────────────────────
    social: {
      facebook: { type: String, default: "" },
      instagram: { type: String, default: "" },
      twitter: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      youtube: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
    },

    // ─── Legal Pages ────────────────────────────────────────────────────
    legal: {
      termsAndConditions: { type: String, default: "" },
      privacyPolicy: { type: String, default: "" },
      returnPolicy: { type: String, default: "" },
      shippingPolicy: { type: String, default: "" },
    },

    // ─── SEO ────────────────────────────────────────────────────────────
    seo: {
      metaTitleTemplate: { type: String, default: "%s | ShopFlow" },
      metaDescription: { type: String, default: "" },
      googleAnalyticsId: { type: String, default: "" },
      facebookPixelId: { type: String, default: "" },
    },

    // ─── Maintenance Mode ─────────────────────────────────────────────
    maintenance: {
      enabled: { type: Boolean, default: false },
      message: { type: String, default: "We're currently performing maintenance. Please check back soon." },
    },

    // ─── Homepage ───────────────────────────────────────────────────────
    homepage: {
      // ── Template: selects which set of section components to render
      template: {
        type: String,
        default: "classic",
      },

      // ── Legacy mode (backward compat — mapped to template in frontend)
      mode: {
        type: String,
        enum: ["dynamic", "hardcoded"],
        default: "dynamic",
      },

      // ── Section Visibility ──────────────────────────────────────────
      // Contains keys for ALL templates — each template uses its own subset
      sections: {
        // Dynamic template sections
        hero:              { type: Boolean, default: true },
        valuePropositions: { type: Boolean, default: true },
        collections:       { type: Boolean, default: true },
        featuredProducts:  { type: Boolean, default: true },
        promoBanner:       { type: Boolean, default: true },
        newArrivals:       { type: Boolean, default: true },
        testimonials:      { type: Boolean, default: true },
        brandStory:        { type: Boolean, default: true },
        instagram:         { type: Boolean, default: true },
        trustBar:          { type: Boolean, default: true },
        newsletter:        { type: Boolean, default: true },
        partners:          { type: Boolean, default: true },
        recentlyViewed:    { type: Boolean, default: true },
        // Classic template sections
        trustBadges:          { type: Boolean, default: true },
        trendingCategories:   { type: Boolean, default: true },
        topSelling:           { type: Boolean, default: true },
        welcome:              { type: Boolean, default: true },
        aboutUs:              { type: Boolean, default: true },
        brand:                { type: Boolean, default: true },
        seoHeadline:          { type: Boolean, default: false },
        gallery:              { type: Boolean, default: false },
        // Bold template sections
        categories:           { type: Boolean, default: true },
        socialProof:          { type: Boolean, default: true },
        // Artisan template sections
        craftStory:           { type: Boolean, default: true },
        // Magazine template sections
        editorial:            { type: Boolean, default: true },
        // Noir template sections
        noirCinematicHero:    { type: Boolean, default: true },
        noirBrandStatement:   { type: Boolean, default: true },
        noirProductGallery:   { type: Boolean, default: true },
        noirBenefitsTriptych: { type: Boolean, default: true },
        noirStorySection:     { type: Boolean, default: true },
        noirTestimonials:     { type: Boolean, default: true },
        noirProductDetails:   { type: Boolean, default: true },
        noirPurchaseSection:  { type: Boolean, default: true },
        noirTrustFooter:      { type: Boolean, default: true },
        // Surge template sections
        surgeAnnouncementBar:  { type: Boolean, default: true },
        surgeHeroWithCta:      { type: Boolean, default: true },
        surgeSocialProofBar:   { type: Boolean, default: true },
        surgeProblemSolution:  { type: Boolean, default: true },
        surgeVideoDemo:        { type: Boolean, default: true },
        surgeBenefitsCarousel: { type: Boolean, default: true },
        surgeComparison:       { type: Boolean, default: true },
        surgeTestimonialsGrid: { type: Boolean, default: true },
        surgeMidPageCta:       { type: Boolean, default: true },
        surgeHowItWorks:       { type: Boolean, default: true },
        surgeFaqSection:       { type: Boolean, default: true },
        surgeFinalCta:         { type: Boolean, default: true },
        surgeGuaranteeBadge:   { type: Boolean, default: true },
      },

      // ── Section Order ───────────────────────────────────────────────
      // Stores the current template's section order
      sectionOrder: {
        type: [String],
        default: [
          "hero", "valuePropositions", "collections", "featuredProducts",
          "promoBanner", "newArrivals", "testimonials", "brandStory",
          "instagram", "trustBar", "newsletter", "partners", "recentlyViewed",
        ],
      },

      // ── Hero Slides (existing) ──────────────────────────────────────
      slides: [{
        title: { type: String, default: "" },
        subtitle: { type: String, default: "" },
        ctaText: { type: String, default: "Shop Now" },
        ctaLink: { type: String, default: "/products" },
        imageUrl: { type: String, default: "" },
        type: { type: String, enum: ["image", "video"], default: "image" },
        videoUrl: { type: String, default: "" },
        posterUrl: { type: String, default: "" },
        _id: false,
      }],

      // ── Announcement Bar ────────────────────────────────────────────
      announcement: {
        enabled:     { type: Boolean, default: true },
        text:        { type: String, default: "" },
        link:        { type: String, default: "" },
        bgColor:     { type: String, default: "#1a1a1a" },
        textColor:   { type: String, default: "#ffffff" },
        dismissible: { type: Boolean, default: false },
      },

      // ── Promo Banner ────────────────────────────────────────────────
      promoBanner: {
        title:        { type: String, default: "" },
        subtitle:     { type: String, default: "" },
        ctaText:      { type: String, default: "" },
        ctaLink:      { type: String, default: "/products" },
        imageUrl:     { type: String, default: "" },
        countdownEnd: { type: Date, default: null },
      },

      // ── Featured Products ───────────────────────────────────────────
      featuredProducts: {
        title:      { type: String, default: "" },
        mode:       { type: String, enum: ["auto", "manual"], default: "auto" },
        sortBy:     { type: String, enum: ["newest", "bestseller", "rating"], default: "newest" },
        limit:      { type: Number, default: 8, min: 4, max: 12 },
        productIds: [{ type: String }],
      },

      // ── Collections Grid ────────────────────────────────────────────
      collections: {
        title:       { type: String, default: "" },
        limit:       { type: Number, default: 4, min: 3, max: 6 },
        categoryIds: [{ type: String }],
        displayMode: { type: String, enum: ["grid", "slider"], default: "grid" },
      },

      // ── New Arrivals ────────────────────────────────────────────────
      newArrivals: {
        title: { type: String, default: "" },
        limit: { type: Number, default: 4, min: 4, max: 8 },
      },

      // ── Testimonials ────────────────────────────────────────────────
      testimonials: {
        title: { type: String, default: "" },
        mode:  { type: String, enum: ["auto", "manual"], default: "manual" },
        items: [{
          name:     { type: String, default: "" },
          quote:    { type: String, default: "" },
          location: { type: String, default: "" },
          rating:   { type: Number, default: 5, min: 1, max: 5 },
          avatar:   { type: String, default: "" },
          _id: false,
        }],
      },

      // ── Brand Story ─────────────────────────────────────────────────
      brandStory: {
        title:         { type: String, default: "" },
        body:          { type: String, default: "" },
        ctaText:       { type: String, default: "" },
        ctaLink:       { type: String, default: "/products" },
        imageUrl:      { type: String, default: "" },
        imagePosition: { type: String, enum: ["left", "right"], default: "left" },
      },

      // ── Trust Bar ───────────────────────────────────────────────────
      trustBar: {
        items: [{
          icon:        { type: String, default: "Shield" },
          title:       { type: String, default: "" },
          description: { type: String, default: "" },
          _id: false,
        }],
      },

      // ── Newsletter ────────────────────────────────────────────────
      newsletter: {
        title:      { type: String, default: "" },
        subtitle:   { type: String, default: "" },
        placeholder: { type: String, default: "" },
        buttonText: { type: String, default: "" },
        bgColor:    { type: String, default: "#1a1a1a" },
        textColor:  { type: String, default: "#ffffff" },
      },

      // ── Instagram Feed ────────────────────────────────────────────
      instagram: {
        username: { type: String, default: "" },
        images: [{
          url:  { type: String, default: "" },
          link: { type: String, default: "" },
          _id: false,
        }],
      },

      // ── Value Propositions ─────────────────────────────────────────
      valuePropositions: {
        items: [{
          icon:        { type: String, default: "Shield" },
          title:       { type: String, default: "" },
          description: { type: String, default: "" },
          _id: false,
        }],
      },

      // ── Partners ───────────────────────────────────────────────────
      partners: {
        items: [{
          imageUrl: { type: String, default: "" },
          link:     { type: String, default: "" },
          name:     { type: String, default: "" },
          _id: false,
        }],
      },

      // ── Popup ──────────────────────────────────────────────────────
      popup: {
        enabled:       { type: Boolean, default: false },
        title:         { type: String, default: "" },
        body:          { type: String, default: "" },
        ctaText:       { type: String, default: "" },
        ctaLink:       { type: String, default: "" },
        imageUrl:      { type: String, default: "" },
        trigger:       { type: String, enum: ["exit", "timed", "scroll"], default: "timed" },
        delay:         { type: Number, default: 5, min: 1, max: 60 },
        scrollPercent: { type: Number, default: 50, min: 10, max: 100 },
        frequency:     { type: String, enum: ["once", "session", "daily"], default: "session" },
      },

      // ── Legacy (backward compat) ────────────────────────────────────
      announcementText: { type: String, default: "" },
    },

    // ─── Header ───────────────────────────────────────────────────────
    header: {
      enabled: { type: Boolean, default: true },
      variant: {
        type: String,
        enum: ["classic", "minimal", "centered", "bold", "elegant", "zen", "playful", "tech", "artisan", "magazine"],
        default: "classic",
      },
      mode: {
        type: String,
        enum: ["dynamic", "hardcoded"],
        default: "dynamic",
      },
    },

    // ─── Footer ───────────────────────────────────────────────────────
    footer: {
      enabled: { type: Boolean, default: true },
      variant: {
        type: String,
        enum: ["luxury", "minimal", "columns", "bold", "elegant", "zen", "playful", "tech", "artisan", "magazine"],
        default: "luxury",
      },
      mode: {
        type: String,
        enum: ["dynamic", "hardcoded"],
        default: "dynamic",
      },
    },

    // ─── Email Templates (Customizable Subjects) ─────────────────────
    emailTemplates: {
      orderConfirmationSubject: { type: String, default: "Commande confirmée — #{{orderNumber}}" },
      orderShippedSubject: { type: String, default: "Commande expédiée — #{{orderNumber}}" },
      orderDeliveredSubject: { type: String, default: "Commande livrée — #{{orderNumber}}" },
      orderCancelledSubject: { type: String, default: "Commande annulée — #{{orderNumber}}" },
      welcomeSubject: { type: String, default: "Bienvenue sur {{shopName}} — Votre compte est prêt !" },
      verificationSubject: { type: String, default: "Vérifiez votre adresse email {{shopName}}" },
      passwordResetSubject: { type: String, default: "Réinitialisez votre mot de passe {{shopName}}" },
    },

    // ─── SMTP Configuration ──────────────────────────────────────────
    smtp: {
      host: { type: String, default: "" },
      port: { type: Number, default: 587 },
      secure: { type: Boolean, default: false },
      user: { type: String, default: "" },
      pass: { type: String, default: "" }, // encrypted before storage; masked by toJSON + normalizeLean
      fromName: { type: String, default: "ShopFlow" },
      fromEmail: { type: String, default: "" },
    },

    // ─── Typography ───────────────────────────────────────────────────────────────
    typography: {
      headingFont: { type: String, default: "" },
      bodyFont: { type: String, default: "" },
      baseFontSize: { type: Number, default: 16, min: 14, max: 20 },
      headingLetterSpacing: { type: Number, default: 0.18 },
      headingTextTransform: { type: String, enum: ["uppercase", "none"], default: "uppercase" },
    },

    // ─── Color Palette ────────────────────────────────────────────────────────────
    colorPalette: {
      preset: { type: String, default: "classic" },
      bg: { type: String, default: "#FFFFFF" },
      bgAlt: { type: String, default: "#F7F5F3" },
      text: { type: String, default: "#1C1C1C" },
      textMuted: { type: String, default: "#71717A" },
      dark: { type: String, default: "#1C1C1C" },
      accentText: { type: String, default: "#FFFFFF" },
      border: { type: String, default: "#E5E5E5" },
      sale: { type: String, default: "#DC2626" },
    },
  },
  { timestamps: true }
);

settingsSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    // Never expose SMTP password
    if (ret.smtp) {
      ret.smtp.pass = ret.smtp.pass ? "••••••••" : "";
    }
  },
});

const Settings = model("Settings", settingsSchema);
export default Settings;
