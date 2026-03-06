"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import logger from "@/lib/logger";
import type {
  DashboardStats,
  DashboardRevenuePoint,
  DashboardTopProduct,
  DashboardLowStockProduct,
  AdminOrder,
} from "@/types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboardPage() {
  const { t } = useTranslation("admin");

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

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Error state
  if (error && !stats) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <Alert variant="destructive">
          <AlertTitle>{t("dashboard.errorTitle")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchDashboard}>{t("dashboard.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("dashboard.kpi.totalRevenue")}
          value={stats ? formatCurrency(stats.totalRevenue) : "—"}
          icon={<DollarSign className="h-5 w-5" />}
          description={stats ? t("dashboard.kpi.revenueToday", { amount: formatCurrency(stats.revenueToday) }) : undefined}
          isLoading={isLoading}
        />
        <KPICard
          title={t("dashboard.kpi.totalOrders")}
          value={stats?.totalOrders ?? "—"}
          icon={<ShoppingBag className="h-5 w-5" />}
          description={stats ? t("dashboard.kpi.ordersToday", { count: stats.ordersToday }) : undefined}
          isLoading={isLoading}
        />
        <KPICard
          title={t("dashboard.kpi.totalUsers")}
          value={stats?.totalUsers ?? "—"}
          icon={<Users className="h-5 w-5" />}
          description={stats ? t("dashboard.kpi.newUsersMonth", { count: stats.newUsersThisMonth }) : undefined}
          isLoading={isLoading}
        />
        <KPICard
          title={t("dashboard.kpi.totalProducts")}
          value={stats?.totalProducts ?? "—"}
          icon={<Package className="h-5 w-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue Chart + Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} isLoading={isLoading} />
        </div>
        <div>
          <LowStockAlert products={lowStock} isLoading={isLoading} />
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t("dashboard.recentOrders.title")}</CardTitle>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">
                  {t("dashboard.recentOrders.viewAll")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  {t("dashboard.recentOrders.empty")}
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Desktop header */}
                  <div className="hidden md:grid md:grid-cols-5 gap-2 px-3 py-1 text-xs font-medium text-muted-foreground uppercase">
                    <span>{t("dashboard.recentOrders.order")}</span>
                    <span>{t("dashboard.recentOrders.customer")}</span>
                    <span className="text-right">{t("dashboard.recentOrders.total")}</span>
                    <span className="text-center">{t("dashboard.recentOrders.status")}</span>
                    <span className="text-right">{t("dashboard.recentOrders.date")}</span>
                  </div>
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id || order.orderNumber}
                      href={`/admin/orders/${order.id}`}
                      className="grid grid-cols-2 md:grid-cols-5 gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors items-center"
                    >
                      <span className="font-medium truncate">{order.orderNumber}</span>
                      <span className="hidden md:block text-muted-foreground truncate">
                        {order.user?.name || "—"}
                      </span>
                      <span className="text-right font-medium">{formatCurrency(order.totalPrice)}</span>
                      <span className="hidden md:flex justify-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] || ""}`}>
                          {t(`dashboard.statuses.${order.status}`)}
                        </span>
                      </span>
                      <span className="hidden md:block text-right text-muted-foreground text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("dashboard.topProducts.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {t("dashboard.topProducts.empty")}
              </p>
            ) : (
              <ul className="space-y-3" role="list">
                {topProducts.map((product, index) => (
                  <li key={product.productId} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5 text-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("dashboard.topProducts.sold", { count: product.totalSold })} &middot; {formatCurrency(product.totalRevenue)}
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
