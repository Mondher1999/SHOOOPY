import axiosInstance from "@/utils/axiosInstance";
import type { Product, PaginationInfo, ProductQueryParams } from "@/types";

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

// ─── Protected ────────────────────────────────────────────────────────────────

export interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number | null;
  category?: string | null;
  images?: string[];
  stock?: number;
  sku?: string | null;
  attributes?: Record<string, string>;
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
