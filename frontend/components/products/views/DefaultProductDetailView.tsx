"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Star,
  Truck,
  RotateCcw,
  Minus,
  Plus,
  Check,
  ChevronRight,
  MapPin,
  Store,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGallery } from "@/components/products/ImageGallery";
import { useVariantFilteredImages } from "@/hooks/useVariantFilteredImages";
import { ReviewSection } from "@/components/products/ReviewSection";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { WishlistButton } from "@/components/products/WishlistButton";
import { VariantSelector } from "@/components/products/VariantSelector";
import { SelectedOptionsSummary } from "@/components/products/SelectedOptionsSummary";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useSettings } from "@/contexts/SettingsContext";
import type { ProductDetailViewProps } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ─── Vertical Thumbnail Strip (Amazon-style) ─────────── */
function ThumbnailStrip({
  images,
  activeIdx,
  onSelect,
  productName,
  t,
}: {
  images: { thumbnail?: string; original: string }[];
  activeIdx: number;
  onSelect: (idx: number) => void;
  productName: string;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5 w-14 flex-shrink-0">
      {images.map((img, idx) => (
        <button
          key={idx}
          type="button"
          className={cn(
            "relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all duration-150 hover:border-primary/60",
            idx === activeIdx ? "border-primary ring-1 ring-primary/30" : "border-border"
          )}
          onMouseEnter={() => onSelect(idx)}
          onClick={() => onSelect(idx)}
          aria-label={t("catalog.imageAlt", { name: productName, idx: idx + 1 })}
        >
          <Image
            src={`${BASE_URL}${img.thumbnail || img.original}`}
            alt=""
            fill
            className="object-cover"
            sizes="56px"
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Buy Box (right column — Amazon-style: price, delivery, stock, qty, buttons, info) ── */
function BuyBox({
  product,
  formatPrice,
  t,
  theme,
  quantity,
  setQuantity,
  adding,
  onAddToCart,
  onBuyNow,
  ctaRef,
}: {
  product: ProductDetailViewProps["product"];
  formatPrice: (amount: number) => string;
  t: (k: string, opts?: Record<string, unknown>) => string;
  theme: ReturnType<typeof useActiveTheme>;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  adding: boolean;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  ctaRef: React.Ref<HTMLDivElement>;
}) {
  const { settings } = useSettings();
  const orderSettings = settings?.orders;
  const shippingCost = orderSettings?.defaultShippingCost ?? 0;
  const freeThreshold = orderSettings?.freeShippingThreshold ?? 0;
  const isFreeShipping = freeThreshold > 0 && product.price >= freeThreshold;
  const inStock = product.stock > 0;

  return (
    <div
      ref={ctaRef}
      className={cn("rounded-lg border p-4 space-y-3", theme.border)}
    >
      {/* Price */}
      <div>
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="flex items-center gap-2 mb-0.5">
            <Badge className="bg-orange-500 text-white hover:bg-orange-500 text-xs font-bold px-2 py-0.5 rounded-sm">
              -{Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </Badge>
            <span className={cn("text-sm line-through", theme.textMuted)}>
              <span className="sr-only">{t("catalog.originalPrice")}: </span>
              {formatPrice(product.compareAtPrice)}
            </span>
          </div>
        )}
        <span className={cn("text-2xl font-bold", theme.text)}>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="sr-only">{t("catalog.currentPrice")}: </span>
          )}
          {typeof product.tva === "number" && product.tva > 0
            ? formatPrice(+(product.price * (1 + product.tva / 100)).toFixed(2))
            : formatPrice(product.price)}
        </span>
        {typeof product.tva === "number" && product.tva > 0 && (
          <p className={cn("text-xs mt-0.5", theme.textMuted)}>
            {t("catalog.tvaIncluded", {
              rate: product.tva,
              amount: formatPrice(+(product.price * product.tva / 100).toFixed(2)),
            })}
          </p>
        )}
      </div>

      {/* Shipping */}
      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span className={theme.textMuted}>
            {isFreeShipping || shippingCost === 0
              ? t("catalog.freeShipping")
              : `${formatPrice(shippingCost)} ${t("catalog.shippingCharges")}`}
          </span>
        </div>
      </div>

      {/* Delivery estimate */}
      <div className="flex items-start gap-1.5 text-xs">
        <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span className={theme.textMuted}>
          {t("catalog.deliverTo")}
        </span>
      </div>

      <Separator />

      {/* Stock status */}
      <div>
        {inStock ? (
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {t("status.inStock")}
          </span>
        ) : (
          <span className="text-lg font-semibold text-destructive">
            {t("status.outOfStock")}
          </span>
        )}
      </div>

      {/* Quantity */}
      {inStock && (
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", theme.textMuted)}>
            {t("catalog.quantity")}:
          </span>
          <div className="flex items-center border rounded-md overflow-hidden">
            <button
              className={cn(
                "h-8 w-8 flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40",
                theme.text
              )}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={t("catalog.quantityDecrease")}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span
              className={cn(
                "h-8 w-10 flex items-center justify-center text-sm font-medium border-x tabular-nums",
                theme.text
              )}
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              className={cn(
                "h-8 w-8 flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40",
                theme.text
              )}
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              disabled={quantity >= product.stock}
              aria-label={t("catalog.quantityIncrease")}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Add to Cart button */}
      <Button
        size="lg"
        disabled={!inStock || adding}
        className={cn(
          "w-full h-11 text-sm font-semibold rounded-full",
          "bg-orange-500 hover:bg-orange-600 text-white border border-orange-500",
          "shadow-md active:scale-[0.97]",
          "disabled:bg-muted disabled:border-muted"
        )}
        onClick={onAddToCart}
        aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
      >
        {adding ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            {t("catalog.addingToCart")}
          </div>
        ) : inStock ? (
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {t("catalog.addToCart")}
          </div>
        ) : (
          t("status.outOfStock")
        )}
      </Button>

      {/* Buy Now button */}
      {inStock && onBuyNow && (
        <Button
          size="lg"
          className={cn(
            "w-full h-11 text-sm font-semibold rounded-full",
            "bg-[#1c1c1c] hover:bg-[#333] text-white border border-[#1c1c1c]",
            "active:scale-[0.97]"
          )}
          onClick={onBuyNow}
        >
          {t("buyNow.button")}
        </Button>
      )}

      <Separator />

      {/* Seller / Returns / Payment info (Amazon-style) */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className={theme.textMuted}>{t("catalog.soldBy")}</span>
          </div>
          <span className={cn("font-medium text-primary", theme.text)}>
            {settings?.store?.name || "ShopFlow"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className={theme.textMuted}>{t("catalog.returns")}</span>
          </div>
          <span className={cn("font-medium text-primary", theme.text)}>
            {t("catalog.trustReturns")}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <span className={theme.textMuted}>{t("catalog.payment")}</span>
          </div>
          <span className={cn("font-medium text-primary", theme.text)}>
            {t("catalog.trustSecure")}
          </span>
        </div>
      </div>

      <Separator />

      {/* Wishlist (Add to List) */}
      <WishlistButton
        productId={product.id}
        productName={product.name}
        className="w-full h-9 rounded-full border text-sm font-medium"
      />
    </div>
  );
}

/* ─── Sticky Mobile Bar ───────────────────────────────── */
function StickyMobileBar({
  price,
  inStock,
  adding,
  onAddToCart,
  visible,
  t,
  theme,
}: {
  price: string;
  inStock: boolean;
  adding: boolean;
  onAddToCart: () => void;
  visible: boolean;
  t: (k: string) => string;
  theme: ReturnType<typeof useActiveTheme>;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md px-4 py-3 transition-transform duration-300 lg:hidden",
        "safe-area-inset-bottom",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <div className="flex-shrink-0">
          <span className={cn("text-lg font-bold", theme.text)}>{price}</span>
        </div>
        <Button
          size="lg"
          disabled={!inStock || adding}
          className={cn(
            "flex-1 h-12 font-semibold rounded-full",
            "bg-orange-500 hover:bg-orange-600 text-white border border-orange-500",
            "shadow-lg active:scale-[0.97]"
          )}
          onClick={onAddToCart}
        >
          <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
          {inStock ? t("catalog.addToCart") : t("status.outOfStock")}
        </Button>
      </div>
    </div>
  );
}

/* ─── Stagger Animations ──────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════════ */
/*  DefaultProductDetailView — Amazon-Style 3-Column Layout   */
/* ═══════════════════════════════════════════════════════════ */
export default function DefaultProductDetailView({
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
  const theme = useActiveTheme();
  const formatPrice = useFormatPrice();
  const displayImages = useVariantFilteredImages(product.images, selectedOptions);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const mobileCtaRef = useRef<HTMLDivElement>(null);
  const desktopCtaRef = useRef<HTMLDivElement>(null);

  const inStock = product.stock > 0;

  const imagesToShow = displayImages.length > 0 ? displayImages : product.images;

  /* Reset active image when variant changes */
  useEffect(() => {
    setActiveImageIdx(0);
  }, [displayImages.length]);

  /* Sticky bar: show when CTA button scrolls out of view */
  useEffect(() => {
    const target = mobileCtaRef.current || desktopCtaRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const handleAddToCart = () => onAddToCart(quantity);

  return (
    <div className={cn("min-h-screen", theme.pageBg, theme.bodyClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">

        {/* ── Breadcrumbs ── */}
        <nav aria-label={t("catalog.breadcrumbLabel")} className="mb-4">
          <ol className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
            <li>
              <Link href="/products" className="hover:text-primary hover:underline transition-colors">
                {t("catalog.breadcrumbProducts")}
              </Link>
            </li>
            {product.category && (
              <>
                <li><ChevronRight className="h-3 w-3" aria-hidden="true" /></li>
                <li>
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className="hover:text-primary hover:underline transition-colors"
                  >
                    {product.category.name}
                  </Link>
                </li>
              </>
            )}
            <li><ChevronRight className="h-3 w-3" aria-hidden="true" /></li>
            <li className="text-foreground font-medium truncate max-w-[200px]">{product.name}</li>
          </ol>
        </nav>

        {/* ══════════════════════════════════════════════ */}
        {/* ── 3-Column Grid: [Image] [Info] [BuyBox]    */}
        {/* ══════════════════════════════════════════════ */}
        <div className="lg:grid lg:grid-cols-[minmax(0,560px)_1fr_280px] lg:gap-6 xl:gap-8">

          {/* ── COL 1: Image Section (thumbnails + main image) — sticky on desktop ── */}
          <div>
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <div className="flex gap-3">
                  <ThumbnailStrip
                    images={imagesToShow}
                    activeIdx={activeImageIdx}
                    onSelect={setActiveImageIdx}
                    productName={product.name}
                    t={t}
                  />
                  <div className="flex-1">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border">
                      {imagesToShow[activeImageIdx] && (
                        <Image
                          src={`${BASE_URL}${imagesToShow[activeImageIdx].large || imagesToShow[activeImageIdx].original}`}
                          alt={t("catalog.imageAlt", { name: product.name, idx: activeImageIdx + 1 })}
                          fill
                          className="object-contain"
                          sizes="560px"
                          priority={activeImageIdx === 0}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: swipeable gallery */}
            <div className="lg:hidden">
              <ImageGallery
                images={product.images}
                productName={product.name}
                selectedOptions={selectedOptions}
              />
            </div>
          </div>

          {/* ── COL 2: Product Info (title, rating, price, variants, specs) ── */}
          <div className="mt-4 lg:mt-0">
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* Product Name */}
              <motion.h1
                variants={staggerItem}
                className={cn(
                  "text-lg font-bold leading-snug sm:text-xl lg:text-2xl",
                  theme.text,
                  theme.headingClass
                )}
              >
                {product.name}
              </motion.h1>

              {/* Rating + Reviews Link */}
              {product.ratings.count > 0 && (
                <motion.div variants={staggerItem}>
                  <a
                    href="#reviews-section"
                    className="inline-flex items-center gap-1.5 group"
                    aria-label={t("catalog.ratingAriaLabel", {
                      average: product.ratings.average,
                      count: product.ratings.count,
                    })}
                  >
                    <span className={cn("text-sm font-medium", theme.accent)}>
                      {product.ratings.average.toFixed(1)}
                    </span>
                    <div className="flex items-center gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3.5 w-3.5",
                            s <= Math.round(product.ratings.average)
                              ? "text-amber-400 fill-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn("text-xs group-hover:underline", theme.accent)}>
                      ({product.ratings.count} {t("catalog.reviews")})
                    </span>
                  </a>
                </motion.div>
              )}

              <Separator className={theme.separator} />

              {/* Variant Selectors (Amazon: in center column) */}
              {!isShowcase && product.productType && (
                <motion.div variants={staggerItem}>
                  <VariantSelector
                    product={product}
                    typeCatalog={typeCatalog}
                    selectedOptions={selectedOptions}
                    onOptionChange={onOptionChange}
                  />
                </motion.div>
              )}

              {/* Selected Options Summary */}
              {!isShowcase && selectedOptions && Object.keys(selectedOptions).some((k) => {
                const v = selectedOptions[k];
                return typeof v === "string" ? v.length > 0 : Array.isArray(v) && v.length > 0;
              }) && (
                <motion.div variants={staggerItem}>
                  <SelectedOptionsSummary selectedOptions={selectedOptions} />
                </motion.div>
              )}

              {/* ── Mobile-only CTA (Add to Cart / Buy Now) ── */}
              {!isShowcase && (
                <div className="lg:hidden space-y-3" ref={mobileCtaRef}>
                  <Separator className={theme.separator} />

                  {/* Stock */}
                  <div>
                    {inStock ? (
                      <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {t("status.inStock")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-destructive">
                        {t("status.outOfStock")}
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  {inStock && (
                    <div className="flex items-center gap-2">
                      <span className={cn("text-sm", theme.textMuted)}>
                        {t("catalog.quantity")}:
                      </span>
                      <div className="flex items-center border rounded-md overflow-hidden">
                        <button
                          className={cn(
                            "h-8 w-8 flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40",
                            theme.text
                          )}
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          disabled={quantity <= 1}
                          aria-label={t("catalog.quantityDecrease")}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span
                          className={cn(
                            "h-8 w-10 flex items-center justify-center text-sm font-medium border-x tabular-nums",
                            theme.text
                          )}
                          aria-live="polite"
                        >
                          {quantity}
                        </span>
                        <button
                          className={cn(
                            "h-8 w-8 flex items-center justify-center transition-colors hover:bg-muted disabled:opacity-40",
                            theme.text
                          )}
                          onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                          disabled={quantity >= product.stock}
                          aria-label={t("catalog.quantityIncrease")}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart + Wishlist */}
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      disabled={!inStock || adding}
                      className={cn(
                        "flex-1 h-12 text-sm font-semibold rounded-full",
                        "bg-orange-500 hover:bg-orange-600 text-white border border-orange-500",
                        "shadow-md active:scale-[0.97]",
                        "disabled:bg-muted disabled:border-muted"
                      )}
                      onClick={handleAddToCart}
                      aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
                    >
                      {adding ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
                          {t("catalog.addingToCart")}
                        </div>
                      ) : inStock ? (
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                          {t("catalog.addToCart")}
                        </div>
                      ) : (
                        t("status.outOfStock")
                      )}
                    </Button>
                    <WishlistButton
                      productId={product.id}
                      productName={product.name}
                      className="h-12 w-12 rounded-full border-2 border-muted hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 flex-shrink-0"
                    />
                  </div>

                  {/* Buy Now */}
                  {inStock && onBuyNow && (
                    <Button
                      size="lg"
                      className={cn(
                        "w-full h-11 text-sm font-semibold rounded-full",
                        "bg-[#1c1c1c] hover:bg-[#333] text-white border border-[#1c1c1c]",
                        "active:scale-[0.97]"
                      )}
                      onClick={onBuyNow}
                    >
                      {t("buyNow.button")}
                    </Button>
                  )}
                </div>
              )}

              <Separator className={theme.separator} />

              {/* Description */}
              {product.description && (
                <motion.div variants={staggerItem}>
                  <h2 className={cn("text-base font-bold mb-2", theme.text)}>
                    {t("catalog.description")}
                  </h2>
                  <p className={cn("text-sm leading-relaxed whitespace-pre-line", theme.textMuted)}>
                    {product.description}
                  </p>
                </motion.div>
              )}

              {/* Specifications (Amazon: "Product details" / "Top highlights") */}
              {Object.keys(product.attributes).length > 0 && (
                <motion.div variants={staggerItem}>
                  <h2 className={cn("text-base font-bold mb-2", theme.text)}>
                    {t("catalog.specifications")}
                  </h2>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    {Object.entries(product.attributes).map(([key, val]) => (
                      <div key={key} className="contents">
                        <dt className={cn("font-medium", theme.textMuted)}>
                          {t(`typeAttrs.${key}`, { defaultValue: key })}
                        </dt>
                        <dd className={theme.text}>
                          {Array.isArray(val)
                            ? val.map((v) => t(`typeAttrOptions.${v}`, { defaultValue: v })).join(", ")
                            : typeof val === "boolean"
                            ? (val ? t("catalog.booleanYes") : t("catalog.booleanNo"))
                            : t(`typeAttrOptions.${String(val)}`, { defaultValue: String(val) })}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </motion.div>
              )}

              {/* SKU */}
              {product.sku && (
                <motion.p variants={staggerItem} className={cn("text-xs", theme.textMuted)}>
                  {t("catalog.sku")}: {product.sku}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* ── COL 3: Buy Box (desktop only — sticky) ── */}
          {!isShowcase && (
            <div className="hidden lg:block">
              <div className="sticky top-20">
                <BuyBox
                  product={product}
                  formatPrice={formatPrice}
                  t={t}
                  theme={theme}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  adding={adding}
                  onAddToCart={handleAddToCart}
                  onBuyNow={onBuyNow}
                  ctaRef={desktopCtaRef}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Tabbed Content (Reviews) ── */}
        <div className="mt-8 lg:mt-12">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0 overflow-x-auto scrollbar-none">
              <TabsTrigger
                value="reviews"
                className={cn(
                  "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap",
                  theme.text
                )}
              >
                {t("catalog.reviews")} ({product.ratings.count})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews" className="pt-6" id="reviews-section">
              <ReviewSection
                productId={product.id}
                averageRating={product.ratings.average}
                reviewCount={product.ratings.count}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Related Products ── */}
        <RelatedProducts
          categoryId={product.category?.id ?? null}
          excludeProductId={product.id}
        />
      </div>

      {/* ── Sticky Mobile Bar ── */}
      {!isShowcase && (
        <StickyMobileBar
          price={formatPrice(product.price)}
          inStock={inStock}
          adding={adding}
          onAddToCart={handleAddToCart}
          visible={showStickyBar}
          t={t}
          theme={theme}
        />
      )}
    </div>
  );
}
