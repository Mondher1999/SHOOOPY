"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  User,
  AlertCircle,
  Clock,
  Truck,
  Printer,
} from "lucide-react";
import { getOrderByIdAdminAPI, updateOrderStatusAPI } from "@/services/order-service";
import { sendToDeliveryAPI, trackShipmentAPI, cancelShipmentAPI } from "@/services/shipping-service";
import { StatusBadge } from "@/components/orders/StatusBadge";
import { StatusTimeline } from "@/components/orders/StatusTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import logger from "@/lib/logger";
import type { AdminOrder, OrderStatus } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation("orders");
  const { toast } = useToast();

  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update form
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isShipping, setIsShipping] = useState(false);

  const handleSendToDelivery = async () => {
    setIsShipping(true);
    try {
      const res = await sendToDeliveryAPI(id);
      setOrder(res.data);
      toast({ title: t("admin.shippingSent") });
    } catch (err) {
      logger.error("sendToDelivery error:", err);
      toast({ title: t("admin.shippingError"), variant: "destructive" });
    } finally {
      setIsShipping(false);
    }
  };

  const handleTrackShipment = async () => {
    setIsShipping(true);
    try {
      const res = await trackShipmentAPI(id);
      setOrder(res.data);
      toast({ title: t("admin.trackingUpdated") });
    } catch (err) {
      logger.error("trackShipment error:", err);
      toast({ title: t("admin.trackingError"), variant: "destructive" });
    } finally {
      setIsShipping(false);
    }
  };

  const handleCancelShipment = async () => {
    setIsShipping(true);
    try {
      const res = await cancelShipmentAPI(id);
      setOrder(res.data);
      toast({ title: t("admin.shipmentCancelled") });
    } catch (err) {
      logger.error("cancelShipment error:", err);
      toast({ title: t("admin.shipmentCancelError"), variant: "destructive" });
    } finally {
      setIsShipping(false);
    }
  };

  const fetchOrder = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getOrderByIdAdminAPI(id);
      setOrder(res.data);
    } catch (err) {
      logger.error("fetchAdminOrder error:", err);
      setError(t("errorLoading"));
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const allowedTransitions = order ? ALL_STATUSES.filter((s) => s !== order.status) : [];

  const handleStatusSubmit = () => {
    if (!newStatus) return;
    setShowConfirm(true);
  };

  const handleStatusConfirm = async () => {
    setIsUpdating(true);
    try {
      const res = await updateOrderStatusAPI(id, newStatus, statusNote.trim());
      setOrder(res.data);
      setNewStatus("");
      setStatusNote("");
      setShowConfirm(false);
      toast({ title: t("admin.statusUpdated") });
    } catch (err) {
      logger.error("updateStatus error:", err);
      toast({ title: t("admin.statusUpdateError"), variant: "destructive" });
    } finally {
      setIsUpdating(false);
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
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("back")}
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || t("orderNotFound")}</AlertDescription>
        </Alert>
        <Button onClick={fetchOrder}>{t("retry")}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {t("admin.backToOrders")}
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold text-polaris-text">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-polaris-text-subdued">{formatDate(order.createdAt)}</p>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/orders/${id}/invoice`}>
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                {t("admin.printInvoice")}
              </Link>
            </Button>
          </div>
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

      {/* Shipping Actions */}
      {order && (order.status === "processing" || order.status === "shipped") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {t("admin.shippingActions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {order.status === "processing" && (
              <Button onClick={handleSendToDelivery} disabled={isShipping}>
                <Truck className="h-4 w-4 mr-2" />
                {t("admin.sendToDelivery")}
              </Button>
            )}
            {order.status === "shipped" && (
              <>
                <Button onClick={handleTrackShipment} disabled={isShipping}>
                  <Package className="h-4 w-4 mr-2" />
                  {t("admin.trackShipment")}
                </Button>
                <Button variant="destructive" onClick={handleCancelShipment} disabled={isShipping}>
                  {t("admin.cancelShipment")}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Update Status (only if transitions available) */}
          {allowedTransitions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("admin.updateStatus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-status">{t("admin.newStatus")}</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger id="new-status">
                        <SelectValue placeholder={t("admin.selectStatus")} />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedTransitions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {t(`status.${s}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status-note">{t("admin.note")}</Label>
                    <Textarea
                      id="status-note"
                      placeholder={t("admin.notePlaceholder")}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleStatusSubmit}
                  disabled={!newStatus}
                >
                  {t("admin.submitStatus")}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Items */}
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
                  <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden bg-polaris-surface-hovered">
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
                        <Package className="h-6 w-6 text-polaris-text-subdued" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-polaris-text-subdued">
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("detail.history")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...order.statusHistory].reverse().map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <StatusBadge status={entry.status as OrderStatus} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm">{entry.note}</p>
                      <p className="text-xs text-polaris-text-subdued">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Customer info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("admin.customer")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.user.name}</p>
              <p className="text-polaris-text-subdued">{order.user.email}</p>
            </CardContent>
          </Card>

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
              <p className="text-polaris-text-subdued">{order.shippingAddress.phone}</p>
              <p className="text-polaris-text-subdued">{order.shippingAddress.street}</p>
              <p className="text-polaris-text-subdued">
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-polaris-text-subdued">{order.shippingAddress.country}</p>
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
                <span className="text-polaris-text-subdued">{t("detail.subtotal")}</span>
                <span>{formatPrice(order.totalPrice - order.shippingCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-polaris-text-subdued">{t("detail.shipping")}</span>
                <span>{order.shippingCost === 0 ? t("detail.free") : formatPrice(order.shippingCost)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base">
                <span>{t("detail.total")}</span>
                <span>{formatPrice(order.totalPrice)}</span>
              </div>
              <p className="text-xs text-polaris-text-subdued pt-1">
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
                <p className="text-sm text-polaris-text-subdued">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Status update confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.confirmStatusTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.confirmStatusDesc", {
                from: t(`status.${order.status}`),
                to: t(`status.${newStatus}`),
              })}
            </DialogDescription>
          </DialogHeader>
          {statusNote.trim() && (
            <div className="rounded-md bg-polaris-surface-hovered p-3 text-sm">
              <p className="font-medium">{t("admin.note")}:</p>
              <p className="text-polaris-text-subdued">{statusNote}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              {t("admin.cancelAction")}
            </Button>
            <Button onClick={handleStatusConfirm} disabled={isUpdating}>
              {isUpdating ? t("admin.updating") : t("admin.confirmUpdate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
