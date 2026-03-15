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

export default function ArtisanProductDetailView({
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
    <div className="bg-[#FFF8F0] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={crumbs}
          className={cn(
            "mb-4 sm:mb-8",
            "text-[#8B6F47]",
            "[&_a]:text-[#8B6F47] [&_a:hover]:text-[#C67B4A]",
            "[&_span]:text-[#3D2E1F]",
            "[&_svg]:text-[#C67B4A]/40",
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image gallery */}
          <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />

          {/* Product info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#C67B4A] hover:underline text-sm"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name — serif font, warm tone */}
            <h1
              className="text-[#3D2E1F] font-medium text-xl sm:text-2xl lg:text-3xl"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
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
                          ? "text-[#C67B4A] fill-[#C67B4A]"
                          : "text-[#C67B4A]/30",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-[#8B6F47]"
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
                  className="text-[#3D2E1F] text-2xl sm:text-3xl font-medium"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-[#8B6F47] line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <Badge className="bg-[#C67B4A] text-white rounded-full hover:bg-[#C67B4A]">
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
                  className="h-4 w-4 text-[#8B6F47]"
                  aria-hidden="true"
                />
                <span className="text-sm text-[#8B6F47]">
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Dotted separator — handcrafted feel */}
            <Separator className="border-dotted border-[#C67B4A]/20" style={{ borderStyle: "dotted" }} />

            {/* Description */}
            {product.description && (
              <div>
                <h2
                  className="text-[#8B6F47] text-sm font-medium mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {t("catalog.description")}
                </h2>
                <p className="text-[#3D2E1F] leading-relaxed text-sm whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes — warm panel */}
            {Object.keys(product.attributes).length > 0 && (
              <div className="bg-[#FFF0E0] rounded-xl p-4">
                <h2
                  className="text-[#8B6F47] text-sm font-medium mb-3"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {t("catalog.attributes")}
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <Fragment key={key}>
                      <dt className="text-[#8B6F47]">{key}</dt>
                      <dd className="text-[#3D2E1F] font-medium">
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

            {/* Dotted separator */}
            <Separator className="border-dotted border-[#C67B4A]/20" style={{ borderStyle: "dotted" }} />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-2">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 bg-[#C67B4A] hover:bg-[#B06A3A] text-white rounded-full font-medium tracking-wide text-xs sm:text-sm"
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
                className="w-full h-12 sm:h-11 border-2 border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background rounded-full font-medium tracking-wide text-xs sm:text-sm transition-colors"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-[#8B6F47]">
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
