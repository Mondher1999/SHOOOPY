import axiosInstance from "@/utils/axiosInstance";
import type { Order, AdminOrder, OrderStats, PaginationInfo } from "@/types";

type OrderResponse = { success: true; data: Order };
type OrderListResponse = {
  success: true;
  data: { orders: Order[]; pagination: PaginationInfo };
};

// ─── Customer endpoints ──────────────────────────────────────────────────────

export async function placeOrderAPI(addressId: string, notes?: string): Promise<OrderResponse> {
  const res = await axiosInstance.post<OrderResponse>("/api/orders", { addressId, notes });
  return res.data;
}

export async function getMyOrdersAPI(page = 1, limit = 10): Promise<OrderListResponse> {
  const res = await axiosInstance.get<OrderListResponse>("/api/orders/my-orders", {
    params: { page, limit },
  });
  return res.data;
}

export async function getOrderByIdAPI(id: string): Promise<OrderResponse> {
  const res = await axiosInstance.get<OrderResponse>(`/api/orders/${id}`);
  return res.data;
}

export async function cancelOrderAPI(id: string): Promise<OrderResponse> {
  const res = await axiosInstance.put<OrderResponse>(`/api/orders/${id}/cancel`);
  return res.data;
}

// ─── Admin endpoints ─────────────────────────────────────────────────────────

type AdminOrderListResponse = {
  success: true;
  data: { orders: AdminOrder[]; pagination: PaginationInfo };
};
type AdminOrderResponse = { success: true; data: AdminOrder };
type OrderStatsResponse = { success: true; data: OrderStats };

export interface AdminOrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAllOrdersAdminAPI(
  query: AdminOrderQuery = {}
): Promise<AdminOrderListResponse> {
  const res = await axiosInstance.get<AdminOrderListResponse>("/api/orders/admin", {
    params: query,
  });
  return res.data;
}

export async function getOrderByIdAdminAPI(id: string): Promise<AdminOrderResponse> {
  const res = await axiosInstance.get<AdminOrderResponse>(`/api/orders/admin/${id}`);
  return res.data;
}

export async function updateOrderStatusAPI(
  id: string,
  status: string,
  note: string
): Promise<AdminOrderResponse> {
  const res = await axiosInstance.put<AdminOrderResponse>(`/api/orders/admin/${id}/status`, {
    status,
    note,
  });
  return res.data;
}

export async function getOrderStatsAPI(days = 30): Promise<OrderStatsResponse> {
  const res = await axiosInstance.get<OrderStatsResponse>("/api/orders/stats", {
    params: { days },
  });
  return res.data;
}
