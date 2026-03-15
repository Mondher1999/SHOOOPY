"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { TrendingUp, DollarSign, ShoppingCart, Users, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { KPICard } from "@/components/admin/KPICard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { LowStockAlert } from "@/components/admin/LowStockAlert";
import {
  getDashboardStatsAPI,
  getRevenueChartAPI,
  getTopProductsAPI,
  getRecentOrdersAPI,
  getLowStockProductsAPI,
} from "@/services/dashboard-service";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import logger from "@/lib/logger";
import type {
  DashboardStats,
  DashboardRevenuePoint,
  DashboardTopProduct,
  DashboardLowStockProduct,
  AdminOrder,
} from "@/types";

/* Status badge colors — from design-system/MASTER.md Section 7 */
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[#E4E5E7] text-[#202223]",
  confirmed: "bg-[#A4E8F2] text-[#2C6ECB]",
  processing: "bg-[#FFEA8A] text-[#B98900]",
  shipped: "bg-[#DFE3E8] text-[#44474A]",
  delivered: "bg-[#AEE9D1] text-[#008060]",
  cancelled: "bg-[#FED3D1] text-[#D72C0D]",
};

export default function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<DashboardRevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<DashboardTopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [lowStock, setLowStock] = useState<DashboardLowStockProduct[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, chartRes, topRes, recentRes, lowRes] = await Promise.all([
        getDashboardStatsAPI(),
        getRevenueChartAPI(30),
        getTopProductsAPI(5),
        getRecentOrdersAPI(10),
        getLowStockProductsAPI(10),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
      setRecentOrders(recentRes.data);
      setLowStock(lowRes.data);
    } catch (err) {
      logger.error("Dashboard fetch error:", err);
      setError(t("dashboard.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatPrice = useFormatPrice();

  if (error && !stats) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-polaris-text">{t("dashboard.title")}</h1>
        <Alert variant="destructive">
          <AlertTitle>{t("dashboard.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboard}>{t("dashboard.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header — text-xl/600 per design-system typography */}
      <div>
        <h1 className="text-xl font-semibold text-polaris-text">{t("dashboard.title")}</h1>
        <p className="text-[13px] text-polaris-text-subdued mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title={t("dashboard.kpi.totalRevenue")}
          value={stats ? formatPrice(stats.totalRevenue) : "—"}
          description={stats ? t("dashboard.kpi.revenueToday", { amount: formatPrice(stats.revenueToday) }) : undefined}
          isLoading={isLoading}
          icon={<DollarSign className="h-4 w-4" />}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-500"
          accentClass="border-t-emerald-500"
        />
        <KPICard
          title={t("dashboard.kpi.totalOrders")}
          value={stats?.totalOrders ?? "—"}
          description={stats ? t("dashboard.kpi.ordersToday", { count: stats.ordersToday }) : undefined}
          isLoading={isLoading}
          icon={<ShoppingCart className="h-4 w-4" />}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          accentClass="border-t-blue-500"
        />
        <KPICard
          title={t("dashboard.kpi.totalUsers")}
          value={stats?.totalUsers ?? "—"}
          description={stats ? t("dashboard.kpi.newUsersMonth", { count: stats.newUsersThisMonth }) : undefined}
          isLoading={isLoading}
          icon={<Users className="h-4 w-4" />}
          iconBg="bg-violet-500/10"
          iconColor="text-violet-500"
          accentClass="border-t-violet-500"
        />
        <KPICard
          title={t("dashboard.kpi.totalProducts")}
          value={stats?.totalProducts ?? "—"}
          isLoading={isLoading}
          icon={<Package className="h-4 w-4" />}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          accentClass="border-t-orange-500"
        />
      </div>

      {/* Revenue Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} isLoading={isLoading} />
        </div>
        <div>
          <LowStockAlert products={lowStock} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Orders + Top Products — gap-3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card className="shadow-polaris">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-sm font-semibold text-polaris-text">
                {t("dashboard.recentOrders.title")}
              </CardTitle>
              <Link
                href="/admin/orders"
                className="text-sm font-medium text-polaris-primary hover:text-polaris-primary-hovered hover:underline transition-colors"
              >
                {t("dashboard.recentOrders.viewAll")}
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {isLoading ? (
                <div className="space-y-2 px-4 pb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-polaris-text-subdued py-8 text-center">
                  {t("dashboard.recentOrders.empty")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-t border-polaris-border bg-polaris-surface-hovered text-polaris-text-subdued">
                        <th className="text-left px-4 py-3 font-medium">{t("dashboard.recentOrders.order")}</th>
                        <th className="text-left px-3 py-3 font-medium hidden md:table-cell">{t("dashboard.recentOrders.customer")}</th>
                        <th className="text-right px-3 py-3 font-medium">{t("dashboard.recentOrders.total")}</th>
                        <th className="text-center px-3 py-3 font-medium hidden md:table-cell">{t("dashboard.recentOrders.status")}</th>
                        <th className="text-right px-4 py-3 font-medium hidden md:table-cell">{t("dashboard.recentOrders.date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-polaris-border">
                      {recentOrders.map((order) => (
                        <tr
                          key={order.id || order.orderNumber}
                          className="hover:bg-polaris-surface-hovered transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                        >
                          <td className="px-4 py-3 font-medium text-polaris-text truncate max-w-[180px]">{order.orderNumber}</td>
                          <td className="px-3 py-3 text-polaris-text-subdued truncate max-w-[120px] hidden md:table-cell">
                            {order.user?.name || "—"}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-polaris-text whitespace-nowrap">{formatPrice(order.totalPrice)}</td>
                          <td className="px-3 py-3 text-center hidden md:table-cell">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || ""}`}>
                              {t(`dashboard.statuses.${order.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-polaris-text-subdued text-xs whitespace-nowrap hidden md:table-cell">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card className="shadow-polaris">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-polaris-text flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-polaris-icon" />
              {t("dashboard.topProducts.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-polaris-text-subdued py-8 text-center">
                {t("dashboard.topProducts.empty")}
              </p>
            ) : (
              <ul className="divide-y divide-polaris-border" role="list">
                {topProducts.map((product, index) => (
                  <li key={product.productId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-polaris-bg text-xs font-bold text-polaris-text-subdued shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-polaris-text truncate leading-tight">{product.name}</p>
                      <p className="text-xs text-polaris-text-subdued mt-0.5">
                        {t("dashboard.topProducts.sold", { count: product.totalSold })} &middot; {formatPrice(product.totalRevenue)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
