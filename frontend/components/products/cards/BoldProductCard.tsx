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
      <Star className="h-3.5 w-3.5 fill-[#FF3C00] text-[#FF3C00]" aria-hidden="true" />
      <span className="text-xs text-[#8A8A8A] font-bold uppercase tracking-wider">
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

export const BoldProductCard = React.memo(function BoldProductCard({
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
      logger.error("BoldProductCard addToCart error:", err);
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
      <div className={cn("bg-white border-0 shadow-none hover:shadow-2xl transition-all duration-300 p-4", className)}>
        <div className="flex gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3C00]"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="relative h-24 w-24 overflow-hidden bg-[#F7F7F7]">
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
                  <ShoppingCart className="h-8 w-8 text-[#8A8A8A]" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3C00]"
            >
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#0F0F0F] leading-snug group-hover:text-[#FF3C00] transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <p className="text-xs text-[#8A8A8A] uppercase tracking-wider mt-0.5">{product.category.name}</p>
            )}
            <StarRating average={product.ratings.average} count={product.ratings.count} />
            {!isShowcase && (
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-base text-[#0F0F0F]">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-[#8A8A8A] line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
                <span className={cn(
                  "text-xs font-bold uppercase px-3 py-1",
                  inStock ? "bg-[#0F0F0F] text-white" : "bg-[#8A8A8A] text-white"
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
                className="inline-flex items-center px-4 py-2 bg-[#FF3C00] text-white font-bold uppercase tracking-wider text-xs hover:bg-[#E03500] transition-colors"
              >
                <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.viewDetails", { defaultValue: "View Details" })}
              </Link>
            ) : (
              <button
                type="button"
                disabled={!inStock || adding}
                onClick={handleAddToCart}
                aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
                className="inline-flex items-center px-4 py-2 bg-[#FF3C00] text-white font-bold uppercase tracking-wider text-xs hover:bg-[#E03500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </button>
            )}
            <WishlistButton productId={product.id} productName={product.name} size="sm" className="bg-white/90 hover:bg-white rounded-none" />
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
      "group relative flex flex-col overflow-hidden bg-white border-0 shadow-none hover:shadow-2xl rounded-none hover:-translate-y-1 transition-all duration-300",
      className,
    )}>
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3C00] focus-visible:ring-inset"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-square overflow-hidden bg-[#F7F7F7]">
          {primaryImage ? (
            <Image
              src={`${BASE_URL}${primaryImage.medium}`}
              alt={product.name}
              fill
              className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-[#8A8A8A]" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-[#FF3C00] text-white text-xs font-bold uppercase px-3 py-1">
                -{discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="bg-[#0F0F0F] text-white text-xs font-bold uppercase px-3 py-1">
                {t("status.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-4 left-4 z-10">
        <WishlistButton productId={product.id} productName={product.name} size="sm" className="bg-white/90 hover:bg-white rounded-none" />
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
        {/* Price */}
        {!isShowcase && (
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-base font-bold text-[#0F0F0F]">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[#8A8A8A] line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <Link
          href={`/products/${product.slug}`}
          className="group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF3C00] rounded"
        >
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F0F0F] leading-snug group-hover/title:text-[#FF3C00] transition-colors line-clamp-2 min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        {isShowcase ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 w-full py-3 text-center bg-[#FF3C00] text-white font-bold uppercase tracking-wider text-xs rounded-none hover:bg-[#E03500] transition-colors block"
          >
            <Eye className="h-4 w-4 mr-1 inline-block" aria-hidden="true" />
            {t("catalog.viewDetails", { defaultValue: "View Details" })}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!inStock || adding}
            onClick={handleAddToCart}
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
            className="mt-4 w-full py-3 bg-[#FF3C00] text-white font-bold uppercase tracking-wider text-xs rounded-none hover:bg-[#E03500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4 mr-1 inline-block" aria-hidden="true" />
            {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.view === next.view && prev.className === next.className);
