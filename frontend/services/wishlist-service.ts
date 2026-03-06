import axiosInstance from "@/utils/axiosInstance";
import type { Wishlist } from "@/types";

type WishlistResponse = { success: true; data: Wishlist };
type ClearResponse = { success: true; data: null };

export async function getWishlistAPI(): Promise<WishlistResponse> {
  const res = await axiosInstance.get<WishlistResponse>("/api/wishlist");
  return res.data;
}

export async function addToWishlistAPI(productId: string): Promise<WishlistResponse> {
  const res = await axiosInstance.post<WishlistResponse>(`/api/wishlist/${productId}`);
  return res.data;
}

export async function removeFromWishlistAPI(productId: string): Promise<WishlistResponse> {
  const res = await axiosInstance.delete<WishlistResponse>(`/api/wishlist/${productId}`);
  return res.data;
}

export async function clearWishlistAPI(): Promise<ClearResponse> {
  const res = await axiosInstance.delete<ClearResponse>("/api/wishlist");
  return res.data;
}
