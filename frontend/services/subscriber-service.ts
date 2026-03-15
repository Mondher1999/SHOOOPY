import { fetchAPI } from "@/lib/api";
import axiosInstance from "@/utils/axiosInstance";

export async function subscribeAPI(
  email: string,
  source: "homepage" | "checkout" | "footer" = "homepage"
): Promise<{ success: true; data: { email: string; subscribedAt: string } }> {
  return fetchAPI<{ success: true; data: { email: string; subscribedAt: string } }>(
    "/api/subscribers",
    { method: "POST", body: JSON.stringify({ email, source }), headers: { "Content-Type": "application/json" } }
  );
}

export async function listSubscribersAPI(
  page = 1,
  limit = 20
): Promise<{ success: true; data: { subscribers: { id: string; email: string; subscribedAt: string; source: string }[]; total: number; page: number; pages: number } }> {
  const { data } = await axiosInstance.get(`/api/subscribers?page=${page}&limit=${limit}`);
  return data;
}

export async function exportSubscribersAPI(): Promise<Blob> {
  const { data } = await axiosInstance.get("/api/subscribers/export", {
    responseType: "blob",
  });
  return data;
}
