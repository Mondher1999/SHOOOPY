"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Package, Eye, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyOrdersAPI } from "@/services/order-service";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import logger from "@/lib/logger";
import type { Order, PaginationInfo } from "@/types";

export default function CustomerOrdersPage() {
  const { t } = useTranslation("orders");
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1, limit: 10, total: 0, pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyOrdersAPI(page, 10);
      setOrders(res.data.orders);
      setPagination(res.data.pagination);
    } catch (err) {
      logger.error("fetchOrders error:", err);
      setError(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders(1);
  }, [fetchOrders]);

  const formatPrice = useFormatPrice();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Loading state
  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-polaris-text">{t("myOrders.title")}</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-polaris-text">{t("myOrders.title")}</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => fetchOrders(1)}>{t("retry")}</Button>
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-polaris-text">{t("myOrders.title")}</h1>
        <div className="bg-polaris-surface border border-polaris-border rounded-lg shadow-sm p-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#F1F1F1] flex items-center justify-center mb-4">
            <Package className="h-6 w-6 text-polaris-icon-subdued" />
          </div>
          <p className="text-sm font-medium text-polaris-text mb-1">{t("myOrders.empty")}</p>
          <p className="text-xs text-polaris-text-subdued mb-4">{t("myOrders.emptyHint")}</p>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium bg-polaris-primary text-white hover:bg-polaris-primary-hovered transition-colors"
          >
            {t("myOrders.shopNow")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-polaris-text">{t("myOrders.title")}</h1>
        <span className="text-xs text-polaris-text-subdued">{pagination.total} order{pagination.total !== 1 ? "s" : ""}</span>
      </div>

      {/* Order cards */}
      <div className="space-y-2">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-polaris-surface border border-polaris-border rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left: order info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold text-polaris-text">{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-polaris-text-subdued">
                    {formatDate(order.createdAt)} &middot; {order.items.length}{" "}
                    {order.items.length === 1 ? t("myOrders.item") : t("myOrders.items")}
                  </p>
                  <p className="text-sm font-semibold text-polaris-text">{formatPrice(order.totalPrice)}</p>
                </div>

                {/* Right: actions */}
                <div className="shrink-0">
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-polaris-border text-sm font-medium text-polaris-text bg-polaris-surface hover:bg-polaris-surface-hovered transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t("myOrders.viewDetails")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchOrders(pagination.page - 1)}
            aria-label={t("pagination.prev")}
            className="p-1.5 rounded-md border border-polaris-border text-polaris-text disabled:opacity-40 hover:bg-polaris-surface-hovered transition-colors disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-polaris-text-subdued">
            {t("pagination.pageOf", { page: pagination.page, pages: pagination.pages })}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchOrders(pagination.page + 1)}
            aria-label={t("pagination.next")}
            className="p-1.5 rounded-md border border-polaris-border text-polaris-text disabled:opacity-40 hover:bg-polaris-surface-hovered transition-colors disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
