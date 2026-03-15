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
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { cn } from "@/lib/utils";
import type { ProductDetailViewProps } from "@/types";

export default function MagazineProductDetailView({
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

  /* Manual breadcrumb segments for editorial style */
  const breadcrumbSegments: { label: string; href?: string }[] = [
    { label: t("catalog.breadcrumbProducts"), href: "/products" },
  ];
  if (product.category) {
    breadcrumbSegments.push({
      label: product.category.name,
      href: `/categories/${product.category.slug}`,
    });
  }
  breadcrumbSegments.push({ label: product.name });

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-10">
        {/* Breadcrumbs — editorial: uppercase, pipe separators */}
        <nav aria-label="Breadcrumb" className="mb-6 sm:mb-10">
          <ol className="flex flex-wrap items-center gap-2 uppercase text-xs tracking-widest text-gray-500">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                {t("catalog.breadcrumbHome", { defaultValue: "Home" })}
              </Link>
            </li>
            {breadcrumbSegments.map((seg, idx) => {
              const isLast = idx === breadcrumbSegments.length - 1;
              return (
                <Fragment key={idx}>
                  <li aria-hidden="true" className="text-gray-300 select-none">|</li>
                  <li>
                    {isLast || !seg.href ? (
                      <span
                        className={cn(isLast ? "text-black font-medium" : "text-gray-500")}
                        aria-current={isLast ? "page" : undefined}
                      >
                        {seg.label}
                      </span>
                    ) : (
                      <Link href={seg.href} className="hover:text-black transition-colors">
                        {seg.label}
                      </Link>
                    )}
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
          {/* Image gallery */}
          <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />

          {/* Product info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Category link */}
            {product.category && (
              <Link
                href={`/categories/${product.category.slug}`}
                className="uppercase text-xs tracking-widest text-gray-500 hover:text-black transition-colors"
              >
                {product.category.name}
              </Link>
            )}

            {/* Product name — editorial black, heavy weight */}
            <h1 className="font-black text-black text-2xl sm:text-3xl lg:text-4xl uppercase tracking-tight leading-none">
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
                          ? "text-[#E63946] fill-[#E63946]"
                          : "text-gray-200",
                      )}
                    />
                  ))}
                </div>
                <span
                  className="text-sm text-gray-500"
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
                <span className="font-black text-black text-2xl sm:text-3xl lg:text-4xl">
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(product.compareAtPrice!)}
                    </span>
                    <Badge className="bg-[#E63946] text-white font-bold uppercase text-xs hover:bg-[#E63946]">
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
                  className="h-4 w-4 text-gray-500"
                  aria-hidden="true"
                />
                <span className="uppercase text-xs tracking-wider text-gray-500">
                  {inStock
                    ? t("catalog.inStockCount", { count: product.stock })
                    : t("status.outOfStock")}
                </span>
              </div>
            )}

            {/* Double-rule separator */}
            <div className="border-b-[3px] border-black" />

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="uppercase text-xs tracking-[0.3em] text-gray-500 font-bold border-b border-black/10 pb-1 mb-3">
                  {t("catalog.description")}
                </h2>
                <p className="text-gray-800 leading-relaxed text-base whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Attributes — clean editorial grid */}
            {Object.keys(product.attributes).length > 0 && (
              <div>
                <h2 className="uppercase text-xs tracking-[0.3em] text-gray-500 font-bold border-b border-black/10 pb-1 mb-3">
                  {t("catalog.attributes")}
                </h2>
                <dl className="divide-y divide-gray-100">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-2">
                      <dt className="uppercase text-xs tracking-wider text-gray-500">
                        {key}
                      </dt>
                      <dd className="text-black font-medium text-sm">
                        {Array.isArray(val)
                          ? val.join(", ")
                          : typeof val === "boolean"
                            ? val
                              ? t("catalog.booleanYes")
                              : t("catalog.booleanNo")
                            : String(val)}
                      </dd>
                    </div>
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

            {/* Bold separator */}
            <div className="border-b-2 border-black" />

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-2">
              {!isShowcase && (
                <Button
                  size="lg"
                  disabled={!inStock || adding}
                  className="flex-1 h-12 sm:h-11 bg-black text-white hover:bg-gray-900 font-bold uppercase tracking-widest text-xs sm:text-sm rounded-none"
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
                className="w-full h-12 sm:h-11 border-2 border-foreground text-foreground bg-transparent hover:bg-foreground hover:text-background font-bold uppercase tracking-widest text-xs sm:text-sm rounded-none transition-colors"
                onClick={onBuyNow}
              >
                <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
                {t("buyNow.button")}
              </Button>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-gray-400 uppercase text-xs tracking-wider">
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
