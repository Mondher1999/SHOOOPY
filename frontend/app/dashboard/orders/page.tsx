"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Package, Eye, XCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { getMyOrdersAPI, cancelOrderAPI } from "@/services/order-service";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await cancelOrderAPI(cancelTarget.id);
      toast({ title: t("cancelSuccess") });
      setCancelTarget(null);
      fetchOrders(pagination.page);
    } catch (err) {
      logger.error("cancelOrder error:", err);
      toast({ title: t("cancelError"), variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  // Loading state
  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("myOrders.title")}</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t("myOrders.title")}</h1>
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
        <h1 className="text-2xl font-bold">{t("myOrders.title")}</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">{t("myOrders.empty")}</p>
            <Button asChild className="mt-4">
              <Link href="/products">{t("myOrders.shopNow")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("myOrders.title")}</h1>

      {/* Order cards */}
      <div className="space-y-3">
        {orders.map((order) => (
          <Card key={order.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Left: order info */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)} &middot; {order.items.length}{" "}
                    {order.items.length === 1 ? t("myOrders.item") : t("myOrders.items")}
                  </p>
                  <p className="text-sm font-medium">{formatCurrency(order.totalPrice)}</p>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      {t("myOrders.viewDetails")}
                    </Link>
                  </Button>
                  {["pending", "confirmed"].includes(order.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancelTarget(order)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      {t("myOrders.cancel")}
                    </Button>
                  )}
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

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("cancelDialog.description", { orderNumber: cancelTarget?.orderNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>
              {t("cancelDialog.keep")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? t("cancelDialog.cancelling") : t("cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
