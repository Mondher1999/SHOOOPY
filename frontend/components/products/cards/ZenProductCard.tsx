"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/products/WishlistButton";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useToast } from "@/hooks/use-toast";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import logger from "@/lib/logger";
import type { Product } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface ThemedCardProps {
  product: Product;
  view?: "grid" | "list";
  className?: string;
}

function StarRating({ average, count }: { average: number; count: number }) {
  const { t } = useTranslation("products");
  return (
    <div className="flex items-center gap-1" aria-label={t("catalog.ratingAriaLabel", { average, count })}>
      <Star className="h-3 w-3 fill-[#111]/20 text-[#111]/20" aria-hidden="true" />
      <span className="text-[10px] text-[#111]/40 font-light tracking-wider">
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

export const ZenProductCard = React.memo(function ZenProductCard({
  product,
  view = "grid",
  className,
}: ThemedCardProps) {
  const { t } = useTranslation("products");
  const { t: tCart } = useTranslation("cart");
  const { addItem, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const { toast } = useToast();
  const formatPrice = useFormatPrice();
  const [adding, setAdding] = useState(false);

  const inStock = product.stock > 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const primaryImage = product.images[0] ?? null;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addItem(product.id, 1);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
    } catch (err) {
      logger.error("ZenProductCard addToCart error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({
        title: tCart("errorAdding"),
        description: msg ?? undefined,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  /* ── List View ───────────────────────────────────────────────────────── */
  if (view === "list") {
    return (
      <div className={cn("bg-white border border-[#eee] rounded-none hover:border-[#ccc] transition-all duration-300 p-4", className)}>
        <div className="flex gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#111]/20"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="relative h-24 w-24 overflow-hidden bg-[#FAFAFA]">
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
                  <ShoppingCart className="h-8 w-8 text-[#ddd]" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="group focus:outline-none focus-visible:ring-1 focus-visible:ring-[#111]/20"
            >
              <h3 className="text-xs font-light tracking-wide text-[#111]/70 leading-snug group-hover:text-[#111] transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <p className="text-[10px] text-[#111]/30 tracking-wider font-light mt-0.5">{product.category.name}</p>
            )}
            <StarRating average={product.ratings.average} count={product.ratings.count} />
            {!isShowcase && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-light text-sm text-[#111]">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-[#ccc] font-light line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
                <span className={cn(
                  "text-[9px] font-light tracking-wider px-2 py-0.5",
                  inStock ? "bg-[#111] text-white" : "bg-[#999] text-white"
                )}>
                  {inStock ? t("status.inStock") : t("status.outOfStock")}
                </span>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-1">
            {isShowcase ? (
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center px-4 py-2 border border-[#ddd] text-[#111]/60 bg-transparent hover:border-[#111] hover:text-[#111] font-light text-[10px] uppercase tracking-[0.2em] rounded-none transition-colors"
              >
                <Eye className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                {t("catalog.viewDetails", { defaultValue: "View Details" })}
              </Link>
            ) : (
              <button
                type="button"
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
                className="inline-flex items-center px-4 py-2 border border-[#ddd] text-[#111]/60 bg-transparent hover:border-[#111] hover:text-[#111] font-light text-[10px] uppercase tracking-[0.2em] rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </button>
            )}
            <WishlistButton productId={product.id} productName={product.name} size="sm" className="bg-transparent hover:bg-[#f5f5f5] rounded-none" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Grid View ───────────────────────────────────────────────────────── */
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden bg-white border border-[#eee] rounded-none hover:border-[#ccc] transition-all duration-300",
      className,
    )}>
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-1 focus-visible:ring-[#111]/20 focus-visible:ring-inset"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-square overflow-hidden bg-[#FAFAFA]">
          {primaryImage ? (
            <Image
              src={`${BASE_URL}${primaryImage.medium}`}
              alt={product.name}
              fill
              className="object-contain p-8 group-hover:scale-[1.03] transition-transform duration-700"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-[#eee]" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-[#111] text-white text-[9px] font-light tracking-wider px-2 py-0.5">
                -{discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="bg-[#999] text-white text-[9px] font-light tracking-wider px-2 py-0.5">
                {t("status.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-4 left-4 z-10">
        <WishlistButton productId={product.id} productName={product.name} size="sm" className="bg-transparent hover:bg-[#f5f5f5] rounded-none" />
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
        {/* Price */}
        {!isShowcase && (
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-sm font-light text-[#111]">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[#ccc] font-light line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <Link
          href={`/products/${product.slug}`}
          className="group/title focus:outline-none focus-visible:ring-1 focus-visible:ring-[#111]/20 rounded"
        >
          <h3 className="text-xs font-light tracking-wide text-[#111]/70 leading-snug group-hover/title:text-[#111] transition-colors line-clamp-2 min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        {isShowcase ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 w-full py-2.5 text-center border border-[#ddd] text-[#111]/60 bg-transparent hover:border-[#111] hover:text-[#111] font-light text-[10px] uppercase tracking-[0.2em] rounded-none transition-colors block"
          >
            <Eye className="h-3.5 w-3.5 mr-1 inline-block" aria-hidden="true" />
            {t("catalog.viewDetails", { defaultValue: "View Details" })}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!inStock || adding}
            onClick={handleAddToCart}
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
            className="mt-4 w-full py-2.5 border border-[#ddd] text-[#111]/60 bg-transparent hover:border-[#111] hover:text-[#111] font-light text-[10px] uppercase tracking-[0.2em] rounded-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1 inline-block" aria-hidden="true" />
            {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.view === next.view && prev.className === next.className);
