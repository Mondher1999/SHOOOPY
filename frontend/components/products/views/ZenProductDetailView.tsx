"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, Package, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/products/ImageGallery";
import { ReviewSection } from "@/components/products/ReviewSection";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { WishlistButton } from "@/components/products/WishlistButton";
import { VariantSelector } from "@/components/products/VariantSelector";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { cn } from "@/lib/utils";
import type { ProductDetailViewProps } from "@/types";

export default function ZenProductDetailView({
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
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Breadcrumbs — manual with / separators */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 sm:mb-10 font-light text-sm text-gray-400"
        >
          <span>
            <Link href="/" className="hover:text-[#111] transition-colors">
              {t("common:nav.home", "Home")}
            </Link>
          </span>
          <span className="mx-2">/</span>
          <span>
            <Link
              href="/products"
              className="hover:text-[#111] transition-colors"
            >
              {t("catalog.breadcrumbProducts")}
            </Link>
          </span>
          {product.category && (
            <>
              <span className="mx-2">/</span>
              <span>
                <Link
                  href={`/categories/${product.category.slug}`}
                  className="hover:text-[#111] transition-colors"
                >
                  {product.category.name}
                </Link>
              </span>
            </>
          )}
          <span className="mx-2">/</span>
          <span className="text-gray-500" aria-current="page">
            {product.name}
          </span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image gallery */}
          <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />

          {/* Product info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-gray-400 text-sm font-light hover:text-[#111] transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name */}
            <h1 className="font-light text-[#111] text-xl sm:text-2xl lg:text-3xl tracking-wide">
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
                          ? "text-[#111] fill-[#111]"
                          : "text-gray-200",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-gray-400 font-light"
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
              <div className="flex items-baseline gap-3">
                <span className="font-light text-[#111] text-2xl sm:text-3xl">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-300 line-through font-light">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <span className="text-gray-500 text-xs">
                      (-{discountPercent}%)
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Stock status */}
            {!isShowcase && (
              <div className="flex items-center gap-2">
                <Package
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <span className="text-gray-400 text-sm font-light">
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Separator */}
            <Separator className="border-gray-100" />

            {/* Description */}
            {product.description && (
              <div>
                <p className="font-light text-[#111] leading-relaxed whitespace-pre-line text-sm">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes — collapsible */}
            {Object.keys(product.attributes).length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setDetailsOpen(!detailsOpen)}
                  className="flex items-center gap-2 text-sm font-light text-gray-400 hover:text-[#111] transition-colors"
                >
                  {t("catalog.attributes", "Details")}
                  {detailsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {detailsOpen && (
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {Object.entries(product.attributes).map(([key, val]) => (
                      <Fragment key={key}>
                        <dt className="text-gray-500 font-light">{key}</dt>
                        <dd className="text-[#111]">
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
                )}
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

            {/* Separator */}
            <Separator className="border-gray-100" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-3">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 border border-[#111] text-[#111] bg-transparent hover:bg-[#111] hover:text-white rounded-none font-light tracking-widest uppercase text-xs sm:text-sm transition-colors"
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
                className="w-full h-12 sm:h-11 border border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background rounded-none font-light tracking-widest uppercase text-xs sm:text-sm transition-colors"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-gray-400 font-light">
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
