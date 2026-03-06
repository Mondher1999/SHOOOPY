"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import logger from "@/lib/logger";
import type { CartItem } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function CartItemRow({ item }: { item: CartItem }) {
  const { t } = useTranslation("cart");
  const { updateQuantity, removeItem, closeDrawer } = useCart();
  const { toast } = useToast();
  const product = item.product;
  const primaryImage = product.images[0] ?? null;
  const atStockLimit = item.quantity >= product.stock;

  const handleIncrease = async () => {
    try {
      await updateQuantity(product.id, item.quantity + 1);
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
      await updateQuantity(product.id, item.quantity - 1);
    } catch (err) {
      logger.error("CartDrawer decrease qty error:", err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeItem(product.id);
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
        <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={`${BASE_URL}${primaryImage.thumbnail}`}
              alt={t("productImageAlt", { name: product.name })}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.slug}`}
          onClick={closeDrawer}
          className="text-sm font-medium line-clamp-2 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          {product.name}
        </Link>
        <p className="text-sm font-semibold mt-0.5">${(item.price * item.quantity).toFixed(2)}</p>
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
            className="h-6 w-6"
            onClick={handleDecrease}
            aria-label={t("decreaseQty")}
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <span className="text-sm w-6 text-center tabular-nums" aria-live="polite" aria-label={t("quantity")}>{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={handleIncrease}
            disabled={atStockLimit}
            aria-label={t("increaseQty")}
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-1 text-muted-foreground hover:text-destructive"
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium">
                {t(guestItems.length === 1 ? "itemCount" : "itemCount_plural", { count: guestItems.length })}
              </p>
              <p className="text-sm text-muted-foreground">{t("guestSignInHint")}</p>
              <Button asChild onClick={closeDrawer}>
                <Link href="/auth/login">{t("guestSignIn")}</Link>
              </Button>
              <Button variant="outline" asChild onClick={closeDrawer}>
                <Link href="/products">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <p className="text-muted-foreground">{t("empty")}</p>
              <Button variant="outline" asChild onClick={closeDrawer}>
                <Link href="/products">{t("continueShopping")}</Link>
              </Button>
            </div>
          ) : (
            <ul aria-label={t("itemsInCart")} className="divide-y">
              {items.map((item) => (
                <CartItemRow key={item.product.id} item={item} />
              ))}
            </ul>
          )}
        </div>

        {/* Footer: subtotal + CTA */}
        {items.length > 0 && (
          <SheetFooter>
            <div className="flex justify-between text-sm font-semibold">
              <span>{t("subtotal")}</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <Button className="w-full" asChild onClick={closeDrawer}>
              <Link href="/cart">{t("viewCart")}</Link>
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
