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

export default function ElegantProductDetailView({
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
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={crumbs}
          className={cn(
            "mb-4 sm:mb-8",
            "text-[#8B7355]",
            "[&_a]:text-[#8B7355] [&_a:hover]:text-[#C5A467]",
            "[&_span]:text-[#2C2C2C]",
            "[&_svg]:text-[#C5A467]/50",
          )}
        />

        {/* Two-column grid — wider image column */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 lg:gap-12">
          {/* Image gallery */}
          <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />

          {/* Product info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#C5A467] hover:underline text-sm"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name — serif */}
            <h1
              className="text-[#2C2C2C] font-medium text-xl sm:text-2xl lg:text-3xl"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
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
                          ? "text-[#C5A467] fill-[#C5A467]"
                          : "text-[#C5A467]/30",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-[#8B7355]"
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
                <span
                  className="text-[#2C2C2C] text-2xl sm:text-3xl font-medium"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-[#8B7355] line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <Badge className="bg-[#C5A467] text-white hover:bg-[#C5A467]">
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
                  className="h-4 w-4 text-[#8B7355]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[#8B7355]">
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Separator */}
            <Separator className="border-[#C5A467]/20" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-[#8B7355] uppercase tracking-wider text-xs font-semibold mb-2">
                  {t("catalog.description")}
                </h2>
                <p className="text-sm text-[#2C2C2C] leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {Object.keys(product.attributes).length > 0 && (
              <div>
                <h2 className="text-[#8B7355] uppercase tracking-wider text-xs font-semibold mb-2">
                  {t("catalog.attributes")}
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <Fragment key={key}>
                      <dt className="text-[#8B7355]">{key}</dt>
                      <dd className="font-medium text-[#2C2C2C]">
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
            <Separator className="border-[#C5A467]/20" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-2">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className={cn(
                    "flex-1 h-12 sm:h-11 border-2 border-[#C5A467] text-[#C5A467] bg-transparent",
                    "hover:bg-[#C5A467] hover:text-white",
                    "rounded-sm uppercase tracking-wider font-medium text-xs sm:text-sm",
                    "transition-colors duration-200",
                  )}
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
                className={cn(
                  "w-full h-12 sm:h-11 border-2 border-foreground text-foreground bg-transparent",
                  "hover:bg-foreground hover:text-background",
                  "rounded-sm uppercase tracking-wider font-medium text-xs sm:text-sm transition-colors duration-200"
                )}
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-[#8B7355]">
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
