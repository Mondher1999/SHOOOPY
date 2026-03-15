"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/products/ImageGallery";
import { ReviewSection } from "@/components/products/ReviewSection";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { WishlistButton } from "@/components/products/WishlistButton";
import { VariantSelector } from "@/components/products/VariantSelector";
import { SelectedOptionsSummary } from "@/components/products/SelectedOptionsSummary";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { cn } from "@/lib/utils";
import type { ProductDetailViewProps } from "@/types";

export default function TechProductDetailView({
  product,
  isShowcase,
  adding,
  onAddToCart,
  onBuyNow,
  typeCatalog,
  selectedOptions,
  onOptionChange,
}: ProductDetailViewProps) {
  const { t } = useTranslation("products");
  const formatPrice = useFormatPrice();

  const inStock = product.stock > 0;
  const hasDiscount =
    product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice! - product.price) /
          product.compareAtPrice!) *
          100,
      )
    : 0;

  return (
    <div className="bg-[#0A0A0F] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumbs — mono with > separators */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 sm:mb-8 font-mono text-xs text-gray-500 overflow-x-auto whitespace-nowrap"
        >
          <span>
            <Link
              href="/"
              className="hover:text-[#00FF88] transition-colors"
            >
              {t("common:nav.home", "HOME")}
            </Link>
          </span>
          <span className="mx-2">&gt;</span>
          <span>
            <Link
              href="/products"
              className="hover:text-[#00FF88] transition-colors"
            >
              {t("catalog.breadcrumbProducts")}
            </Link>
          </span>
          {product.category && (
            <>
              <span className="mx-2">&gt;</span>
              <span>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-[#00FF88] transition-colors"
                >
                  {product.category.name}
                </Link>
              </span>
            </>
          )}
          <span className="mx-2">&gt;</span>
          <span className="text-gray-400" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image gallery — bordered container */}
          <div className="border border-[#00FF88]/10 p-1">
            <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />
          </div>

          {/* Product info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#00FF88] font-mono text-xs uppercase hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name with neon glow */}
            <h1
              className="font-mono uppercase text-white font-bold text-lg sm:text-xl lg:text-2xl tracking-widest"
              style={{ textShadow: "0 0 20px rgba(0,255,136,0.2)" }}
            >
              {product.name}
            </h1>

            {/* Star ratings */}
            {product.ratings.count > 0 && (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-0.5"
                  aria-hidden="true"
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-4 w-4",
                        s <= Math.round(product.ratings.average)
                          ? "text-[#00FF88] fill-[#00FF88]"
                          : "text-gray-700",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-gray-500 font-mono"
                  aria-label={t("catalog.ratingAriaLabel", {
                    average: product.ratings.average,
                    count: product.ratings.count,
                  })}
                >
                  {product.ratings.average.toFixed(1)} (
                  {product.ratings.count} {t("catalog.reviews")})
                </span>
              </div>
            )}

            {/* Price + discount */}
            {!isShowcase && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[#00FF88] text-2xl sm:text-3xl font-bold">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-600 line-through font-mono">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <Badge className="bg-[#00FF88] text-[#0A0A0F] font-mono font-bold hover:bg-[#00FF88]">
                      -{discountPercent}%
                    </Badge>
                  </>
                )}
              </div>
            )}

            {/* Stock status */}
            {!isShowcase && (
              <div className="flex items-center gap-2">
                <Package
                  className="h-4 w-4 text-gray-600"
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "font-mono text-xs",
                    inStock ? "text-[#00FF88]" : "text-red-500",
                  )}
                >
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Separator */}
            <Separator className="border-[#00FF88]/10" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-gray-500 font-mono uppercase tracking-widest text-xs mb-2">
                  {t("catalog.description")}
                </h2>
                <p className="text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {Object.keys(product.attributes).length > 0 && (
              <div className="bg-[#12121A] border border-[#00FF88]/10 p-4">
                <h2 className="text-gray-500 font-mono uppercase tracking-widest text-xs mb-3">
                  {t("catalog.attributes")}
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-mono">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <Fragment key={key}>
                      <dt className="text-gray-500">{key}</dt>
                      <dd className="text-[#00FF88]">
                        {Array.isArray(val)
                          ? val.join(", ")
                          : typeof val === "boolean"
                            ? val
                              ? t("catalog.booleanYes")
                              : t("catalog.booleanNo")
                            : String(val)}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              </div>
            )}

            {/* Variant Selector */}
            {!isShowcase && product.productType && (
              <VariantSelector
                product={product}
                typeCatalog={typeCatalog}
                selectedOptions={selectedOptions}
                onOptionChange={onOptionChange}
              />
            )}

            {/* Selected Options Summary */}
            {!isShowcase && selectedOptions && Object.keys(selectedOptions).some((k) => {
              const v = selectedOptions[k];
              return typeof v === "string" ? v.length > 0 : Array.isArray(v) && v.length > 0;
            }) && (
              <SelectedOptionsSummary selectedOptions={selectedOptions} />
            )}

            {/* Separator */}
            <Separator className="border-[#00FF88]/10" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-3">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 border-2 border-[#00FF88] text-[#00FF88] bg-transparent hover:bg-[#00FF88] hover:text-[#0A0A0F] font-mono uppercase text-xs sm:text-sm tracking-widest rounded-none transition-colors"
                  variant="ghost"
                  aria-label={t("catalog.addToCartAriaLabel", {
                    name: product.name,
                  })}
                  onClick={() => onAddToCart()}
                >
                  <ShoppingCart
                    className="h-5 w-5 mr-2"
                    aria-hidden="true"
                  />
                  {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
                </Button>
              )}
              <WishlistButton
                productId={product.id}
                productName={product.name}
              />
            </div>

            {/* Buy Now */}
            {!isShowcase && inStock && onBuyNow && (
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 sm:h-11 border-2 border-[#00FF88] text-[#00FF88] bg-transparent hover:bg-[#00FF88] hover:text-[#0A0A0F] font-mono uppercase text-xs sm:text-sm tracking-widest rounded-none transition-colors"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-gray-600 font-mono">
                {t("catalog.sku")}: {product.sku}
              </p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ReviewSection
          productId={product.id}
          averageRating={product.ratings.average}
          reviewCount={product.ratings.count}
        />

        {/* Related Products */}
        <RelatedProducts
          categoryId={product.category?.id ?? null}
          excludeProductId={product.id}
        />
      </div>
    </div>
  );
}
