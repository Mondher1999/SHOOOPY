import axiosInstance from "@/utils/axiosInstance";
import type { Cart } from "@/types";

type CartResponse = { success: true; data: Cart };

export async function getCartAPI(): Promise<CartResponse> {
  const res = await axiosInstance.get<CartResponse>("/api/cart");
  return res.data;
}

export async function addItemAPI(
  productId: string,
  quantity: number,
  selectedOptions?: Record<string, string>,
): Promise<CartResponse> {
  const res = await axiosInstance.post<CartResponse>("/api/cart/items", {
    productId,
    quantity,
    ...(selectedOptions && Object.keys(selectedOptions).length > 0 ? { selectedOptions } : {}),
  });
  return res.data;
}

export async function updateQuantityAPI(
  productId: string,
  quantity: number,
  selectedOptions?: Record<string, string>,
): Promise<CartResponse> {
  const res = await axiosInstance.put<CartResponse>(`/api/cart/items/${productId}`, {
    quantity,
    ...(selectedOptions && Object.keys(selectedOptions).length > 0 ? { selectedOptions } : {}),
  });
  return res.data;
}

export async function removeItemAPI(
  productId: string,
  selectedOptions?: Record<string, string>,
): Promise<CartResponse> {
  // Use POST route for variant-aware removal (DELETE body is unreliable)
  const res = await axiosInstance.post<CartResponse>("/api/cart/items/remove", {
    productId,
    ...(selectedOptions && Object.keys(selectedOptions).length > 0 ? { selectedOptions } : {}),
  });
  return res.data;
}

export async function clearCartAPI(): Promise<{ success: true; data: { message: string } }> {
  const res = await axiosInstance.delete<{ success: true; data: { message: string } }>("/api/cart");
  return res.data;
}

export interface GuestCartItem {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

export async function mergeCartAPI(items: GuestCartItem[]): Promise<CartResponse> {
  const res = await axiosInstance.post<CartResponse>("/api/cart/merge", { items });
  return res.data;
}
