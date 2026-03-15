"use client";

import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useSettings } from "@/contexts/SettingsContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function OrderLineItem({ item }: { item: CartItem }) {
  const { t } = useTranslation("checkout");
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const product = item.product;
  const primaryImage = product.images[0] ?? null;

  return (
    <li className="flex items-start gap-3 py-3">
      <div className={cn("relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden", theme.surface)}>
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
            <ShoppingBag className={cn("h-5 w-5", theme.textMuted)} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium line-clamp-2", theme.text)}>{product.name}</p>
        <p className={cn("text-xs mt-0.5", theme.textMuted)}>
          {t("orderSummary.qty", { count: item.quantity })}
        </p>
      </div>

      <span className={cn("text-sm font-semibold flex-shrink-0", theme.text)}>
        {formatPrice(item.price * item.quantity)}
      </span>
    </li>
  );
}

export function OrderSummary() {
  const { t } = useTranslation("checkout");
  const { cart } = useCart();
  const { settings } = useSettings();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const shippingCost = settings?.orders?.defaultShippingCost ?? 0;
  const items = cart?.items ?? [];
  const subtotal = cart?.totalPrice ?? 0;
  const total = subtotal + shippingCost;

  return (
    <Card className={cn("border", theme.surface, theme.border)}>
      <CardHeader>
        <CardTitle className={cn("text-base", theme.text, theme.headingClass)}>{t("orderSummary.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items list */}
        <ul aria-label={t("orderSummary.itemsLabel")} className="divide-y">
          {items.map((item) => (
            <OrderLineItem key={item.product.id} item={item} />
          ))}
        </ul>

        <div className={cn("h-px w-full", theme.separator)} />

        {/* Price breakdown */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={theme.textMuted}>{t("orderSummary.subtotal")}</span>
            <span className={theme.text}>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className={theme.textMuted}>{t("orderSummary.shipping")}</span>
            <span className="text-green-600 font-medium">
              {shippingCost === 0 ? t("orderSummary.freeShipping") : formatPrice(shippingCost)}
            </span>
          </div>
        </div>

        <div className={cn("h-px w-full", theme.separator)} />

        <div className={cn("flex justify-between font-semibold", theme.text)}>
          <span>{t("orderSummary.total")}</span>
          <span>{formatPrice(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
