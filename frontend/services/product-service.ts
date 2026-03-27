import axiosInstance from "@/utils/axiosInstance";
import type { Product, ProductImage, PaginationInfo, ProductQueryParams } from "@/types";

export interface ProductsListResponse {
  products: Product[];
  pagination: PaginationInfo;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export async function getAllProductsAPI(
  params: ProductQueryParams = {}
): Promise<{ success: true; data: ProductsListResponse }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.category) query.set("category", params.category);
  if (params.minPrice !== undefined) query.set("minPrice", String(params.minPrice));
  if (params.maxPrice !== undefined) query.set("maxPrice", String(params.maxPrice));
  if (params.inStock) query.set("inStock", "true");
  if (params.rating !== undefined) query.set("rating", String(params.rating));
  if (params.sort) query.set("sort", params.sort);
  if (params.search) query.set("search", params.search);

  const response = await axiosInstance.get<{ success: true; data: ProductsListResponse }>(
    `/api/products?${query.toString()}`
  );
  return response.data;
}

export async function getProductByIdAPI(id: string): Promise<{ success: true; data: Product }> {
  const response = await axiosInstance.get<{ success: true; data: Product }>(
    `/api/products/${id}`
  );
  return response.data;
}

export interface SlimProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: ProductImage[];
  ratings: { average: number; count: number };
}

export async function searchProductsAPI(
  q: string,
  limit = 5
): Promise<{ success: true; data: { products: SlimProduct[] } }> {
  const query = new URLSearchParams({ q, limit: String(limit) });
  const response = await axiosInstance.get<{ success: true; data: { products: SlimProduct[] } }>(
    `/api/products/search?${query.toString()}`
  );
  return response.data;
}

export async function getProductBySlugAPI(slug: string): Promise<{ success: true; data: Product }> {
  const response = await axiosInstance.get<{ success: true; data: Product }>(
    `/api/products/slug/${encodeURIComponent(slug)}`
  );
  return response.data;
}

// ─── Protected ────────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  category?: string | null;
  /** Structured image objects — set by the image upload pipeline, not manual URL entry */
  images?: ProductImage[];
  stock?: number;
  sku?: string | null;
  attributes?: Record<string, string | string[]>;
  productType?: string | null;
  variantMode?: "none" | "simple" | "advanced";
  variants?: { optionCombo: Record<string, string>; stock: number; sku: string | null; enabled: boolean }[];
}

export async function createProductAPI(
  data: ProductFormData
): Promise<{ success: true; data: Product }> {
  const response = await axiosInstance.post<{ success: true; data: Product }>(
    "/api/products",
    data
  );
  return response.data;
}

export async function updateProductAPI(
  id: string,
  data: Partial<ProductFormData> & { isActive?: boolean }
): Promise<{ success: true; data: Product }> {
  const response = await axiosInstance.put<{ success: true; data: Product }>(
    `/api/products/${id}`,
    data
  );
  return response.data;
}

export async function deleteProductAPI(
  id: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.delete<{ success: true; data: { message: string } }>(
    `/api/products/${id}`
  );
  return response.data;
}
