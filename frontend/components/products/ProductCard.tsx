"use client";

import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

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

export function ProductCard({ product, view = "grid", className }: ProductCardProps) {
  const { t } = useTranslation("products");

  const inStock = product.stock > 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const primaryImage = product.images[0] || null;

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
              <div className="h-24 w-24 rounded-md overflow-hidden bg-muted">
                {primaryImage ? (
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
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
                <span className="font-semibold text-sm">${product.price.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${product.compareAtPrice!.toFixed(2)}
                  </span>
                )}
                <Badge variant={inStock ? "default" : "secondary"} className="text-xs py-0">
                  {inStock ? t("status.inStock") : t("status.outOfStock")}
                </Badge>
              </div>
            </div>

            <div className="flex-shrink-0">
              <Button
                size="sm"
                variant={inStock ? "default" : "secondary"}
                disabled={!inStock}
                aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
              >
                <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("group hover:shadow-md transition-shadow overflow-hidden", className)}>
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
      </Link>

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
          <span className="font-semibold">${product.price.toFixed(2)}</span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ${product.compareAtPrice!.toFixed(2)}
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
            disabled={!inStock}
            className="h-8 text-xs px-2"
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            {t("catalog.addToCart")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
