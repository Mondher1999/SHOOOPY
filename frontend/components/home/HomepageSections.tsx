"use client";

import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
// Dynamic template components
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
// Classic template components
import {
  HCHero,
  HCTrustBadges,
  HCSEOHeadline,
  HCTrendingCategories,
  HCTopSelling,
  HCPromoBanner,
  HCNewArrivals,
  HCWelcome,
  HCAboutUs,
  HCBrand,
  HCGallery,
  HCPartnersBar,
} from "./HardcodedHomepage";
// Bold template components
import {
  BDHero,
  BDCategories,
  BDFeaturedProducts,
  BDPromoBanner,
  BDNewArrivals,
  BDSocialProof,
  BDNewsletter,
} from "./BoldHomepage";
// Elegant template components
import {
  ELHero,
  ELCollections,
  ELFeaturedProducts,
  ELPromoBanner,
  ELNewArrivals,
  ELBrandStory,
  ELNewsletter,
} from "./ElegantHomepage";
// Minimal template components
import {
  MNHero,
  MNFeaturedProducts,
  MNNewArrivals,
  MNCategories,
  MNNewsletter,
} from "./MinimalHomepage";
// Playful template components
import {
  PLHero,
  PLCategories,
  PLFeaturedProducts,
  PLPromoBanner,
  PLNewArrivals,
  PLTestimonials,
  PLNewsletter,
} from "./PlayfulHomepage";
// Tech template components
import {
  TKHero,
  TKCategories,
  TKFeaturedProducts,
  TKPromoBanner,
  TKNewArrivals,
  TKSocialProof,
  TKNewsletter,
} from "./TechHomepage";
// Artisan template components
import {
  ARHero,
  ARCategories,
  ARFeaturedProducts,
  ARPromoBanner,
  ARNewArrivals,
  ARCraftStory,
  ARNewsletter,
} from "./ArtisanHomepage";
// Magazine template components
import {
  MGHero,
  MGCategories,
  MGFeaturedProducts,
  MGPromoBanner,
  MGNewArrivals,
  MGEditorial,
  MGNewsletter,
} from "./MagazineHomepage";
// Noir (single-product premium) template components
import {
  NRCinematicHero,
  NRBrandStatement,
  NRProductGallery,
  NRBenefitsTriptych,
  NRStorySection,
  NRTestimonials,
  NRProductDetails,
  NRPurchaseSection,
  NRTrustFooter,
} from "./NoirHomepage";
// Surge (single-product high-energy) template components
import {
  SGAnnouncementBar,
  SGHeroWithCta,
  SGSocialProofBar,
  SGProblemSolution,
  SGVideoDemo,
  SGBenefitsCarousel,
  SGComparison,
  SGTestimonialsGrid,
  SGMidPageCta,
  SGHowItWorks,
  SGFaqSection,
  SGFinalCta,
  SGGuaranteeBadge,
} from "./SurgeHomepage";
import { LandingProductProvider } from "@/hooks/useLandingProduct";
import type { HomepageSectionKey, ThemeConfig } from "@/types";

/* ─── Theme Registry ──────────────────────────────────────────────────── */
/*
 * To add a new hardcoded theme:
 * 1. Code your sections in a new file (e.g., MinimalHomepage.tsx)
 * 2. Export each section component
 * 3. Import them here
 * 4. Add an entry to THEMES below
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
    components: {
      hero: HCHero,
      trustBadges: HCTrustBadges,
      trendingCategories: HCTrendingCategories,
      topSelling: HCTopSelling,
      promoBanner: HCPromoBanner,
      newArrivals: HCNewArrivals,
      welcome: HCWelcome,
      aboutUs: HCAboutUs,
      brand: HCBrand,
      gallery: HCGallery,
      seoHeadline: HCSEOHeadline,
      partners: HCPartnersBar,
    },
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
    components: {
      hero: BDHero,
      categories: BDCategories,
      featuredProducts: BDFeaturedProducts,
      promoBanner: BDPromoBanner,
      newArrivals: BDNewArrivals,
      socialProof: BDSocialProof,
      newsletter: BDNewsletter,
    },
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
    components: {
      hero: ELHero,
      collections: ELCollections,
      featuredProducts: ELFeaturedProducts,
      promoBanner: ELPromoBanner,
      newArrivals: ELNewArrivals,
      brandStory: ELBrandStory,
      newsletter: ELNewsletter,
    },
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
    components: {
      hero: MNHero,
      featuredProducts: MNFeaturedProducts,
      newArrivals: MNNewArrivals,
      categories: MNCategories,
      newsletter: MNNewsletter,
    },
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
    components: {
      hero: PLHero,
      categories: PLCategories,
      featuredProducts: PLFeaturedProducts,
      promoBanner: PLPromoBanner,
      newArrivals: PLNewArrivals,
      testimonials: PLTestimonials,
      newsletter: PLNewsletter,
    },
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
    components: {
      hero: TKHero,
      categories: TKCategories,
      featuredProducts: TKFeaturedProducts,
      promoBanner: TKPromoBanner,
      newArrivals: TKNewArrivals,
      socialProof: TKSocialProof,
      newsletter: TKNewsletter,
    },
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
    components: {
      hero: ARHero,
      categories: ARCategories,
      featuredProducts: ARFeaturedProducts,
      promoBanner: ARPromoBanner,
      newArrivals: ARNewArrivals,
      craftStory: ARCraftStory,
      newsletter: ARNewsletter,
    },
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
    components: {
      hero: MGHero,
      categories: MGCategories,
      featuredProducts: MGFeaturedProducts,
      promoBanner: MGPromoBanner,
      newArrivals: MGNewArrivals,
      editorial: MGEditorial,
      newsletter: MGNewsletter,
    },
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
    components: {
      noirCinematicHero: NRCinematicHero,
      noirBrandStatement: NRBrandStatement,
      noirProductGallery: NRProductGallery,
      noirBenefitsTriptych: NRBenefitsTriptych,
      noirStorySection: NRStorySection,
      noirTestimonials: NRTestimonials,
      noirProductDetails: NRProductDetails,
      noirPurchaseSection: NRPurchaseSection,
      noirTrustFooter: NRTrustFooter,
    },
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
    components: {
      surgeAnnouncementBar: SGAnnouncementBar,
      surgeHeroWithCta: SGHeroWithCta,
      surgeSocialProofBar: SGSocialProofBar,
      surgeProblemSolution: SGProblemSolution,
      surgeVideoDemo: SGVideoDemo,
      surgeBenefitsCarousel: SGBenefitsCarousel,
      surgeComparison: SGComparison,
      surgeTestimonialsGrid: SGTestimonialsGrid,
      surgeMidPageCta: SGMidPageCta,
      surgeHowItWorks: SGHowItWorks,
      surgeFaqSection: SGFaqSection,
      surgeFinalCta: SGFinalCta,
      surgeGuaranteeBadge: SGGuaranteeBadge,
    },
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
    components: {
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
    },
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

/* ─── Main Component ───────────────────────────────────────────────────── */

export function HomepageSections() {
  const { settings } = useSettings();
  const hp = settings?.homepage;

  const themeId = resolveTemplate(hp);
  const themeConfig = getTheme(themeId);

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

  const isLandingTemplate = themeId === "noir" || themeId === "surge";

  const content = (
    <>
      {order.map((key) => {
        const isVisible = sections[key] !== false;
        if (!isVisible) return null;

        const Component = themeConfig.components[key];
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
