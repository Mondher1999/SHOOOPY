"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { calcTTC } from "@/lib/tva";
import { cn } from "@/lib/utils";
import { isColorAttr, getColorValue } from "@/lib/colorMap";
import logger from "@/lib/logger";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/** Composite key for cart items: productId + sorted selectedOptions */
function cartItemKey(item: CartItem): string {
  const opts = item.selectedOptions;
  if (!opts || Object.keys(opts).length === 0) return item.product.id;
  const sorted = Object.keys(opts).sort().reduce<Record<string, string>>((acc, k) => {
    acc[k] = opts[k];
    return acc;
  }, {});
  return `${item.product.id}::${JSON.stringify(sorted)}`;
}

/** Format selected options as readable text: "Color: Blue / Size: M" */
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

function CartItemRow({ item }: { item: CartItem }) {
  const { t } = useTranslation("cart");
  const { t: tProducts } = useTranslation("products");
  const { updateQuantity, removeItem, closeDrawer } = useCart();
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const product = item.product;
  const primaryImage = product.images[0] ?? null;
  // Global stock is a best-effort UI hint; backend enforces variant-level stock on checkout
  const atStockLimit = item.quantity >= product.stock;
  const opts = item.selectedOptions;

  const handleIncrease = async () => {
    try {
      await updateQuantity(product.id, item.quantity + 1, opts);
    } catch (err) {
      logger.error("CartDrawer increase qty error:", err);
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
      logger.error("CartDrawer decrease qty error:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(product.id, opts);
      toast({ description: t("removedFromCartDesc", { name: product.name }) });
    } catch (err) {
      logger.error("CartDrawer remove error:", err);
      toast({ title: t("errorRemoving"), variant: "destructive" });
    }
  };

  return (
    <li className="flex gap-3 py-3">
      {/* Thumbnail */}
      <Link
        href={`/products/${product.slug}`}
        onClick={closeDrawer}
        className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        aria-hidden="true"
        tabIndex={-1}
      >
        <div className={cn("relative h-16 w-16 rounded-md overflow-hidden", theme.surface)}>
          {primaryImage ? (
            <Image
              src={`${BASE_URL}${primaryImage.thumbnail}`}
              alt={t("productImageAlt", { name: product.name })}
              fill
              className="object-cover"
              sizes="64px"

            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className={cn("h-6 w-6", theme.textMuted)} aria-hidden="true" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.slug}`}
          onClick={closeDrawer}
          className={cn(
            "text-sm font-medium line-clamp-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded",
            theme.text, theme.accentHover
          )}
        >
          {product.name}
        </Link>
        <OptionsText options={opts} t={tProducts} />
        <p className={cn("text-sm font-semibold mt-0.5", theme.text)}>{formatPrice(calcTTC(item.price, item.tva ?? 0) * item.quantity)}</p>
        {product.stock <= 5 && (
          <Badge variant="secondary" className="text-xs mt-0.5">
            {t("stockWarning", { count: product.stock })}
          </Badge>
        )}

        {/* Quantity Controls */}
        <div className="flex items-center gap-1.5 mt-2">
          <Button
            variant="outline"
            size="icon"
            className={cn("h-7 w-7 min-h-[44px] min-w-[44px]", theme.border)}
            onClick={handleDecrease}
            aria-label={t("decreaseQty")}
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <span className={cn("text-sm w-6 text-center tabular-nums", theme.text)} aria-live="polite" aria-label={t("quantity")}>{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className={cn("h-7 w-7 min-h-[44px] min-w-[44px]", theme.border)}
            onClick={handleIncrease}
            disabled={atStockLimit}
            aria-label={t("increaseQty")}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 min-h-[44px] min-w-[44px] ml-1 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            aria-label={t("removeAriaLabel", { name: product.name })}
          >
            <Trash2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer() {
  const { t } = useTranslation("cart");
  const { user } = useAuth();
  const { cart, guestItems, isLoading, isDrawerOpen, closeDrawer, totalItems, totalPrice } = useCart();
  const formatPrice = useFormatPrice();
  const theme = useActiveTheme();
  const items = cart?.items ?? [];
  const isGuest = !user;
  const hasGuestItems = isGuest && guestItems.length > 0;

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent side="right" aria-label={t("drawerTitle")}>
        <SheetHeader>
          <SheetTitle>{t("drawerTitle")}</SheetTitle>
          <SheetDescription>
            {totalItems > 0
              ? t(totalItems === 1 ? "itemCount" : "itemCount_plural", { count: totalItems })
              : t("empty")}
          </SheetDescription>
        </SheetHeader>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-16 w-16 flex-shrink-0 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasGuestItems ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <ShoppingBag className={cn("h-12 w-12", theme.textMuted)} aria-hidden="true" />
              <p className={cn("font-medium", theme.text)}>
                {t(guestItems.length === 1 ? "itemCount" : "itemCount_plural", { count: guestItems.length })}
              </p>
              <p className={cn("text-sm", theme.textMuted)}>{t("guestSignInHint")}</p>
              <Button className={theme.btnPrimary} asChild onClick={closeDrawer}>
                <Link href="/auth/login">{t("guestSignIn")}</Link>
              </Button>
              <Button variant="ghost" className={theme.btnOutline} asChild onClick={closeDrawer}>
                <Link href="/products">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <ShoppingBag className={cn("h-12 w-12", theme.textMuted)} aria-hidden="true" />
              <p className={theme.textMuted}>{t("empty")}</p>
              <Button variant="ghost" className={theme.btnOutline} asChild onClick={closeDrawer}>
                <Link href="/products">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : (
            <ul aria-label={t("itemsInCart")} className="divide-y">
              {items.map((item) => (
                <CartItemRow key={cartItemKey(item)} item={item} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer: subtotal + CTA */}
        {items.length > 0 && (
          <SheetFooter>
            <div className={cn("flex justify-between text-sm font-semibold", theme.text)}>
              <span>{t("subtotal")}</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>
            <div className={cn("h-px w-full my-2", theme.separator)} />
            <Button className={cn("w-full", theme.btnPrimary)} asChild onClick={closeDrawer}>
              <Link href="/cart">{t("viewCart")}</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
