/**
 * Server-side fetch utility for use in Server Components and generateMetadata().
 * Uses plain fetch() with ISR caching — no auth required (all public endpoints).
 */

import type { Product, Category, CategoryWithAncestors, PaginationInfo, SiteSettings } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function serverFetch<T>(
  path: string,
  revalidate = 3600
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json: ApiResponse<T> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

export async function serverFetchSettings(): Promise<SiteSettings | null> {
  return serverFetch<SiteSettings>("/api/settings", 300);
}

export async function serverFetchProduct(
  slug: string
): Promise<Product | null> {
  return serverFetch<Product>(
    `/api/products/slug/${encodeURIComponent(slug)}`,
    60
  );
}

export async function serverFetchAllProducts(
  page = 1,
  limit = 100
): Promise<{ products: Product[]; pagination: PaginationInfo } | null> {
  return serverFetch<{ products: Product[]; pagination: PaginationInfo }>(
    `/api/products?page=${page}&limit=${limit}`,
    3600
  );
}

export async function serverFetchCategories(): Promise<Category[] | null> {
  return serverFetch<Category[]>("/api/categories", 3600);
}

export async function serverFetchCategoryBySlug(
  slug: string
): Promise<CategoryWithAncestors | null> {
  return serverFetch<CategoryWithAncestors>(
    `/api/categories/slug/${encodeURIComponent(slug)}`,
    3600
  );
}
