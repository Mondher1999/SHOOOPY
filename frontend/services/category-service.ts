import axiosInstance from "@/utils/axiosInstance";
import type { Category, CategoryNode } from "@/types";

// ─── Public ───────────────────────────────────────────────────────────────────

export async function getAllCategoriesAPI(): Promise<{ success: true; data: Category[] }> {
  const response = await axiosInstance.get<{ success: true; data: Category[] }>("/api/categories");
  return response.data;
}

export async function getCategoryTreeAPI(): Promise<{ success: true; data: CategoryNode[] }> {
  const response = await axiosInstance.get<{ success: true; data: CategoryNode[] }>(
    "/api/categories/tree"
  );
  return response.data;
}

export async function getCategoryByIdAPI(id: string): Promise<{ success: true; data: Category }> {
  const response = await axiosInstance.get<{ success: true; data: Category }>(
    `/api/categories/${id}`
  );
  return response.data;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function createCategoryAPI(data: {
  name: string;
  description?: string;
  parent?: string | null;
  image?: string | null;
  isActive?: boolean;
}): Promise<{ success: true; data: Category }> {
  const response = await axiosInstance.post<{ success: true; data: Category }>(
    "/api/categories",
    data
  );
  return response.data;
}

export async function updateCategoryAPI(
  id: string,
  data: {
    name?: string;
    description?: string;
    parent?: string | null;
    image?: string | null;
    isActive?: boolean;
  }
): Promise<{ success: true; data: Category }> {
  const response = await axiosInstance.put<{ success: true; data: Category }>(
    `/api/categories/${id}`,
    data
  );
  return response.data;
}

export async function deleteCategoryAPI(
  id: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.delete<{ success: true; data: { message: string } }>(
    `/api/categories/${id}`
  );
  return response.data;
}
