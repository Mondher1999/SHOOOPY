import axiosInstance from "@/utils/axiosInstance";
import type {
  DashboardStats,
  DashboardRevenuePoint,
  DashboardTopProduct,
  DashboardLowStockProduct,
  AdminOrder,
} from "@/types";

type StatsResponse = { success: true; data: DashboardStats };
type RevenueChartResponse = { success: true; data: DashboardRevenuePoint[] };
type TopProductsResponse = { success: true; data: DashboardTopProduct[] };
type RecentOrdersResponse = { success: true; data: AdminOrder[] };
type LowStockResponse = { success: true; data: DashboardLowStockProduct[] };

export async function getDashboardStatsAPI(): Promise<StatsResponse> {
  const res = await axiosInstance.get<StatsResponse>("/api/dashboard/stats");
  return res.data;
}

export async function getRevenueChartAPI(days = 30): Promise<RevenueChartResponse> {
  const res = await axiosInstance.get<RevenueChartResponse>("/api/dashboard/revenue-chart", {
    params: { days },
  });
  return res.data;
}

export async function getTopProductsAPI(limit = 5): Promise<TopProductsResponse> {
  const res = await axiosInstance.get<TopProductsResponse>("/api/dashboard/top-products", {
    params: { limit },
  });
  return res.data;
}

export async function getRecentOrdersAPI(limit = 10): Promise<RecentOrdersResponse> {
  const res = await axiosInstance.get<RecentOrdersResponse>("/api/dashboard/recent-orders", {
    params: { limit },
  });
  return res.data;
}

export async function getLowStockProductsAPI(threshold = 10): Promise<LowStockResponse> {
  const res = await axiosInstance.get<LowStockResponse>("/api/dashboard/low-stock", {
    params: { threshold },
  });
  return res.data;
}
