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
      <Star className="h-3.5 w-3.5 fill-[#00FF88] text-[#00FF88]" aria-hidden="true" />
      <span className="text-xs font-mono text-[#888899]">
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

export const TechProductCard = React.memo(function TechProductCard({
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
      logger.error("TechProductCard addToCart error:", err);
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

  // ─── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div
        className={cn(
          "bg-[#12121A] border border-[#1E1E2A] rounded-lg hover:border-[#00FF88]/30 transition-all duration-300 p-4",
          className
        )}
      >
        <div className="flex gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] rounded-lg"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-[#0A0A0F]">
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
                  <ShoppingCart className="h-8 w-8 text-[#555566]" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] rounded"
            >
              <h3 className="text-sm font-mono text-[#E0E0E0] leading-snug group-hover:text-[#00FF88] transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <p className="text-xs font-mono text-[#555566] mt-0.5">{product.category.name}</p>
            )}
            <StarRating average={product.ratings.average} count={product.ratings.count} />
            {!isShowcase && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#00FF88] font-mono font-bold text-sm">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-[#555566] font-mono line-through">
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center gap-1">
            {isShowcase ? (
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center px-4 py-2 border border-[#00FF88]/50 text-[#00FF88] bg-transparent hover:bg-[#00FF88]/10 hover:border-[#00FF88] font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]"
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
                className="inline-flex items-center px-4 py-2 border border-[#00FF88]/50 text-[#00FF88] bg-transparent hover:bg-[#00FF88]/10 hover:border-[#00FF88] font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </button>
            )}
            <WishlistButton
              productId={product.id}
              productName={product.name}
              size="sm"
              className="bg-[#1E1E2A] hover:bg-[#2A2A3A] text-white/50 hover:text-[#00FF88] rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Grid view (default) ────────────────────────────────────────────────────
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden bg-[#12121A] border border-[#1E1E2A] rounded-lg hover:border-[#00FF88]/30 transition-all duration-300",
        className
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] focus-visible:ring-inset rounded-t-lg"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-square overflow-hidden bg-[#0A0A0F] rounded-t-lg">
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
              <ShoppingCart className="h-12 w-12 text-[#555566]/30" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-[#00FF88] text-[#0A0A0F] text-xs font-mono font-bold px-2.5 py-1">
                -{discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="bg-[#555566] text-white text-xs font-mono px-2.5 py-1">
                {t("status.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-4 left-4 z-10">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          size="sm"
          className="bg-[#1E1E2A] hover:bg-[#2A2A3A] text-white/50 hover:text-[#00FF88] rounded-lg"
        />
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
        {/* Price */}
        {!isShowcase && (
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[#00FF88] font-mono font-bold text-base">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[#555566] font-mono line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <Link
          href={`/products/${product.slug}`}
          className="group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00FF88] rounded"
        >
          <h3 className="text-sm font-mono text-[#E0E0E0] leading-snug group-hover/title:text-[#00FF88] transition-colors line-clamp-2 min-h-[2.75rem]">
            {product.name}
          </h3>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        {isShowcase ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 w-full inline-flex items-center justify-center py-3 border border-[#00FF88]/50 text-[#00FF88] bg-transparent hover:bg-[#00FF88]/10 hover:border-[#00FF88] font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]"
          >
            <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {t("catalog.viewDetails", { defaultValue: "View Details" })}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!inStock || adding}
            onClick={handleAddToCart}
            aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
            className="mt-4 w-full py-3 border border-[#00FF88]/50 text-[#00FF88] bg-transparent hover:bg-[#00FF88]/10 hover:border-[#00FF88] font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(0,255,136,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4 inline-block mr-1.5" aria-hidden="true" />
            {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
          </button>
        )}
      </div>
    </div>
  );
}, (prev, next) => prev.product.id === next.product.id && prev.view === next.view && prev.className === next.className);
