"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { calcTTC, calcTotalTVA } from "@/lib/tva";
import { cn } from "@/lib/utils";
import { isColorAttr, getColorValue } from "@/lib/colorMap";
import logger from "@/lib/logger";
import { cartItemKey } from "@/lib/cartUtils";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CartPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="h-24 w-24 flex-shrink-0 rounded-md" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Options display ─────────────────────────────────────────────────────────

function OptionsText({ options, t }: { options?: Record<string, string>; t: (key: string, opts?: Record<string, unknown>) => string }) {
  if (!options || Object.keys(options).length === 0) return null;
  return (
    <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1">
      {Object.entries(options).map(([key, value], idx) => (
        <span key={key} className="inline-flex items-center gap-0.5">
          {idx > 0 && <span className="mx-0.5">/</span>}
          <span>{t(`products:typeAttrs.${key}`, { defaultValue: key })}:</span>
          {isColorAttr(key) && getColorValue(value) && (
            <span
              className="inline-block h-3 w-3 rounded-full border border-border flex-shrink-0"
              style={{ backgroundColor: getColorValue(value) }}
              aria-hidden="true"
            />
          )}
          <span className="font-medium">{value}</span>
        </span>
      ))}
    </p>
  );
}

// ─── Cart item row ─────────────────────────────────────────────────────────────

