/**
 * JSON-LD structured data helpers for SEO.
 * All functions return plain objects — serialize with JSON.stringify in a <script> tag.
 *
 * SITE_NAME / SITE_URL are kept as fallback defaults.
 * Pages should pass the dynamic store name from settings when available.
 */

import type { Product, SocialSettings } from "@/types";

/** Fallback store name — used only when settings haven't loaded yet */
export const SITE_NAME = "ShopFlow";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://omegadistribution.tn";

// ─── Organization ────────────────────────────────────────────────────────────

export function organizationSchema(storeName?: string, social?: SocialSettings) {
  const name = storeName || SITE_NAME;
  const sameAs: string[] = [];
  if (social) {
    if (social.facebook) sameAs.push(social.facebook);
    if (social.instagram) sameAs.push(social.instagram);
    if (social.twitter) sameAs.push(social.twitter);
    if (social.youtube) sameAs.push(social.youtube);
    if (social.tiktok) sameAs.push(social.tiktok);
  }

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["French", "English"],
    },
  };
}

// ─── WebSite (Sitelinks Searchbox) ───────────────────────────────────────────

export function websiteSchema(storeName?: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName || SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

// ─── Product ─────────────────────────────────────────────────────────────────

export function productSchema(product: Product, storeName?: string, currencyCode?: string) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.large || img.original),
    sku: product.sku || product.id,
    url: `${SITE_URL}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: currencyCode || "USD",
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/products/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: storeName || SITE_NAME,
      },
    },
  };

  if (product.category) {
    schema.category = product.category.name;
  }

  if (product.ratings.count > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.ratings.average,
      reviewCount: product.ratings.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

// ─── BreadcrumbList ──────────────────────────────────────────────────────────

export function breadcrumbSchema(
  items: { name: string; url?: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: `${SITE_URL}${item.url}` } : {}),
    })),
  };
}

// ─── Helper: render JSON-LD into a <script> tag ─────────────────────────────

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
