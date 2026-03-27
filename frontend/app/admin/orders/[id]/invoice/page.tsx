"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/SettingsContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import axiosInstance from "@/utils/axiosInstance";
import logger from "@/lib/logger";
import type { AdminOrder } from "@/types";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["admin", "orders"]);
  const { settings } = useSettings();
  const formatPrice = useFormatPrice();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get(`/api/orders/admin/${id}`);
        if (data.success) setOrder(data.data);
      } catch (err) {
        logger.error("loadOrder error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!order) {
    return <div className="max-w-3xl mx-auto p-8 text-center text-polaris-text-subdued">{t("invoice.notFound")}</div>;
  }

  const storeName = settings?.store?.name || "ShopFlow";
  const storeAddress = settings?.store?.address || "";
  const storeEmail = settings?.store?.contactEmail || "";
  const storePhone = settings?.store?.contactPhone || "";
  const addr = order.shippingAddress;
  const itemsTotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const rawLogo = settings?.store?.logoEnabled && settings?.store?.logo ? settings.store.logo : null;
  const storeLogo = rawLogo ? (rawLogo.startsWith("/") ? `${BASE_URL}${rawLogo}` : rawLogo) : null;

  return (
    <>
      {/* Sticky action bar — hidden on print */}
      <div className="print:hidden sticky top-0 z-10 bg-polaris-surface border-b border-polaris-border shadow-sm">
        <div className="max-w-3xl mx-auto px-8 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="text-polaris-text hover:bg-polaris-surface-hovered">
            <Link href={`/admin/orders/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("orders:admin.backToOrders")}
            </Link>
          </Button>
          <Button onClick={handlePrint}>{t("invoice.print")}</Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8 bg-white print:shadow-none mt-6" id="invoice">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice, #invoice * { visibility: visible; }
            #invoice { position: absolute; left: 0; top: 0; width: 100%; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b">
          <div>
            {storeLogo && (
              <img src={storeLogo} alt={storeName} className="h-12 w-auto object-contain mb-2" />
            )}
            <h1 className="text-xl font-semibold text-polaris-text">{storeName}</h1>
            {storeAddress && <p className="text-sm text-polaris-text-subdued mt-1 whitespace-pre-wrap">{storeAddress}</p>}
            {storeEmail && <p className="text-sm text-polaris-text-subdued">{storeEmail}</p>}
            {storePhone && <p className="text-sm text-polaris-text-subdued">{storePhone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">{t("invoice.title")}</h2>
            <p className="text-sm text-polaris-text-subdued mt-1">#{order.orderNumber}</p>
            <p className="text-sm text-polaris-text-subdued">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold uppercase text-polaris-text-subdued mb-2">{t("invoice.billTo")}</h3>
            <p className="font-medium">{addr.fullName}</p>
            <p className="text-sm text-polaris-text-subdued">{addr.street}</p>
            <p className="text-sm text-polaris-text-subdued">{addr.city}, {addr.state} {addr.postalCode}</p>
            <p className="text-sm text-polaris-text-subdued">{addr.country}</p>
            <p className="text-sm text-polaris-text-subdued">{addr.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase text-polaris-text-subdued mb-2">{t("invoice.orderInfo")}</h3>
            <p className="text-sm"><span className="font-medium">{t("invoice.status")}:</span> {t(`orders:status.${order.status}`)}</p>
            <p className="text-sm"><span className="font-medium">{t("invoice.payment")}:</span> {order.paymentMethod?.toLowerCase() === "cod" ? t("admin:invoice.cod") : order.paymentMethod}</p>
            {order.user && (
              <p className="text-sm"><span className="font-medium">{t("invoice.customer")}:</span> {order.user.name} ({order.user.email})</p>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2">
              <th className="py-2 text-left font-semibold">{t("invoice.item")}</th>
              <th className="py-2 text-center font-semibold">{t("invoice.qty")}</th>
              <th className="py-2 text-right font-semibold">{t("invoice.price")}</th>
              <th className="py-2 text-right font-semibold">{t("invoice.total")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b">
                <td className="py-2">{item.name}</td>
                <td className="py-2 text-center">{item.quantity}</td>
                <td className="py-2 text-right">{formatPrice(item.price)}</td>
                <td className="py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t("invoice.subtotal")}</span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("invoice.shipping")}</span>
              <span>{formatPrice(order.shippingCost || 0)}</span>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t("invoice.discount")} {order.couponCode ? `(${order.couponCode})` : ""}</span>
                <span>-{formatPrice(order.discountAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>{t("invoice.grandTotal")}</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
