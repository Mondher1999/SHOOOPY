"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

// ─── Cart item row ─────────────────────────────────────────────────────────────

function CartItemCard({ item }: { item: CartItem }) {
  const { t } = useTranslation("cart");
  const { updateQuantity, removeItem } = useCart();
  const { toast } = useToast();
  const product = item.product;
  const primaryImage = product.images[0] ?? null;
  const atStockLimit = item.quantity >= product.stock;
  const lineTotal = item.price * item.quantity;

  const handleIncrease = async () => {
    try {
      await updateQuantity(product.id, item.quantity + 1);
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
      await updateQuantity(product.id, item.quantity - 1);
    } catch (err) {
      logger.error("cart page decrease qty error:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(product.id);
      toast({ description: t("removedFromCartDesc", { name: product.name }) });
    } catch (err) {
      logger.error("cart page remove error:", err);
      toast({ title: t("errorRemoving"), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
            aria-hidden="true"
            tabIndex={-1}
          >
            <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted">
              {primaryImage ? (
                <Image
                  src={`${BASE_URL}${primaryImage.medium}`}
                  alt={t("productImageAlt", { name: product.name })}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="font-medium text-sm leading-snug hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            >
              {product.name}
            </Link>

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
                className="h-8 w-8"
                onClick={handleDecrease}
                aria-label={t("decreaseQty")}
              >
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <span
                className="text-sm font-medium w-8 text-center tabular-nums"
                aria-label={t("quantity")}
                aria-live="polite"
              >
                {item.quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
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
            <span className="font-semibold text-sm">${lineTotal.toFixed(2)}</span>
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
  const { totalPrice, totalItems, clearCart } = useCart();
  const { toast } = useToast();

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
    <Card className="sticky top-24">
      <CardContent className="p-6 space-y-4">
        <h2 className="font-semibold text-lg">{t("orderSummary")}</h2>
        <Separator />

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {t(totalItems === 1 ? "itemCount" : "itemCount_plural", { count: totalItems })}
          </span>
          <span className="font-semibold">${totalPrice.toFixed(2)}</span>
        </div>

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>{t("subtotal")}</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>

        <p className="text-xs text-muted-foreground">{t("paymentNote")}</p>

        <Button className="w-full" size="lg" asChild>
          <Link href="/checkout">{t("checkout")}</Link>
        </Button>

        <Button
          variant="outline"
          className="w-full"
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
  const items = cart?.items ?? [];
  const isGuest = !user;
  const hasGuestItems = isGuest && guestItems.length > 0;

  if (isLoading) return <CartPageSkeleton />;

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Alert variant="destructive" className="max-w-sm mx-auto">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={reload}>
          {t("common:actions.retry", "Try again")}
        </Button>
      </div>
    );
  }

  if (hasGuestItems) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2">
          {t(guestItems.length === 1 ? "itemCount" : "itemCount_plural", { count: guestItems.length })}
        </h1>
        <p className="text-muted-foreground mb-6">{t("guestSignInHint")}</p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/auth/login">{t("guestSignIn")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">{t("continueShopping")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2">{t("empty")}</h1>
        <p className="text-muted-foreground mb-6">{t("emptyHint")}</p>
        <Button asChild>
          <Link href="/products">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <section className="lg:col-span-2 space-y-4" aria-label={t("itemsInCart")}>
          {items.map((item) => (
            <CartItemCard key={item.product.id} item={item} />
          ))}
        </section>

        {/* Summary */}
        <aside>
          <OrderSummary />
        </aside>
      </div>
    </div>
  );
}
