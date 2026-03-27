"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
// Dynamic (editable) template components — always loaded (shared section library)
import { HeroSlideshow } from "./HeroSlideshow";
import { ValuePropositions } from "./ValuePropositions";
import { CollectionGrid } from "./CollectionGrid";
import { FeaturedProducts } from "./FeaturedProducts";
import { ParallaxBanner } from "./ParallaxBanner";
import { NewArrivals } from "./NewArrivals";
import { Testimonials } from "./Testimonials";
import { ImageWithText } from "./ImageWithText";
import { InstagramFeed } from "./InstagramFeed";
import { TrustBar } from "./TrustBar";
import { Newsletter } from "./Newsletter";
import { PartnersBar } from "./PartnersBar";
import { RecentlyViewed } from "./RecentlyViewed";
import { LandingProductProvider } from "@/hooks/useLandingProduct";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomepageSectionKey, ThemeConfig } from "@/types";

type ComponentMap = Partial<Record<HomepageSectionKey, React.ComponentType>>;

/* ─── Lazy theme loaders ─────────────────────────────────────────────── */
/* Each returns a Promise<ComponentMap> — only the active theme is loaded */

const THEME_LOADERS: Record<string, () => Promise<ComponentMap>> = {
  classic: () =>
    import("./HardcodedHomepage").then((m) => ({
      hero: m.HCHero,
      trustBadges: m.HCTrustBadges,
      trendingCategories: m.HCTrendingCategories,
      topSelling: m.HCTopSelling,
      promoBanner: m.HCPromoBanner,
      newArrivals: m.HCNewArrivals,
      welcome: m.HCWelcome,
      aboutUs: m.HCAboutUs,
      brand: m.HCBrand,
      gallery: m.HCGallery,
      seoHeadline: m.HCSEOHeadline,
      partners: m.HCPartnersBar,
    })),
  bold: () =>
    import("./BoldHomepage").then((m) => ({
      hero: m.BDHero,
      categories: m.BDCategories,
      featuredProducts: m.BDFeaturedProducts,
      promoBanner: m.BDPromoBanner,
      newArrivals: m.BDNewArrivals,
      socialProof: m.BDSocialProof,
      newsletter: m.BDNewsletter,
    })),
  elegant: () =>
    import("./ElegantHomepage").then((m) => ({
      hero: m.ELHero,
      collections: m.ELCollections,
      featuredProducts: m.ELFeaturedProducts,
      promoBanner: m.ELPromoBanner,
      newArrivals: m.ELNewArrivals,
      brandStory: m.ELBrandStory,
      newsletter: m.ELNewsletter,
    })),
  minimal: () =>
    import("./MinimalHomepage").then((m) => ({
      hero: m.MNHero,
      featuredProducts: m.MNFeaturedProducts,
      newArrivals: m.MNNewArrivals,
      categories: m.MNCategories,
      newsletter: m.MNNewsletter,
    })),
  playful: () =>
    import("./PlayfulHomepage").then((m) => ({
      hero: m.PLHero,
      categories: m.PLCategories,
      featuredProducts: m.PLFeaturedProducts,
      promoBanner: m.PLPromoBanner,
      newArrivals: m.PLNewArrivals,
      testimonials: m.PLTestimonials,
      newsletter: m.PLNewsletter,
    })),
  tech: () =>
    import("./TechHomepage").then((m) => ({
      hero: m.TKHero,
      categories: m.TKCategories,
      featuredProducts: m.TKFeaturedProducts,
      promoBanner: m.TKPromoBanner,
      newArrivals: m.TKNewArrivals,
      socialProof: m.TKSocialProof,
      newsletter: m.TKNewsletter,
    })),
  artisan: () =>
    import("./ArtisanHomepage").then((m) => ({
      hero: m.ARHero,
      categories: m.ARCategories,
      featuredProducts: m.ARFeaturedProducts,
      promoBanner: m.ARPromoBanner,
      newArrivals: m.ARNewArrivals,
      craftStory: m.ARCraftStory,
      newsletter: m.ARNewsletter,
    })),
  magazine: () =>
    import("./MagazineHomepage").then((m) => ({
      hero: m.MGHero,
      categories: m.MGCategories,
      featuredProducts: m.MGFeaturedProducts,
      promoBanner: m.MGPromoBanner,
      newArrivals: m.MGNewArrivals,
      editorial: m.MGEditorial,
      newsletter: m.MGNewsletter,
    })),
  noir: () =>
    import("./NoirHomepage").then((m) => ({
      noirCinematicHero: m.NRCinematicHero,
      noirBrandStatement: m.NRBrandStatement,
      noirProductGallery: m.NRProductGallery,
      noirBenefitsTriptych: m.NRBenefitsTriptych,
      noirStorySection: m.NRStorySection,
      noirTestimonials: m.NRTestimonials,
      noirProductDetails: m.NRProductDetails,
      noirPurchaseSection: m.NRPurchaseSection,
      noirTrustFooter: m.NRTrustFooter,
    })),
  surge: () =>
    import("./SurgeHomepage").then((m) => ({
      surgeAnnouncementBar: m.SGAnnouncementBar,
      surgeHeroWithCta: m.SGHeroWithCta,
      surgeSocialProofBar: m.SGSocialProofBar,
      surgeProblemSolution: m.SGProblemSolution,
      surgeVideoDemo: m.SGVideoDemo,
      surgeBenefitsCarousel: m.SGBenefitsCarousel,
      surgeComparison: m.SGComparison,
      surgeTestimonialsGrid: m.SGTestimonialsGrid,
      surgeMidPageCta: m.SGMidPageCta,
      surgeHowItWorks: m.SGHowItWorks,
      surgeFaqSection: m.SGFaqSection,
      surgeFinalCta: m.SGFinalCta,
      surgeGuaranteeBadge: m.SGGuaranteeBadge,
    })),
};

