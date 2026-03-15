"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { motion, useInView } from "framer-motion";
import {
  ShoppingCart,
  Star,
  Truck,
  RotateCcw,
  ShieldCheck,
  Minus,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageGallery } from "@/components/products/ImageGallery";
import { ReviewSection } from "@/components/products/ReviewSection";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { WishlistButton } from "@/components/products/WishlistButton";
import { VariantSelector } from "@/components/products/VariantSelector";
import { SelectedOptionsSummary } from "@/components/products/SelectedOptionsSummary";
import { cn } from "@/lib/utils";
import { useActiveTheme } from "@/hooks/useActiveTheme";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import type { ProductDetailViewProps } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ─── Scroll Reveal Image ─────────────────────────────────── */
function ScrollRevealImage({
  src,
  alt,
  index,
}: {
  src: string;
  alt: string;
  index: number;
}) {
  const isFirst = index === 0;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={isFirst ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 80, scale: 0.92 }}
      animate={
        isFirst || isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 80, scale: 0.92 }
      }
      transition={{
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="relative w-full"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted shadow-lg">
        <Image
          src={`${BASE_URL}${src}`}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 640px"
          priority={isFirst}
        />
      </div>
    </motion.div>
  );
}

/* ─── Trust Signals ───────────────────────────────────────── */
function TrustSignals({ t, theme }: { t: (k: string) => string; theme: ReturnType<typeof useActiveTheme> }) {
  const signals = [
    { icon: Truck, label: t("catalog.trustFreeShipping") },
    { icon: RotateCcw, label: t("catalog.trustReturns") },
    { icon: ShieldCheck, label: t("catalog.trustSecure") },
  ];

  return (
    <div className={cn("flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-1.5")}>
      {signals.map(({ icon: Icon, label }, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2.5 sm:px-2 sm:py-2 text-sm sm:text-xs",
            theme.border
          )}
        >
          <Icon className={cn("h-4 w-4 sm:h-3.5 sm:w-3.5 flex-shrink-0", theme.accent)} aria-hidden="true" />
          <span className={cn("font-medium leading-tight", theme.text)}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Quantity Selector ───────────────────────────────────── */
function QuantitySelector({
  quantity,
  max,
  onChange,
  t,
  theme,
}: {
  quantity: number;
  max: number;
  onChange: (q: number) => void;
  t: (k: string) => string;
  theme: ReturnType<typeof useActiveTheme>;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("text-sm font-medium", theme.textMuted)}>
        {t("catalog.quantity")}
      </span>
      <div className="flex items-center border rounded-xl overflow-hidden">
        <button
          className={cn(
            "h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center transition-colors hover:bg-muted active:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
            theme.text
          )}
          onClick={() => onChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          aria-label={t("catalog.quantityDecrease")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className={cn(
            "h-12 w-14 sm:h-11 sm:w-12 flex items-center justify-center text-sm font-semibold border-x tabular-nums",
            theme.text
          )}
          aria-live="polite"
          aria-label={t("catalog.quantityValue")}
        >
          {quantity}
        </span>
        <button
          className={cn(
            "h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center transition-colors hover:bg-muted active:bg-muted disabled:opacity-40 disabled:cursor-not-allowed",
            theme.text
          )}
          onClick={() => onChange(Math.min(max, quantity + 1))}
          disabled={quantity >= max}
          aria-label={t("catalog.quantityIncrease")}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Sticky Mobile Bar ───────────────────────────────────── */
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
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-md px-4 py-3 transition-transform duration-300 md:hidden",
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
            "flex-1 h-12 font-semibold rounded-xl",
            "bg-gradient-to-r from-primary to-primary/90",
            "shadow-lg shadow-primary/25",
            "active:scale-[0.97]",
            theme.btnPrimary
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

/* ─── Stagger Container ───────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

/* ═══════════════════════════════════════════════════════════ */
/*  DefaultProductDetailView — Conversion-Optimized Layout    */
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
  const [quantity, setQuantity] = useState(1);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const inStock = product.stock > 0;
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;

  /* Sticky bar: show when CTA button scrolls out of view */
  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  /* Breadcrumbs */
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

  const handleAddToCart = () => onAddToCart(quantity);

  return (
    <div className={cn("min-h-screen", theme.pageBg, theme.bodyClass)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* ── Breadcrumbs ── */}
        <Breadcrumb items={crumbs} className={cn("mb-6", theme.border)} />

        {/* ── Hero: Images + Info ── */}
        <div className="md:flex md:gap-10 lg:gap-12 md:items-start">
          {/* Left column */}
          <div className="md:w-1/2 flex-shrink-0">
            {/* Mobile: swipeable gallery */}
            <div className="md:hidden">
              <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />
            </div>
            {/* Desktop: vertical scroll-reveal images */}
            <div className="hidden md:block space-y-6">
              {product.images.length > 0 ? (
                product.images.map((img, idx) => (
                  <ScrollRevealImage
                    key={idx}
                    src={img.large || img.original}
                    alt={t("catalog.imageAlt", { name: product.name, idx: idx + 1 })}
                    index={idx}
                  />
                ))
              ) : (
                <ImageGallery images={product.images} productName={product.name} selectedOptions={selectedOptions} />
              )}
            </div>
          </div>

          {/* Right: Product Info — sticky on desktop */}
          <div className="md:w-1/2 mt-5 md:mt-0" style={{ position: "sticky", top: "5rem", alignSelf: "flex-start" }}>
            <motion.div
              className="space-y-3"
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              {/* Category pill */}
              {product.category && (
                <motion.div variants={staggerItem}>
                  <Link
                    href={`/categories/${product.category.slug}`}
                    className={cn(
                      "inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full border transition-colors",
                      "hover:bg-primary/5",
                      theme.accent,
                      theme.border
                    )}
                  >
                    {product.category.name}
                  </Link>
                </motion.div>
              )}

              {/* Product Name */}
              <motion.h1
                variants={staggerItem}
                className={cn(
                  "text-xl font-extrabold leading-[1.15] tracking-tight sm:text-2xl md:text-3xl",
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
                    className="inline-flex items-center gap-2 group"
                    aria-label={t("catalog.ratingAriaLabel", {
                      average: product.ratings.average,
                      count: product.ratings.count,
                    })}
                  >
                    <div className="flex items-center gap-0.5" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= Math.round(product.ratings.average)
                              ? cn(theme.starColor, "fill-current")
                              : theme.textMuted
                          )}
                        />
                      ))}
                    </div>
                    <span className={cn("text-sm font-semibold", theme.text)}>
                      {product.ratings.average.toFixed(1)}
                    </span>
                    <span className={cn("text-sm group-hover:underline", theme.textMuted)}>
                      ({product.ratings.count} {t("catalog.reviews")})
                    </span>
                  </a>
                </motion.div>
              )}

              {/* Price */}
              {!isShowcase && (
                <motion.div variants={staggerItem} className="flex items-center gap-3 flex-wrap">
                  <span className={cn(
                    "text-2xl font-black tracking-tight sm:text-3xl",
                    hasDiscount ? "text-red-600 dark:text-red-400" : theme.text
                  )}>
                    {formatPrice(product.price)}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className={cn("text-lg line-through opacity-50", theme.textMuted)}>
                        {formatPrice(product.compareAtPrice!)}
                      </span>
                      <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold px-2.5 py-1 rounded-full">
                        -{discountPercent}%
                      </Badge>
                    </>
                  )}
                </motion.div>
              )}

              {/* Trust Signals */}
              {!isShowcase && (
                <motion.div variants={staggerItem}>
                  <TrustSignals t={t} theme={theme} />
                </motion.div>
              )}

              {/* Variant Selectors */}
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

              <Separator className={theme.separator} />

              {/* Quantity + CTA */}
              {!isShowcase && (
                <motion.div variants={staggerItem} className="space-y-3" ref={ctaRef}>
                  {/* Quantity */}
                  {inStock && (
                    <QuantitySelector
                      quantity={quantity}
                      max={product.stock}
                      onChange={setQuantity}
                      t={t}
                      theme={theme}
                    />
                  )}

                {/* Add to Cart */}
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    disabled={!inStock || adding}
                    className={cn(
                      "flex-1 h-14 sm:h-12 text-base sm:text-sm font-semibold rounded-xl transition-all duration-200",
                      "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85",
                      "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                      "active:scale-[0.97] active:shadow-md",
                      "disabled:from-muted disabled:to-muted disabled:shadow-none",
                      theme.btnPrimary
                    )}
                    aria-label={t("catalog.addToCartAriaLabel", { name: product.name })}
                    onClick={handleAddToCart}
                  >
                    {adding ? (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("catalog.addingToCart")}
                      </div>
                    ) : inStock ? (
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                        {t("catalog.addToCart")}
                      </div>
                    ) : (
                      t("status.outOfStock")
                    )}
                  </Button>
                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                    className="h-14 w-14 sm:h-12 sm:w-12 rounded-xl border-2 border-muted hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 flex-shrink-0"
                  />
                </div>

                {/* Buy Now */}
                {inStock && onBuyNow && (
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "w-full h-12 sm:h-11 text-sm font-bold uppercase tracking-wide rounded-xl transition-all duration-200",
                      "border-2 border-foreground/90 text-foreground hover:bg-foreground hover:text-background",
                      "active:scale-[0.97]"
                    )}
                    onClick={onBuyNow}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t("buyNow.button")}
                  </Button>
                )}

                {/* In stock confirmation */}
                {inStock && (
                  <div className="flex items-center gap-1.5 justify-center">
                    <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {t("catalog.inStockReady")}
                    </span>
                  </div>
                )}
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
        </div>

        {/* ── Tabbed Content ── */}
        <div className="mt-8 sm:mt-12 lg:mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-0 overflow-x-auto scrollbar-none">
              {product.description && (
                <TabsTrigger
                  value="description"
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap",
                    theme.text
                  )}
                >
                  {t("catalog.description")}
                </TabsTrigger>
              )}
              {Object.keys(product.attributes).length > 0 && (
                <TabsTrigger
                  value="specifications"
                  className={cn(
                    "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 sm:px-6 py-3 text-sm font-medium whitespace-nowrap",
                    theme.text
                  )}
                >
                  {t("catalog.specifications")}
                </TabsTrigger>
              )}
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

            {product.description && (
              <TabsContent value="description" className="pt-6">
                <div className="max-w-3xl">
                  <p className={cn("text-sm leading-relaxed whitespace-pre-line", theme.text)}>
                    {product.description}
                  </p>
                </div>
              </TabsContent>
            )}

            {Object.keys(product.attributes).length > 0 && (
              <TabsContent value="specifications" className="pt-6">
                <div className="max-w-2xl">
                  <dl className="divide-y">
                    {Object.entries(product.attributes).map(([key, val]) => (
                      <div key={key} className="flex py-3 text-sm">
                        <dt className={cn("w-1/3 font-medium", theme.textMuted)}>{key}</dt>
                        <dd className={cn("w-2/3 font-medium", theme.text)}>
                          {Array.isArray(val)
                            ? val.join(", ")
                            : typeof val === "boolean"
                            ? (val ? t("catalog.booleanYes") : t("catalog.booleanNo"))
                            : String(val)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </TabsContent>
            )}

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
