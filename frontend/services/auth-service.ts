import axiosInstance from "@/utils/axiosInstance";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  isVerified: boolean;
  isActive: boolean;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function registerAPI(
  name: string,
  email: string,
  password: string
): Promise<{ success: true; data: AuthResponseData }> {
  const response = await axiosInstance.post<{ success: true; data: AuthResponseData }>(
    "/api/auth/register",
    { name, email, password }
  );
  return response.data;
}

export async function loginAPI(
  email: string,
  password: string
): Promise<{ success: true; data: AuthResponseData }> {
  const response = await axiosInstance.post<{ success: true; data: AuthResponseData }>(
    "/api/auth/login",
    { email, password }
  );
  return response.data;
}

export async function logoutAPI(refreshToken: string): Promise<void> {
  await axiosInstance.post("/api/auth/logout", { refreshToken });
}

export async function getMeAPI(): Promise<{ success: true; data: AuthUser }> {
  const response = await axiosInstance.get<{ success: true; data: AuthUser }>("/api/auth/me");
  return response.data;
}

export async function forgotPasswordAPI(email: string): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.post<{ success: true; data: { message: string } }>(
    "/api/auth/forgot-password",
    { email }
  );
  return response.data;
}

export async function resetPasswordAPI(
  token: string,
  password: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.post<{ success: true; data: { message: string } }>(
    `/api/auth/reset-password/${token}`,
    { password }
  );
  return response.data;
}

export async function refreshTokenAPI(
  refreshToken: string
): Promise<{ success: true; data: AuthTokens }> {
  const response = await axiosInstance.post<{ success: true; data: AuthTokens }>(
    "/api/auth/refresh-token",
    { refreshToken }
  );
  return response.data;
}

export async function verifyEmailAPI(
  token: string
): Promise<{ success: true; data: { message: string } }> {
  const response = await axiosInstance.get<{ success: true; data: { message: string } }>(
    `/api/auth/verify-email/${token}`
  );
  return response.data;
}