/* ─── Dynamic template components (always available) ─────────────────── */
const DYNAMIC_COMPONENTS: ComponentMap = {
  hero: HeroSlideshow,
  valuePropositions: ValuePropositions,
  collections: CollectionGrid,
  featuredProducts: FeaturedProducts,
  promoBanner: ParallaxBanner,
  newArrivals: NewArrivals,
  testimonials: Testimonials,
  brandStory: ImageWithText,
  instagram: InstagramFeed,
  trustBar: TrustBar,
  newsletter: Newsletter,
  partners: PartnersBar,
  recentlyViewed: RecentlyViewed,
};

/* ─── Theme Registry ──────────────────────────────────────────────────── */
/*
 * To add a new hardcoded theme:
 * 1. Code your sections in a new file (e.g., MinimalHomepage.tsx)
 * 2. Export each section component
 * 3. Add a loader in THEME_LOADERS above
 * 4. Add an entry to THEMES below (components: {} — loaded lazily)
 * 5. The admin gallery will automatically show the new theme
 */

const THEMES: Record<string, ThemeConfig> = {
  classic: {
    label: "templateClassic",
    description: "templateClassicDesc",
    thumbnail: "/themes/classic-preview.png",
    editable: false,
    useCases: ["themeUseGeneral", "themeUseMultiProduct", "themeUseBrandStore"],
    defaultOrder: [
      "hero", "trustBadges", "trendingCategories", "topSelling",
      "promoBanner", "newArrivals", "welcome", "aboutUs",
      "brand", "partners", "seoHeadline", "gallery",
    ],
    defaultHidden: ["seoHeadline", "gallery"],
    components: {},
  },
  bold: {
    label: "templateBold",
    description: "templateBoldDesc",
    thumbnail: "/themes/bold-preview.png",
    editable: false,
    useCases: ["themeUseClothing", "themeUseSports", "themeUseStreetWear"],
    defaultOrder: [
      "hero", "categories", "featuredProducts", "promoBanner",
      "newArrivals", "socialProof", "newsletter",
    ],
    components: {},
  },
  elegant: {
    label: "templateElegant",
    description: "templateElegantDesc",
    thumbnail: "/themes/elegant-preview.png",
    editable: false,
    useCases: ["themeUseJewelry", "themeUsePerfume", "themeUseLuxury"],
    defaultOrder: [
      "hero", "collections", "featuredProducts", "promoBanner",
      "newArrivals", "brandStory", "newsletter",
    ],
    components: {},
  },
  minimal: {
    label: "templateMinimal",
    description: "templateMinimalDesc",
    thumbnail: "/themes/minimal-preview.png",
    editable: false,
    useCases: ["themeUseHomeDecor", "themeUseSkincare", "themeUseStationery"],
    defaultOrder: [
      "hero", "featuredProducts", "newArrivals", "categories", "newsletter",
    ],
    components: {},
  },
  playful: {
    label: "templatePlayful",
    description: "templatePlayfulDesc",
    thumbnail: "/themes/playful-preview.png",
    editable: false,
    useCases: ["themeUseToys", "themeUseKidsClothing", "themeUsePetSupplies"],
    defaultOrder: [
      "hero", "categories", "featuredProducts", "promoBanner",
      "newArrivals", "testimonials", "newsletter",
    ],
    components: {},
  },
  tech: {
    label: "templateTech",
    description: "templateTechDesc",
    thumbnail: "/themes/tech-preview.png",
    editable: false,
    useCases: ["themeUseElectronics", "themeUseGaming", "themeUseGadgets"],
    defaultOrder: [
      "hero", "categories", "featuredProducts", "promoBanner",
      "newArrivals", "socialProof", "newsletter",
    ],
    components: {},
  },
  artisan: {
    label: "templateArtisan",
    description: "templateArtisanDesc",
    thumbnail: "/themes/artisan-preview.png",
    editable: false,
    useCases: ["themeUseHandmade", "themeUseBakery", "themeUseOrganic"],
    defaultOrder: [
      "hero", "categories", "featuredProducts", "promoBanner",
      "newArrivals", "craftStory", "newsletter",
    ],
    components: {},
  },
  magazine: {
    label: "templateMagazine",
    description: "templateMagazineDesc",
    thumbnail: "/themes/magazine-preview.png",
    editable: false,
    useCases: ["themeUseFashion", "themeUseBeauty", "themeUseLifestyle"],
    defaultOrder: [
      "hero", "categories", "featuredProducts", "promoBanner",
      "newArrivals", "editorial", "newsletter",
    ],
    components: {},
  },
  noir: {
    label: "templateNoir",
    description: "templateNoirDesc",
    thumbnail: "/themes/noir-preview.png",
    editable: false,
    useCases: ["themeUseLuxury", "themeUseWatches", "themeUsePerfume"],
    defaultOrder: [
      "noirCinematicHero", "noirBrandStatement", "noirProductGallery",
      "noirBenefitsTriptych", "noirStorySection", "noirTestimonials",
      "noirProductDetails", "noirPurchaseSection", "noirTrustFooter",
    ] as HomepageSectionKey[],
    components: {},
  },
  surge: {
    label: "templateSurge",
    description: "templateSurgeDesc",
    thumbnail: "/themes/surge-preview.png",
    editable: false,
    useCases: ["themeUseFlashSale", "themeUseProductLaunch", "themeUseTrending"],
    defaultOrder: [
      "surgeAnnouncementBar", "surgeHeroWithCta", "surgeSocialProofBar",
      "surgeProblemSolution", "surgeVideoDemo", "surgeBenefitsCarousel",
      "surgeComparison", "surgeTestimonialsGrid", "surgeMidPageCta",
      "surgeHowItWorks", "surgeFaqSection", "surgeFinalCta",
      "surgeGuaranteeBadge",
    ] as HomepageSectionKey[],
    components: {},
  },
  dynamic: {
    label: "templateDynamic",
    description: "templateDynamicDesc",
    thumbnail: "/themes/dynamic-preview.png",
    editable: true,
    useCases: ["themeUseAnyStore", "themeUseCustom"],
    defaultOrder: [
      "hero", "valuePropositions", "collections", "featuredProducts",
      "promoBanner", "newArrivals", "testimonials", "brandStory",
      "instagram", "trustBar", "newsletter", "partners", "recentlyViewed",
    ],
    components: DYNAMIC_COMPONENTS,
  },
};

