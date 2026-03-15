import axiosInstance from "@/utils/axiosInstance";
import type { Coupon, PaginationInfo } from "@/types";

type CouponResponse = { success: true; data: Coupon };
type CouponsListResponse = { success: true; data: { coupons: Coupon[]; pagination: PaginationInfo } };
type ValidateResponse = { success: true; data: { couponId: string; code: string; type: string; value: number; discount: number } };

export async function getCouponsAPI(params?: {
  page?: number;
  limit?: number;
  search?: string;
  active?: string;
}): Promise<CouponsListResponse> {
  const { data } = await axiosInstance.get<CouponsListResponse>("/api/coupons", { params });
  return data;
}

export async function createCouponAPI(payload: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: string | null;
}): Promise<CouponResponse> {
  const { data } = await axiosInstance.post<CouponResponse>("/api/coupons", payload);
  return data;
}

export async function updateCouponAPI(
  id: string,
  payload: Partial<Coupon>
): Promise<CouponResponse> {
  const { data } = await axiosInstance.put<CouponResponse>(`/api/coupons/${id}`, payload);
  return data;
}

export async function deleteCouponAPI(id: string): Promise<{ success: true; data: null }> {
  const { data } = await axiosInstance.delete(`/api/coupons/${id}`);
  return data;
}

export async function validateCouponAPI(
  code: string,
  subtotal: number
): Promise<ValidateResponse> {
  const { data } = await axiosInstance.post<ValidateResponse>("/api/coupons/validate", { code, subtotal });
  return data;
}
