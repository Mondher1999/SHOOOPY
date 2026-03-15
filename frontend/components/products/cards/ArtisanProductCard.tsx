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
      <Star className="h-3.5 w-3.5 fill-[#C67B4A] text-[#C67B4A]" aria-hidden="true" />
      <span className="text-xs text-[#9C8B7E]">
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

export const ArtisanProductCard = React.memo(function ArtisanProductCard({
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
      logger.error("ArtisanProductCard addToCart error:", err);
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

  /* ─── List view ────────────────────────────────────────────────────────── */
  if (view === "list") {
    return (
      <div
        className={cn(
          "bg-[#FFF8F0] border border-[#E8DDD0] rounded-xl hover:shadow-lg transition-all duration-300 p-4",
          className
        )}
      >
        <div className="flex gap-4">
          <Link
            href={`/products/${product.slug}`}
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67B4A] rounded-lg"
            tabIndex={-1}
            aria-hidden="true"
          >
            <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-white">
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
                  <ShoppingCart className="h-8 w-8 text-[#9C8B7E]" aria-hidden="true" />
                </div>
              )}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${product.slug}`}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67B4A] rounded"
            >
              <h3 className="font-serif text-sm font-medium leading-snug text-[#3D2B1F] group-hover:text-[#C67B4A] transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            {product.category && (
              <p className="text-xs text-[#9C8B7E] mt-0.5">{product.category.name}</p>
            )}
            <StarRating average={product.ratings.average} count={product.ratings.count} />
            {!isShowcase && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#3D2B1F] font-medium text-sm">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-[#9C8B7E] line-through">
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
                className="inline-flex items-center px-4 py-2 bg-[#C67B4A] text-white text-xs tracking-wider rounded-full hover:bg-[#B06A3A] transition-colors"
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
                className="inline-flex items-center px-4 py-2 bg-[#C67B4A] text-white text-xs tracking-wider rounded-full hover:bg-[#B06A3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4 mr-1" aria-hidden="true" />
                {t("catalog.addToCart")}
              </button>
            )}
            <WishlistButton
              productId={product.id}
              productName={product.name}
              size="sm"
              className="bg-white/90 hover:bg-white rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Grid view (default) ──────────────────────────────────────────────── */
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden bg-[#FFF8F0] border border-[#E8DDD0] rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67B4A] focus-visible:ring-inset"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-square overflow-hidden bg-white rounded-lg m-2">
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
              <ShoppingCart className="h-12 w-12 text-[#E8DDD0]" aria-hidden="true" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="bg-[#C67B4A] text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-full">
                -{discountPercent}%
              </span>
            )}
            {!inStock && (
              <span className="bg-[#2C1810] text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-full">
                {t("status.outOfStock")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button */}
      <div className="absolute top-5 left-5 z-10">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          size="sm"
          className="bg-white/90 hover:bg-white rounded-full"
        />
      </div>

      <div className="flex flex-col flex-1 px-5 pt-3 pb-5">
        {/* Price */}
        {!isShowcase && (
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-[#3D2B1F] font-medium text-base">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[#9C8B7E] line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <Link
          href={`/products/${product.slug}`}
          className="group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C67B4A] rounded"
        >
          <h3 className="text-sm font-serif text-[#3D2B1F] line-clamp-2 min-h-[2.75rem] leading-snug group-hover/title:text-[#C67B4A] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action button */}
        {isShowcase ? (
          <Link
            href={`/products/${product.slug}`}
            className="mt-4 w-full flex items-center justify-center py-3 bg-[#C67B4A] text-white text-xs tracking-wider rounded-full hover:bg-[#B06A3A] transition-colors"
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
            className="mt-4 w-full py-3 bg-[#C67B4A] text-white text-xs tracking-wider rounded-full hover:bg-[#B06A3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {inStock ? (
              <>
                <ShoppingCart className="h-4 w-4 mr-1.5 inline-block" aria-hidden="true" />
                {t("catalog.addToCart")}
              </>
            ) : (
              t("status.outOfStock")
            )}
          </button>
        )}
      </div>
    </div>
  );
},
(prev, next) =>
  prev.product.id === next.product.id &&
  prev.view === next.view &&
  prev.className === next.className
);
