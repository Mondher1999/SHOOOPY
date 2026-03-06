import axiosInstance from "@/utils/axiosInstance";
import type { AuthUser } from "./auth-service";

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UsersListResponse {
  users: AuthUser[];
  pagination: PaginationInfo;
}

// ─── Self profile ─────────────────────────────────────────────────────────────

export async function getProfileAPI(): Promise<{ success: true; data: AuthUser }> {
  const response = await axiosInstance.get<{ success: true; data: AuthUser }>("/api/users/profile");
  return response.data;
}

export async function updateProfileAPI(data: {
  name?: string;
  email?: string;
  avatar?: File;
  language?: string;
}): Promise<{ success: true; data: AuthUser }> {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.email) formData.append("email", data.email);
  if (data.avatar) formData.append("avatar", data.avatar);
  if (data.language) formData.append("language", data.language);

  // Axios automatically sets multipart/form-data boundary when body is FormData
  const response = await axiosInstance.put<{ success: true; data: AuthUser }>(
    "/api/users/profile",
    formData
  );
  return response.data;
}

export async function changePasswordAPI(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.put<{ success: true; data: { message: string } }>(
    "/api/users/change-password",
    { currentPassword, newPassword }
  );
  return response.data;
}

export async function deleteAccountAPI(): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.delete<{ success: true; data: { message: string } }>(
    "/api/users/account"
  );
  return response.data;
}

// ─── Admin: user management ───────────────────────────────────────────────────

export async function getAllUsersAPI(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ success: true; data: UsersListResponse }> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);

  const response = await axiosInstance.get<{ success: true; data: UsersListResponse }>(
    `/api/users?${query.toString()}`
  );
  return response.data;
}

export async function getUserByIdAPI(id: string): Promise<{ success: true; data: AuthUser }> {
  const response = await axiosInstance.get<{ success: true; data: AuthUser }>(`/api/users/${id}`);
  return response.data;
}

export async function updateUserRoleAPI(
  id: string,
  role: "customer" | "admin"
): Promise<{ success: true; data: AuthUser }> {
  const response = await axiosInstance.put<{ success: true; data: AuthUser }>(
    `/api/users/${id}/role`,
    { role }
  );
  return response.data;
}

export async function banUserAPI(id: string): Promise<{ success: true; data: AuthUser }> {
  const response = await axiosInstance.put<{ success: true; data: AuthUser }>(
    `/api/users/${id}/ban`
  );
  return response.data;
}
