"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useCallback, memo } from "react";
import { ShoppingCart, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/products/WishlistButton";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { calcTTC } from "@/lib/tva";
import logger from "@/lib/logger";
import type { Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ProductCardProps {
  product: Product;
  view?: "grid" | "list";
  className?: string;
}

function StarRating({ average, count }: { average: number; count: number }) {
  const { t } = useTranslation("products");
  return (
    <div className="flex items-center gap-1" aria-label={t("catalog.ratingAriaLabel", { average, count })}>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-xs text-muted-foreground">
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

export function ProductCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-24 flex-shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <Skeleton className="aspect-square w-full rounded-t-lg" />
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full mt-2" />
      </CardContent>
    </Card>
  );
}

export const ProductCard = memo(function ProductCard({ product, view = "grid", className }: ProductCardProps) {
  const { t } = useTranslation("products");
  const { t: tCart } = useTranslation("cart");
  const { addItem, openDrawer } = useCart();
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const [adding, setAdding] = useState(false);

  const inStock = product.stock > 0;
  const displayPrice = calcTTC(product.price, product.tva ?? 0);
  const displayCompareAt = product.compareAtPrice ? calcTTC(product.compareAtPrice, product.tva ?? 0) : null;
  const hasDiscount = displayCompareAt && displayCompareAt > displayPrice;
  const primaryImage = product.images[0] ?? null;

  const handleAddToCart = useCallback(async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
    } catch (err) {
      logger.error("ProductCard addToCart error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: tCart("errorAdding"),
        description: msg ?? undefined,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  }, [addItem, product.id, product.name, openDrawer, toast, tCart]);

  if (view === "list") {
    return (
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Link
              href={`/products/${product.slug}`}
              className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
              tabIndex={-1}
              aria-hidden="true"
            >
              <div className="relative h-24 w-24 rounded-md overflow-hidden bg-muted">
                {primaryImage ? (
                  <Image
                    src={`${BASE_URL}${primaryImage.medium}`}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                )}
              </div>
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${product.slug}`}
                className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
              >
                <h3 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              {product.category && (
                <p className="text-xs text-muted-foreground mt-0.5">{product.category.name}</p>
              )}
              <StarRating average={product.ratings.average} count={product.ratings.count} />
              <div className="flex items-center gap-2 mt-1">
                <span className="font-semibold text-sm">{formatPrice(displayPrice)}</span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(displayCompareAt!)}
                  </span>
                )}
                <Badge variant={inStock ? "default" : "secondary"} className="text-xs py-0">
                  {inStock ? t("status.inStock") : t("status.outOfStock")}
                </Badge>
              </div>
            </div>

            <div className="flex-shrink-0 flex items-center gap-1">
              <Button
                size="sm"
                variant={inStock ? "default" : "secondary"}
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
              >
                <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </Button>
              <WishlistButton productId={product.id} productName={product.name} size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("group relative hover:shadow-md transition-shadow overflow-hidden", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={`${BASE_URL}${primaryImage.medium}`}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
      </Link>
      <div className="absolute top-2 right-2 z-10">
        <WishlistButton productId={product.id} productName={product.name} size="sm" className="bg-background/80 backdrop-blur-sm hover:bg-background" />
      </div>

      <CardContent className="p-4">
        <Link
          href={`/products/${product.slug}`}
          className="group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <h3 className="font-medium text-sm leading-snug group-hover/title:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>
        {product.category && (
          <p className="text-xs text-muted-foreground mt-0.5">{product.category.name}</p>
        )}
        <StarRating average={product.ratings.average} count={product.ratings.count} />

        <div className="flex items-center gap-2 mt-1.5">
          <span className="font-semibold">{formatPrice(displayPrice)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(displayCompareAt!)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5 gap-2">
          <Badge variant={inStock ? "default" : "secondary"} className="text-xs">
            {inStock ? t("status.inStock") : t("status.outOfStock")}
          </Badge>
          <Button
            size="sm"
            variant={inStock ? "default" : "secondary"}
            disabled={!inStock || adding}
            className="h-8 text-xs px-2"
            onClick={handleAddToCart}
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            {t("catalog.addToCart")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
