"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getOrderByIdAPI } from "@/services/order-service";
import { useAuth } from "@/contexts/AuthContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { Order } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function SuccessSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

// Status badge colors stay semantic (universal UX) regardless of theme
const statusColors: Record<string, string> = {
  pending:    "bg-yellow-100 text-yellow-800",
  confirmed:  "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped:    "bg-indigo-100 text-indigo-800",
  delivered:  "bg-green-100 text-green-800",
  cancelled:  "bg-red-100 text-red-800",
};

export default function CheckoutSuccessPage() {
  const { t } = useTranslation("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();

  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!orderId) {
      router.replace("/");
      return;
    }
    const fetch = async () => {
      try {
        const res = await getOrderByIdAPI(orderId);
        setOrder(res.data);
      } catch (err) {
        logger.error("Success page fetch order error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [orderId, router]);

  if (authLoading || isLoading) return <SuccessSkeleton />;
  if (!order) return null;

  return (
    <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
      <main className="max-w-lg mx-auto px-4 py-16">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className={cn("inline-flex items-center justify-center h-16 w-16 rounded-full mb-4", theme.successBg)}>
            <CheckCircle2 className={cn("h-8 w-8", theme.successText)} aria-hidden="true" />
          </div>
          <h1 className={cn("text-2xl font-bold mb-2", theme.text, theme.headingClass)}>{t("success.title")}</h1>
          <p className={theme.textMuted}>{t("success.subtitle")}</p>
        </div>

        {/* Order card */}
        <Card className={cn("mb-6 border", theme.surface, theme.border)}>
          <CardContent className="pt-6 space-y-4">
            {/* Order number + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-xs uppercase tracking-wide mb-1", theme.textMuted)}>
                  {t("success.orderNumber")}
                </p>
                <p className={cn("font-bold text-lg", theme.text)}>{order.orderNumber}</p>
              </div>
              <Badge
                className={statusColors[order.status] ?? "bg-muted text-muted-foreground"}
                variant="outline"
              >
                {t(`success.status.${order.status}`, order.status)}
              </Badge>
            </div>

            <div className={cn("h-px w-full", theme.separator)} />

            {/* Items */}
            <div>
              <p className={cn("text-sm font-semibold mb-3 flex items-center gap-2", theme.text)}>
                <Package className="h-4 w-4" aria-hidden="true" />
                {t("success.items", { count: order.items.length })}
              </p>
              <ul className="space-y-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex items-center gap-2">
                      {item.image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${BASE_URL}${item.image}`}
                          alt={item.name}
                          className={cn("h-10 w-10 rounded object-cover flex-shrink-0", theme.surface)}
                        />
                      )}
                      <span className={cn("line-clamp-2", theme.text)}>{item.name}</span>
                    </div>
                    <span className={cn("flex-shrink-0 ml-2 font-medium", theme.text)}>
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn("h-px w-full", theme.separator)} />

            {/* Shipping address */}
            <div>
              <p className={cn("text-xs uppercase tracking-wide mb-1", theme.textMuted)}>
                {t("success.shippingTo")}
              </p>
              <p className={cn("text-sm font-medium", theme.text)}>{order.shippingAddress.fullName}</p>
              <p className={cn("text-sm", theme.textMuted)}>{order.shippingAddress.phone}</p>
              <p className={cn("text-sm", theme.textMuted)}>
                {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            </div>

            <div className={cn("h-px w-full", theme.separator)} />

            {/* Totals */}
            <div className={cn("flex justify-between font-semibold", theme.text)}>
              <span>{t("success.total")}</span>
              <span>{formatPrice(order.totalPrice)}</span>
            </div>

            <p className={cn("text-xs text-center", theme.textMuted)}>
              {t("success.codNote")}
            </p>
          </CardContent>
        </Card>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className={cn("flex-1", theme.btnPrimary)}>
            <Link href="/dashboard/orders">{t("success.viewOrders")}</Link>
          </Button>
          <Button variant="ghost" asChild className={cn("flex-1", theme.btnOutline)}>
            <Link href="/products">{t("success.continueShopping")}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
