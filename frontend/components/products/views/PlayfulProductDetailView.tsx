"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { ImageGallery } from "@/components/products/ImageGallery";
import { ReviewSection } from "@/components/products/ReviewSection";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { WishlistButton } from "@/components/products/WishlistButton";
import { VariantSelector } from "@/components/products/VariantSelector";
import { SelectedOptionsSummary } from "@/components/products/SelectedOptionsSummary";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { cn } from "@/lib/utils";
import type { ProductDetailViewProps } from "@/types";

export default function PlayfulProductDetailView({
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

  const crumbs: BreadcrumbItem[] = [
    { label: t("catalog.breadcrumbProducts"), href: "/products" },
  ];
  if (product.category) {
    crumbs.push({
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    });
  }
  crumbs.push({ label: product.name });

  return (
    <div className="bg-[#F8F7FF] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={crumbs}
          className={cn(
            "mb-4 sm:mb-6 text-[#6B6798]",
            "[&_a]:text-[#6B6798] [&_a:hover]:text-[#7C3AED]",
            "[&_span]:text-[#2D2B55]",
            "[&_svg]:text-[#6B6798]",
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image gallery */}
          <div className="rounded-2xl overflow-hidden">
            <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />
          </div>

          {/* Product info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#7C3AED] text-sm hover:underline"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name */}
            <h1 className="font-bold text-[#2D2B55] text-xl sm:text-2xl lg:text-3xl">
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
                          ? "text-[#7C3AED] fill-[#7C3AED]"
                          : "text-purple-200",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-[#6B6798]"
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
                <span className="font-bold text-[#2D2B55] text-2xl sm:text-3xl">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-[#6B6798] line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <span className="bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white rounded-full px-3 py-0.5 text-xs font-semibold">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Stock status */}
            {!isShowcase && (
              <div className="flex items-center gap-2">
                <Package
                  className="h-4 w-4 text-[#6B6798]"
                  aria-hidden="true"
                />
                <Badge
                  className={cn(
                    "rounded-full",
                    inStock
                      ? "bg-green-100 text-green-700 hover:bg-green-100"
                      : "bg-red-100 text-red-600 hover:bg-red-100",
                  )}
                >
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </Badge>
              </div>
            )}

            {/* Separator */}
            <Separator className="border-purple-100" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-[#6B6798]">
                  {t("catalog.description")}
                </h2>
                <p className="text-sm text-[#2D2B55] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {Object.keys(product.attributes).length > 0 && (
              <div className="bg-[#F0EDFF] rounded-2xl p-4">
                <h2 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[#6B6798]">
                  {t("catalog.attributes")}
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <Fragment key={key}>
                      <dt className="text-[#6B6798]">{t(`typeAttrs.${key}`, { defaultValue: key })}</dt>
                      <dd className="text-[#2D2B55] font-semibold">
                        {Array.isArray(val)
                          ? val.map((v) => t(`typeAttrOptions.${v}`, { defaultValue: v })).join(", ")
                          : typeof val === "boolean"
                            ? val
                              ? t("catalog.booleanYes")
                              : t("catalog.booleanNo")
                            : t(`typeAttrOptions.${String(val)}`, { defaultValue: String(val) })}
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
            <Separator className="border-purple-100" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-3">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-semibold text-xs sm:text-sm rounded-full hover:opacity-90 transition-opacity"
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
                variant="outline"
                className="w-full h-12 sm:h-11 border-2 border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background font-semibold text-xs sm:text-sm rounded-full transition-all"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-[#6B6798]">
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
