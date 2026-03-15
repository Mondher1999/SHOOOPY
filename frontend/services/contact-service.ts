import axiosInstance from "@/utils/axiosInstance";
import type { Contact, PaginationInfo } from "@/types";

type ContactResponse = { success: true; data: Contact };
type ContactsListResponse = { success: true; data: { contacts: Contact[]; pagination: PaginationInfo } };

export async function submitContactAPI(payload: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactResponse> {
  const { data } = await axiosInstance.post<ContactResponse>("/api/contacts", payload);
  return data;
}

export async function getContactsAPI(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<ContactsListResponse> {
  const { data } = await axiosInstance.get<ContactsListResponse>("/api/contacts", { params });
  return data;
}

export async function getContactAPI(id: string): Promise<ContactResponse> {
  const { data } = await axiosInstance.get<ContactResponse>(`/api/contacts/${id}`);
  return data;
}

export async function updateContactStatusAPI(
  id: string,
  status: "new" | "read" | "replied"
): Promise<ContactResponse> {
  const { data } = await axiosInstance.patch<ContactResponse>(`/api/contacts/${id}`, { status });
  return data;
}

export async function deleteContactAPI(id: string): Promise<{ success: true; data: null }> {
  const { data } = await axiosInstance.delete(`/api/contacts/${id}`);
  return data;
}
