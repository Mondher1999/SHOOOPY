"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";

export default function WishlistPage() {
  const { t } = useTranslation("wishlist");
  const { wishlist, isLoading, clearAll, reload } = useWishlist();
  const { addItem: addToCart, openDrawer } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const theme = useActiveTheme();
  const [clearingAll, setClearingAll] = useState(false);
  const [addingAll, setAddingAll] = useState(false);

  const items = wishlist?.items ?? [];
  const validItems = items.filter(
    (item) => item.product && typeof item.product === "object"
  );

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await clearAll();
      toast({ description: t("clearedAll") });
    } catch (err) {
      logger.error("WishlistPage clearAll error:", err);
      toast({ title: t("errorClearAll"), variant: "destructive" });
    } finally {
      setClearingAll(false);
    }
  };

  const handleAddAllToCart = async () => {
    setAddingAll(true);
    const inStockItems = validItems.filter((item) => item.product.stock > 0);
    let added = 0;

    for (const item of inStockItems) {
      try {
        await addToCart(item.product.id, 1);
        added++;
      } catch (err) {
        logger.error("WishlistPage addAllToCart error:", err);
      }
    }

    if (added > 0) {
      toast({ description: t("addedAllToCart", { count: added }) });
      openDrawer();
    } else {
      toast({ title: t("noItemsToAdd"), variant: "destructive" });
    }
    setAddingAll(false);
  };

  // Not logged in
  if (!isLoading && !user) {
    return (
      <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <Heart
              className={cn("h-16 w-16 mb-6", theme.textMuted)}
              aria-hidden="true"
            />
            <h1
              className={cn("text-2xl sm:text-3xl mb-3", theme.text, theme.headingClass)}
            >
              {t("pageTitle")}
            </h1>
            <p
              className={cn("text-sm max-w-md mb-8", theme.textMuted)}
            >
              {t("loginRequired")}
            </p>
            <Link
              href="/auth/login"
              className={cn("inline-block px-6 py-2.5 text-sm", theme.btnPrimary)}
            >
              {t("signInToContinue")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", theme.pageBg, theme.bodyClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <h1
              className={cn("text-2xl sm:text-3xl", theme.text, theme.headingClass)}
            >
              {t("pageTitle")}
            </h1>
            {!isLoading && wishlist && (
              <p
                className={cn("text-sm mt-1", theme.textMuted)}
              >
                {t("itemCount", { count: validItems.length })}
              </p>
            )}
          </div>

          {/* Actions */}
          {!isLoading && validItems.length > 0 && (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={clearingAll}
                className={cn("text-xs uppercase tracking-[0.1em]", theme.btnOutline)}
              >
                {clearingAll ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                )}
                {t("clearAll")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddAllToCart}
                disabled={addingAll}
                className={cn("text-xs uppercase tracking-[0.1em]", theme.btnPrimary)}
              >
                {addingAll ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                )}
                {t("addAllToCart")}
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div
          className={cn("h-px w-full mb-8", theme.separator)}
        />

        {/* Loading state */}
        {isLoading && !wishlist && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <ThemedProductCardSkeleton key={i} view="grid" />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && !wishlist && user && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p
              className={cn("text-sm mb-4", theme.textMuted)}
            >
              {t("errorLoading")}
            </p>
            <button
              onClick={reload}
              className={cn("inline-block px-6 py-2.5 text-sm", theme.btnPrimary)}
            >
              {t("retry")}
            </button>
          </div>
        )}

        {/* Empty state */}
        {wishlist && validItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Heart
              className={cn("h-16 w-16 mb-6", theme.textMuted)}
              aria-hidden="true"
            />
            <h2
              className={cn("text-xl sm:text-2xl mb-2", theme.text, theme.headingClass)}
            >
              {t("emptyTitle")}
            </h2>
            <p
              className={cn("text-sm max-w-md mb-8", theme.textMuted)}
            >
              {t("emptyDescription")}
            </p>
            <Link
              href="/products"
              className={cn("inline-block px-6 py-2.5 text-sm", theme.btnPrimary)}
            >
              {t("startShopping")}
            </Link>
          </div>
        )}

        {/* Product grid */}
        {wishlist && validItems.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {validItems.map((item) => (
              <ThemedProductCard
                key={item.product.id}
                product={item.product}
                view="grid"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
