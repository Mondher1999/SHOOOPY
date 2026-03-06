"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getOrderByIdAPI } from "@/services/order-service";
import { useAuth } from "@/contexts/AuthContext";
import logger from "@/lib/logger";
import type { Order } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function SuccessSkeleton() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 space-y-6">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-8 w-2/3 mx-auto" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  const { t } = useTranslation("checkout");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

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

  const statusColors: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-800",
    confirmed:  "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped:    "bg-indigo-100 text-indigo-800",
    delivered:  "bg-green-100 text-green-800",
    cancelled:  "bg-red-100 text-red-800",
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t("success.title")}</h1>
        <p className="text-muted-foreground">{t("success.subtitle")}</p>
      </div>

      {/* Order card */}
      <Card className="mb-6">
        <CardContent className="pt-6 space-y-4">
          {/* Order number + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {t("success.orderNumber")}
              </p>
              <p className="font-bold text-lg">{order.orderNumber}</p>
            </div>
            <Badge
              className={statusColors[order.status] ?? "bg-muted text-muted-foreground"}
              variant="outline"
            >
              {t(`success.status.${order.status}`, order.status)}
            </Badge>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
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
                        className="h-10 w-10 rounded object-cover bg-muted flex-shrink-0"
                      />
                    )}
                    <span className="line-clamp-2">{item.name}</span>
                  </div>
                  <span className="flex-shrink-0 ml-2 font-medium">
                    ×{item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          {/* Shipping address */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t("success.shippingTo")}
            </p>
            <p className="text-sm font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
            <p className="text-sm text-muted-foreground">
              {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.state} {order.shippingAddress.postalCode}
            </p>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-between font-semibold">
            <span>{t("success.total")}</span>
            <span>${order.totalPrice.toFixed(2)}</span>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {t("success.codNote")}
          </p>
        </CardContent>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link href="/dashboard/orders">{t("success.viewOrders")}</Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/products">{t("success.continueShopping")}</Link>
        </Button>
      </div>
    </main>
  );
}
