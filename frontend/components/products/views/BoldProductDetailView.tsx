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
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { cn } from "@/lib/utils";
import type { ProductDetailViewProps } from "@/types";

export default function BoldProductDetailView({
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
    <div className="bg-[#0F0F0F] min-h-screen">
      {/* Breadcrumbs — dark bar */}
      <div className="bg-[#1A1A1A] py-3 px-4 sm:px-6 mb-4 sm:mb-6">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb
            items={crumbs}
            className="text-gray-500 [&_a]:text-gray-500 [&_a:hover]:text-gray-300 [&_span]:text-gray-400 [&_svg]:text-gray-600"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Image gallery */}
          <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />

          {/* Product info */}
          <div className="space-y-4 sm:space-y-5">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="text-[#FF3C00] hover:underline uppercase text-xs tracking-widest"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name */}
            <h1 className="uppercase font-extrabold text-white text-xl sm:text-2xl lg:text-3xl tracking-wider">
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
                          ? "text-[#FF3C00] fill-[#FF3C00]"
                          : "text-gray-600",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-gray-400"
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
                <span className="text-white text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <Badge className="bg-[#FF3C00] text-white font-bold hover:bg-[#FF3C00]">
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
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-400">
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Separator */}
            <div className="h-0.5 bg-gray-800" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="text-gray-500 uppercase tracking-widest text-xs font-semibold mb-2">
                  {t("catalog.description")}
                </h2>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes */}
            {Object.keys(product.attributes).length > 0 && (
              <div>
                <h2 className="text-gray-500 uppercase tracking-widest text-xs font-semibold mb-2">
                  {t("catalog.attributes")}
                </h2>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <Fragment key={key}>
                      <dt className="text-gray-500">{key}</dt>
                      <dd className="font-medium text-white">
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

            {/* Separator */}
            <div className="h-0.5 bg-gray-800" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-2">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 bg-[#FF3C00] hover:bg-[#E63500] text-white font-bold uppercase text-xs sm:text-sm tracking-wider rounded-none"
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
                className="w-full h-12 sm:h-11 border-2 border-[#FF3C00] text-[#FF3C00] bg-transparent hover:bg-[#FF3C00] hover:text-white font-bold uppercase text-xs sm:text-sm tracking-wider rounded-none transition-colors"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-gray-600">
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
