"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const SHIPPING_COST = 0; // COD — free shipping

function OrderLineItem({ item }: { item: CartItem }) {
  const { t } = useTranslation("checkout");
  const product = item.product;
  const primaryImage = product.images[0] ?? null;

  return (
    <li className="flex items-start gap-3 py-3">
      <div className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={`${BASE_URL}${primaryImage.thumbnail}`}
            alt={t("orderSummary.productImageAlt", { name: product.name })}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2">{product.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("orderSummary.qty", { count: item.quantity })}
        </p>
      </div>

      <span className="text-sm font-semibold flex-shrink-0">
        ${(item.price * item.quantity).toFixed(2)}
      </span>
    </li>
  );
}

export function OrderSummary() {
  const { t } = useTranslation("checkout");
  const { cart } = useCart();
  const items = cart?.items ?? [];
  const subtotal = cart?.totalPrice ?? 0;
  const total = subtotal + SHIPPING_COST;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("orderSummary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items list */}
        <ul aria-label={t("orderSummary.itemsLabel")} className="divide-y">
          {items.map((item) => (
            <OrderLineItem key={item.product.id} item={item} />
          ))}
        </ul>

        <Separator />

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("orderSummary.subtotal")}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("orderSummary.shipping")}</span>
            <span className="text-green-600 font-medium">
              {SHIPPING_COST === 0 ? t("orderSummary.freeShipping") : `$${SHIPPING_COST.toFixed(2)}`}
            </span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>{t("orderSummary.total")}</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
