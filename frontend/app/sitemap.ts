import type { MetadataRoute } from "next";
import {
  serverFetchAllProducts,
  serverFetchCategories,
} from "@/lib/server-api";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 86400; // Revalidate sitemap every 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Collect all product slugs (paginate through all pages)
  const allProducts: { slug: string; updatedAt: string }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await serverFetchAllProducts(page, 100);
    if (!result || result.products.length === 0) break;
    allProducts.push(
      ...result.products.map((p) => ({
        slug: p.slug,
        updatedAt: p.updatedAt,
      }))
    );
    hasMore = page < result.pagination.pages;
    page++;
  }

  // Collect all categories
  const categories = (await serverFetchCategories()) ?? [];

  const productEntries: MetadataRoute.Sitemap = allProducts.map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
