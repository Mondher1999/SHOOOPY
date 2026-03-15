"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { getOrderByIdAPI, cancelOrderAPI } from "@/services/order-service";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { isColorAttr, getColorValue } from "@/lib/colorMap";
import logger from "@/lib/logger";
import type { Order } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation("orders");
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getOrderByIdAPI(id);
      setOrder(res.data);
    } catch (err) {
      logger.error("fetchOrder error:", err);
      setError(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelOrderAPI(id);
      setOrder(res.data);
      toast({ title: t("cancelSuccess") });
      setShowCancel(false);
    } catch (err) {
      logger.error("cancelOrder error:", err);
      toast({ title: t("cancelError"), variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const formatPrice = useFormatPrice();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("back")}
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || t("orderNotFound")}</AlertDescription>
        </Alert>
        <Button onClick={fetchOrder}>{t("retry")}</Button>
      </div>
    );
  }

  const canCancel = ["pending", "confirmed"].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-1 -ml-2">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("back")}
            </Link>
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("detail.tracking")}</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline
            statusHistory={order.statusHistory}
            currentStatus={order.status}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                {t("detail.items")} ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-muted">
                    {item.image ? (
                      <Image
                        src={`${BASE_URL}${item.image}`}
                        alt={item.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
                        {Object.entries(item.selectedOptions).map(([key, value], idx) => (
                          <span key={key} className="inline-flex items-center gap-0.5">
                            {idx > 0 && <span className="mx-0.5">/</span>}
                            <span>{t("products:typeAttrs." + key, { defaultValue: key })}:</span>
                            {isColorAttr(key) && getColorValue(value) && (
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                                style={{ backgroundColor: getColorValue(value) }}
                                aria-hidden="true"
                              />
                            )}
                            <span className="font-medium">{value}</span>
                          </span>
                        ))}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {t("detail.qty", { count: item.quantity })} &times; {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="text-sm font-medium shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Status History */}
          {order.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("detail.history")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...order.statusHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <StatusBadge status={entry.status as Order["status"]} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm">{t(`detail.statusNotes.${entry.note}`, { defaultValue: entry.note })}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t("detail.shippingAddress")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
              <p className="text-muted-foreground">{order.shippingAddress.street}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
            </CardContent>
          </Card>

          {/* Order summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t("detail.summary")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.subtotal")}</span>
                <span>{formatPrice(order.totalPrice - order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("detail.shipping")}</span>
                <span>{order.shippingCost === 0 ? t("detail.free") : formatPrice(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{t("detail.total")}</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {t("detail.paymentMethod")}: {t("detail.cod")}
              </p>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("detail.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("cancelDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("cancelDialog.description", { orderNumber: order.orderNumber })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              {t("cancelDialog.keep")}
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? t("cancelDialog.cancelling") : t("cancelDialog.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
