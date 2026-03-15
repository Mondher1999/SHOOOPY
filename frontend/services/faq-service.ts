import axiosInstance from "@/utils/axiosInstance";
import type { FAQ } from "@/types";

type FAQResponse = { success: true; data: FAQ };
type FAQsListResponse = { success: true; data: FAQ[] };

export async function getPublicFAQsAPI(): Promise<FAQsListResponse> {
  const { data } = await axiosInstance.get<FAQsListResponse>("/api/faq");
  return data;
}

export async function getAllFAQsAPI(): Promise<FAQsListResponse> {
  const { data } = await axiosInstance.get<FAQsListResponse>("/api/faq/admin");
  return data;
}

export async function createFAQAPI(payload: {
  question: string;
  answer: string;
  order?: number;
}): Promise<FAQResponse> {
  const { data } = await axiosInstance.post<FAQResponse>("/api/faq", payload);
  return data;
}

export async function updateFAQAPI(
  id: string,
  payload: Partial<FAQ>
): Promise<FAQResponse> {
  const { data } = await axiosInstance.put<FAQResponse>(`/api/faq/${id}`, payload);
  return data;
}

export async function deleteFAQAPI(id: string): Promise<{ success: true; data: null }> {
  const { data } = await axiosInstance.delete(`/api/faq/${id}`);
  return data;
}

export async function reorderFAQsAPI(orderedIds: string[]): Promise<FAQsListResponse> {
  const { data } = await axiosInstance.put<FAQsListResponse>("/api/faq/reorder", { orderedIds });
  return data;
}
