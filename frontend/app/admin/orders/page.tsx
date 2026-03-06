"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Search, Eye, Package, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllOrdersAdminAPI } from "@/services/order-service";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logger from "@/lib/logger";
import type { AdminOrder, OrderStatus, PaginationInfo } from "@/types";

const STATUS_TABS: (OrderStatus | "all")[] = [
  "all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled",
];

export default function AdminOrdersPage() {
  const { t } = useTranslation("orders");

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 20, total: 0, pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAllOrdersAdminAPI({
        page,
        limit: 20,
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: debouncedSearch || undefined,
      });
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch (err) {
      logger.error("fetchAdminOrders error:", err);
      setError(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, debouncedSearch, t]);

  // Reset to page 1 when filters change
  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="space-y-4 p-4 lg:p-8">
      <h1 className="text-2xl font-bold">{t("admin.title")}</h1>

      {/* Status filter tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="flex-wrap h-auto gap-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="text-xs sm:text-sm">
              {tab === "all" ? t("admin.all") : t(`status.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label={t("admin.searchPlaceholder")}
        />
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoading && orders.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{t("admin.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        /* Orders table — responsive as cards on mobile */
        <>
          {/* Desktop table header */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <div className="col-span-2">{t("admin.colOrder")}</div>
            <div className="col-span-3">{t("admin.colCustomer")}</div>
            <div className="col-span-2">{t("admin.colDate")}</div>
            <div className="col-span-1">{t("admin.colItems")}</div>
            <div className="col-span-2">{t("admin.colTotal")}</div>
            <div className="col-span-1">{t("admin.colStatus")}</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-2">
            {orders.map((order) => (
              <Card key={order.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  {/* Mobile layout */}
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.user.name} &middot; {order.user.email}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formatDate(order.createdAt)}</span>
                      <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
                    </div>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        {t("admin.viewDetails")}
                      </Link>
                    </Button>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-medium truncate" title={order.user.name}>{order.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate" title={order.user.email}>{order.user.email}</p>
                    </div>
                    <div className="col-span-2 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="col-span-1 text-sm text-muted-foreground">
                      {order.items.length}
                    </div>
                    <div className="col-span-2 text-sm font-medium">
                      {formatCurrency(order.totalPrice)}
                    </div>
                    <div className="col-span-1">
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" asChild aria-label={t("admin.viewDetails")}>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                aria-label={t("pagination.prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pagination.pageOf", { page: pagination.page, pages: pagination.pages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchOrders(pagination.page + 1)}
                aria-label={t("pagination.next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