/** Exported for use by admin settings page */
export { THEMES };

/** Get ordered list of theme IDs */
export function getThemeIds(): string[] {
  return Object.keys(THEMES);
}

/** Get theme config by ID (returns classic as fallback) */
export function getTheme(id: string): ThemeConfig {
  return THEMES[id] ?? THEMES.classic;
}

/* ─── Resolve template from settings (with backward compat) ────────────── */
function resolveTemplate(hp: { template?: string; mode?: string } | undefined): string {
  // Prefer `template` field — accepts any registered theme ID
  if (hp?.template && THEMES[hp.template]) return hp.template;
  // Backward compat: map old `mode` values
  if (hp?.mode === "hardcoded") return "classic";
  if (hp?.mode === "dynamic") return "dynamic";
  // Default
  return "classic";
}

/* ─── Loading skeleton ─────────────────────────────────────────────────── */
function HomepageSkeleton() {
  return (
    <div className="space-y-8 p-4">
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────── */

export function HomepageSections() {
  const { settings } = useSettings();
  const hp = settings?.homepage;

  const themeId = resolveTemplate(hp);
  const themeConfig = getTheme(themeId);

  // Lazy-load theme components (only for non-dynamic themes)
  const [loadedComponents, setLoadedComponents] = useState<ComponentMap | null>(
    themeId === "dynamic" ? DYNAMIC_COMPONENTS : null
  );

  useEffect(() => {
    if (themeId === "dynamic") {
      setLoadedComponents(DYNAMIC_COMPONENTS);
      return;
    }
    const loader = THEME_LOADERS[themeId];
    if (!loader) return;

    let cancelled = false;
    loader().then((comps) => {
      if (!cancelled) setLoadedComponents(comps);
    });
    return () => { cancelled = true; };
  }, [themeId]);

  const order = useMemo(() => {
    const stored = hp?.sectionOrder;
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return themeConfig.defaultOrder;
    }
    // Filter stored order to only include keys valid for this theme
    const validKeys = new Set(themeConfig.defaultOrder);
    const validStored = stored.filter((k): k is HomepageSectionKey => validKeys.has(k as HomepageSectionKey));
    // If stored order has no valid keys for this theme, use defaults
    if (validStored.length === 0) return themeConfig.defaultOrder;
    // Append any missing keys from the theme's default order
    const missing = themeConfig.defaultOrder.filter((k) => !validStored.includes(k));
    return [...validStored, ...missing];
  }, [hp?.sectionOrder, themeConfig.defaultOrder]);

  const sections: Partial<Record<HomepageSectionKey, boolean>> = hp?.sections ?? {};

  // Show skeleton while theme components are loading
  if (!loadedComponents) return <HomepageSkeleton />;

  const isLandingTemplate = themeId === "noir" || themeId === "surge";

  const content = (
    <>
      {order.map((key) => {
        const isVisible = sections[key] !== false;
        if (!isVisible) return null;

        const Component = loadedComponents[key];
        if (!Component) return null;

        return <Component key={key} />;
      })}
    </>
  );

  // Single-product templates need the LandingProductProvider for shared product data
  if (isLandingTemplate) {
    return <LandingProductProvider>{content}</LandingProductProvider>;
  }

  return content;
}
