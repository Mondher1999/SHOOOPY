import axiosInstance from "@/utils/axiosInstance";
import type { PaginationInfo } from "@/types";

export interface RedirectItem {
  id: string;
  from: string;
  to: string;
  type: 301 | 302;
  isActive: boolean;
  source: "manual" | "slug-change";
  createdAt: string;
  updatedAt: string;
}

export interface RedirectsListResponse {
  redirects: RedirectItem[];
  pagination: PaginationInfo;
}

export async function getAllRedirectsAPI(
  page = 1,
  limit = 20
): Promise<{ success: true; data: RedirectsListResponse }> {
  const { data } = await axiosInstance.get(
    `/api/redirects?page=${page}&limit=${limit}`
  );
  return data;
}

export async function createRedirectAPI(payload: {
  from: string;
  to: string;
  type?: 301 | 302;
}): Promise<{ success: true; data: RedirectItem }> {
  const { data } = await axiosInstance.post("/api/redirects", payload);
  return data;
}

export async function updateRedirectAPI(
  id: string,
  payload: Partial<{ from: string; to: string; type: 301 | 302; isActive: boolean }>
): Promise<{ success: true; data: RedirectItem }> {
  const { data } = await axiosInstance.put(`/api/redirects/${id}`, payload);
  return data;
}

export async function deleteRedirectAPI(
  id: string
): Promise<{ success: true; data: { message: string } }> {
  const { data } = await axiosInstance.delete(`/api/redirects/${id}`);
  return data;
}