function CartItemCard({ item }: { item: CartItem }) {
  const { t } = useTranslation("cart");
  const { t: tProducts } = useTranslation("products");
  const { updateQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const product = item.product;
  const primaryImage = product.images[0] ?? null;
  // Global stock is a best-effort UI hint; backend enforces variant-level stock on checkout
  const atStockLimit = item.quantity >= product.stock;
  const lineTotal = calcTTC(item.price, item.tva ?? 0) * item.quantity;
  const opts = item.selectedOptions;

  const handleIncrease = async () => {
    try {
      await updateQuantity(product.id, item.quantity + 1, opts);
    } catch (err) {
      logger.error("cart page increase qty error:", err);
      toast({
        title: t("stockLimitReached"),
        description: t("stockLimitDesc", { count: product.stock }),
        variant: "destructive",
      });
    }
  };

  const handleDecrease = async () => {
    if (item.quantity <= 1) {
      await handleRemove();
      return;
    }
    try {
      await updateQuantity(product.id, item.quantity - 1, opts);
    } catch (err) {
      logger.error("cart page decrease qty error:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(product.id, opts);
      toast({ description: t("removedFromCartDesc", { name: product.name }) });
    } catch (err) {
      logger.error("cart page remove error:", err);
      toast({ title: t("errorRemoving"), variant: "destructive" });
    }
  };

  return (
    <Card className={cn(theme.border, "border")}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-hidden="true"
            tabIndex={-1}
          >
            <div className={cn("relative h-24 w-24 rounded-md overflow-hidden", theme.surface)}>
              {primaryImage ? (
                <Image
                  src={`${BASE_URL}${primaryImage.medium}`}
                  alt={t("productImageAlt", { name: product.name })}
                  fill
                  className="object-cover"
                  sizes="96px"

                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag className={cn("h-8 w-8", theme.textMuted)} aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className={cn(
                "font-medium text-sm leading-snug transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
                theme.text, theme.accentHover
              )}
            >
              {product.name}
            </Link>
            <OptionsText options={opts} t={tProducts} />

            {product.stock <= 5 && product.stock > 0 && (
              <Badge variant="secondary" className="text-xs mt-1 block w-fit">
                {t("stockWarning", { count: product.stock })}
              </Badge>
            )}

            {product.stock === 0 && (
              <Badge variant="destructive" className="text-xs mt-1 block w-fit">
                {t("outOfStock")}
              </Badge>
            )}

            {/* Quantity controls */}
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="icon"
                className={cn("h-8 w-8", theme.border)}
                onClick={handleDecrease}
                aria-label={t("decreaseQty")}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <span
                className={cn("text-sm font-medium w-8 text-center tabular-nums", theme.text)}
                aria-label={t("quantity")}
                aria-live="polite"
              >
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className={cn("h-8 w-8", theme.border)}
                onClick={handleIncrease}
                disabled={atStockLimit}
                aria-label={t("increaseQty")}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Price + remove */}
          <div className="flex flex-col items-end justify-between">
            <span className={cn("font-semibold text-sm", theme.text)}>{formatPrice(lineTotal)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              aria-label={t("removeAriaLabel", { name: product.name })}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Order Summary sidebar ─────────────────────────────────────────────────────

function OrderSummary() {
  const { t } = useTranslation("cart");
  const { cart, totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();

  const totalTVA = calcTotalTVA(
    (cart?.items ?? []).map((i) => ({ price: i.price, tva: i.tva ?? 0, quantity: i.quantity }))
  );
  const hasTVA = totalTVA > 0;

  const handleClear = async () => {
    try {
      await clearCart();
      toast({ description: t("cartCleared") });
    } catch (err) {
      logger.error("cart page clear error:", err);
      toast({ title: t("errorClearing"), variant: "destructive" });
    }
  };

  return (
    <Card className={cn("sticky top-24 border", theme.surface, theme.border)}>
      <CardContent className="p-6 space-y-4">
        <h2 className={cn("font-semibold text-lg", theme.text, theme.headingClass)}>{t("orderSummary")}</h2>
        <div className={cn("h-px w-full", theme.separator)} />

        <div className="flex justify-between text-sm">
          <span className={theme.textMuted}>
            {t(totalItems === 1 ? "itemCount" : "itemCount_plural", { count: totalItems })}
          </span>
          <span className={cn("font-semibold", theme.text)}>{formatPrice(totalPrice)}</span>
        </div>

        {hasTVA && (
          <div className="flex justify-between text-xs">
            <span className={theme.textMuted}>{t("tvaTotal")}</span>
            <span className={theme.textMuted}>{formatPrice(totalTVA)}</span>
          </div>
        )}

        <div className={cn("h-px w-full", theme.separator)} />

        <div className={cn("flex justify-between font-semibold", theme.text)}>
          <span>{t("subtotal")}</span>
          <span>{formatPrice(totalPrice)}</span>
        </div>

        <p className={cn("text-xs", theme.textMuted)}>{t("paymentNote")}</p>

        <Button className={cn("w-full", theme.btnPrimary)} size="lg" asChild>
          <Link href="/checkout">{t("checkout")}</Link>
        </Button>

        <Button
          variant="ghost"
          className={cn("w-full", theme.btnOutline)}
          onClick={handleClear}
        >
          {t("clearCart")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { t } = useTranslation("cart");
  const { user } = useAuth();
  const { cart, guestItems, isLoading, error, reload } = useCart();
  const theme = useActiveTheme();
  const items = cart?.items ?? [];
  const isGuest = !user;
  const hasGuestItems = isGuest && guestItems.length > 0;

  if (isLoading) return <CartPageSkeleton />;

  if (error) {
    return (
      <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <Alert variant="destructive" className="max-w-sm mx-auto">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{t(error)}</AlertDescription>
          </Alert>
          <Button variant="outline" className={cn("mt-4", theme.btnOutline)} onClick={reload}>
            {t("common:actions.retry", "Try again")}
          </Button>
        </div>
      </div>
    );
  }

  if (hasGuestItems) {
    return (
      <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <ShoppingBag className={cn("h-16 w-16 mx-auto mb-4", theme.textMuted)} aria-hidden="true" />
          <h1 className={cn("text-2xl font-bold mb-2", theme.text, theme.headingClass)}>
            {t(guestItems.length === 1 ? "itemCount" : "itemCount_plural", { count: guestItems.length })}
          </h1>
          <p className={cn("mb-6", theme.textMuted)}>{t("guestSignInHint")}</p>
          <div className="flex gap-3 justify-center">
            <Button className={theme.btnPrimary} asChild>
              <Link href="/auth/login">{t("guestSignIn")}</Link>
            </Button>
            <Button variant="ghost" className={theme.btnOutline} asChild>
              <Link href="/products">{t("continueShopping")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <ShoppingBag className={cn("h-16 w-16 mx-auto mb-4", theme.textMuted)} aria-hidden="true" />
          <h1 className={cn("text-2xl font-bold mb-2", theme.text, theme.headingClass)}>{t("empty")}</h1>
          <p className={cn("mb-6", theme.textMuted)}>{t("emptyHint")}</p>
          <Button className={theme.btnPrimary} asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className={cn("text-2xl font-bold mb-8", theme.text, theme.headingClass)}>{t("title")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <section className="lg:col-span-2 space-y-4" aria-label={t("itemsInCart")}>
            {items.map((item) => (
              <CartItemCard key={cartItemKey(item)} item={item} />
            ))}
          </section>

          {/* Summary */}
          <aside>
            <OrderSummary />
          </aside>
        </div>
      </div>
    </div>
  );
}
