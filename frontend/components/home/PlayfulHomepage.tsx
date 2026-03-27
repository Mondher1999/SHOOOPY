"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/logger";
import type { Product, Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */

const PL = {
  purple: "#7C3AED",
  pink: "#EC4899",
  yellow: "#FBBF24",
  cyan: "#06B6D4",
  white: "#FFFFFF",
  dark: "#1E1E2E",
  light: "#F8F7FF",
} as const;

const PLPX = "px-6 md:px-16 lg:px-24";

/* ──────────────────────────── HELPERS ──────────────────────────── */

function getProductImage(
  product: Product,
  size: "thumbnail" | "medium" | "large" | "original" = "medium"
): string {
  const img = product.images?.[0];
  if (!img) return "/images/homepage/products/product-1.jpg";
  const src = img[size] || img.medium || img.original;
  return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
}

function getCategoryImage(cat: Category): string {
  if (!cat.image) return "/images/homepage/categories/printers.png";
  return cat.image.startsWith("http") ? cat.image : `${BASE_URL}${cat.image}`;
}

/* ──────────────────────────── PASTEL ROTATION ─────────────────── */

const PASTEL_BG = [
  "bg-purple-50",
  "bg-pink-50",
  "bg-cyan-50",
  "bg-yellow-50",
] as const;

const PASTEL_RING = [
  "ring-purple-200",
  "ring-pink-200",
  "ring-cyan-200",
  "ring-yellow-200",
] as const;

/* ──────────────────────────── SKELETONS ──────────────────────── */

function PLProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-md">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded-full" />
        <Skeleton className="h-5 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

function PLCategorySkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3 mx-auto rounded-full" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 -- PLHero
   Fun gradient hero (purple to pink) with bouncy headline
   and wavy/blob decorative elements via CSS
   ══════════════════════════════════════════════════════════════════ */

export function PLHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PL.purple} 0%, ${PL.pink} 100%)`,
      }}
    >
      {/* Blob decorations */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ backgroundColor: PL.yellow }}
      />
      <div
        className="absolute top-1/4 -right-24 w-80 h-80 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: PL.cyan }}
      />
      <div
        className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{ backgroundColor: PL.pink }}
      />

      {/* Floating shapes */}
      <div
        className="absolute top-20 right-[15%] w-16 h-16 rounded-2xl rotate-12 opacity-20 animate-bounce"
        style={{ backgroundColor: PL.yellow, animationDuration: "3s" }}
      />
      <div
        className="absolute bottom-32 left-[10%] w-12 h-12 rounded-full opacity-20 animate-bounce"
        style={{ backgroundColor: PL.cyan, animationDuration: "4s", animationDelay: "1s" }}
      />
      <div
        className="absolute top-[60%] right-[8%] w-10 h-10 rounded-xl rotate-45 opacity-15 animate-bounce"
        style={{ backgroundColor: PL.white, animationDuration: "3.5s", animationDelay: "0.5s" }}
      />

      {/* Wavy bottom edge */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60C240 120 480 0 720 60C960 120 1200 0 1440 60V120H0V60Z"
            fill={PL.light}
          />
        </svg>
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center max-w-4xl mx-auto ${PLPX} py-20 reveal`}>
        {/* Tagline pill */}
        <span className="inline-block px-5 py-2 rounded-full bg-white/20 text-white text-sm font-bold tracking-wide backdrop-blur-sm mb-8">
          {t("playful.hero.tagline", { defaultValue: "Welcome to the Fun Side of Shopping" })}
        </span>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          {t("playful.hero.heading", { defaultValue: "Discover Something Fun!" })}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-12 font-medium">
          {t("playful.hero.subtitle", {
            defaultValue:
              "Handpicked products that bring color and joy to your everyday life. Start exploring now.",
          })}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full px-8 py-4 font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/30"
          >
            {t("playful.hero.cta", { defaultValue: "Start Shopping" })}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 rounded-full px-8 py-4 font-bold text-base text-white border-2 border-white/60 transition-all duration-300 hover:bg-white hover:text-purple-600 hover:scale-105"
          >
            {t("playful.hero.ctaSecondary", { defaultValue: "Browse Categories" })}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-7 h-11 border-2 border-white/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/70 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 -- PLCategories
   Colorful category cards with rotating pastel tints
   ══════════════════════════════════════════════════════════════════ */

export function PLCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>(
      "/api/categories?limit=6&isActive=true"
    )
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 6));
      })
      .catch((err) => logger.error("PLCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 ${PLPX}`}
      style={{ backgroundColor: PL.light }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 reveal">
          <h2
            className="text-3xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: PL.dark }}
          >
            {t("playful.categories.heading", {
              defaultValue: "Pick Your Vibe",
            })}
          </h2>
          <p className="text-gray-500 mt-3 text-base md:text-lg max-w-lg mx-auto">
            {t("playful.categories.subtitle", {
              defaultValue:
                "Browse by category and find exactly what makes you happy.",
            })}
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 reveal-stagger">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <PLCategorySkeleton key={i} />
              ))
            : categories.map((cat, idx) => {
                const pastelBg = PASTEL_BG[idx % PASTEL_BG.length];
                return (
                  <Link
                    key={cat.id || cat.slug}
                    href={`/categories/${cat.slug}`}
                    className={`group relative rounded-3xl overflow-hidden ${pastelBg} p-4 md:p-6 transition-all duration-300 hover:scale-[1.03] hover:rotate-1 hover:shadow-xl hover:shadow-purple-200/50`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                      <Image
                        src={getCategoryImage(cat)}
                        alt={cat.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 33vw"
                      />
                    </div>
                    {/* Label */}
                    <h3
                      className="text-center text-base md:text-lg font-bold"
                      style={{ color: PL.dark }}
                    >
                      {cat.name}
                    </h3>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 -- PLFeaturedProducts
   Product grid with colorful hover effects and gradient sale badges
   ══════════════════════════════════════════════════════════════════ */

export function PLFeaturedProducts() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      "/api/products?limit=8&sort=bestseller&isActive=true"
    )
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("PLFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAddToCart = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(productId, 1);
    } catch {
      logger.error("PLFeaturedProducts: add to cart failed");
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 ${PLPX}`}
      style={{ backgroundColor: PL.white }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 reveal">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-white mb-3"
              style={{
                background: `linear-gradient(135deg, ${PL.purple}, ${PL.pink})`,
              }}
            >
              {t("playful.featured.tagline", {
                defaultValue: "CROWD FAVORITES",
              })}
            </span>
            <h2
              className="text-3xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: PL.dark }}
            >
              {t("playful.featured.heading", {
                defaultValue: "Best Sellers",
              })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 font-bold transition-colors hover:opacity-70"
            style={{ color: PL.purple }}
          >
            {t("playful.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <PLProductSkeleton key={i} />
              ))
            : products.map((product, idx) => {
                const hasDiscount =
                  product.compareAtPrice &&
                  product.compareAtPrice > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.compareAtPrice! - product.price) /
                        product.compareAtPrice!) *
                        100
                    )
                  : 0;

                // Rotating hover shadow colors
                const shadowColors = [
                  "hover:shadow-purple-300/50",
                  "hover:shadow-pink-300/50",
                  "hover:shadow-cyan-300/50",
                  "hover:shadow-yellow-300/50",
                ];
                const shadowClass = shadowColors[idx % shadowColors.length];

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className={`group cursor-pointer rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${shadowClass}`}
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-gray-50">
                      <Image
                        src={getProductImage(product, "medium")}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Gradient sale badge */}
                      {hasDiscount && (
                        <span
                          className="absolute top-3 left-3 px-3 py-1 text-xs font-bold text-white rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${PL.pink}, ${PL.purple})`,
                          }}
                        >
                          -{discountPercent}%
                        </span>
                      )}
                      {/* Quick add on hover */}
                      {!isShowcase && product.stock > 0 && (
                        <button
                          type="button"
                          className="absolute bottom-3 left-3 right-3 py-2.5 text-xs font-bold text-white text-center rounded-full transition-all translate-y-16 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          style={{
                            background: `linear-gradient(135deg, ${PL.purple}, ${PL.pink})`,
                          }}
                          onClick={(e) => handleAddToCart(e, product.id)}
                        >
                          {t("playful.featured.addToCart", {
                            defaultValue: "Add to Cart",
                          })}
                        </button>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3
                        className="text-sm font-bold line-clamp-1 mb-1"
                        style={{ color: PL.dark }}
                      >
                        {product.name}
                      </h3>
                      {!isShowcase && (
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-extrabold"
                            style={{ color: PL.purple }}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs line-through text-gray-400">
                              {formatPrice(product.compareAtPrice!)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Rating */}
                      {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Star
                            className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                            aria-hidden="true"
                          />
                          <span className="text-xs text-gray-500 font-medium">
                            {product.ratings.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 -- PLPromoBanner
   Full-width gradient banner (cyan to purple) with yellow accent
   ══════════════════════════════════════════════════════════════════ */

export function PLPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${PL.cyan} 0%, ${PL.purple} 100%)`,
      }}
    >
      {/* Decorative blobs */}
      <div
        className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: PL.pink }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: PL.yellow }}
      />

      {/* Floating shapes */}
      <div
        className="absolute top-12 left-[15%] w-8 h-8 rounded-full opacity-25 animate-bounce"
        style={{ backgroundColor: PL.yellow, animationDuration: "2.5s" }}
      />
      <div
        className="absolute bottom-16 right-[20%] w-10 h-10 rounded-xl rotate-12 opacity-20 animate-bounce"
        style={{
          backgroundColor: PL.white,
          animationDuration: "3s",
          animationDelay: "0.5s",
        }}
      />

      <div
        className={`relative z-10 max-w-3xl mx-auto text-center ${PLPX} reveal`}
      >
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight">
          {t("playful.promo.heading", {
            defaultValue: "Treats Await You!",
          })}
        </h2>
        <p className="text-base md:text-lg text-white/80 max-w-xl mx-auto mb-10 font-medium">
          {t("playful.promo.subtitle", {
            defaultValue:
              "Grab your favorites before they are gone. Limited-time deals on the products you love most.",
          })}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-3 rounded-full px-10 py-4 font-bold text-base transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{
            backgroundColor: PL.yellow,
            color: PL.dark,
          }}
        >
          {t("playful.promo.cta", { defaultValue: "Grab the Deals" })}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 -- PLNewArrivals
   Horizontal scroll with gradient "NEW" pill badges
   and gradient borders on hover
   ══════════════════════════════════════════════════════════════════ */

export function PLNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      "/api/products?limit=8&sort=newest&isActive=true"
    )
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("PLNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 ${PLPX}`}
      style={{ backgroundColor: PL.light }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-white mb-3"
              style={{
                background: `linear-gradient(135deg, ${PL.cyan}, ${PL.purple})`,
              }}
            >
              {t("playful.newArrivals.tagline", {
                defaultValue: "JUST DROPPED",
              })}
            </span>
            <h2
              className="text-3xl md:text-5xl font-extrabold tracking-tight"
              style={{ color: PL.dark }}
            >
              {t("playful.newArrivals.heading", {
                defaultValue: "Fresh Arrivals",
              })}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 rounded-full border-2 border-purple-200 text-purple-500 transition-all hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:scale-105"
              aria-label={t("playful.newArrivals.prev", {
                defaultValue: "Previous",
              })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 rounded-full border-2 border-purple-200 text-purple-500 transition-all hover:bg-purple-600 hover:text-white hover:border-purple-600 hover:scale-105"
              aria-label={t("playful.newArrivals.next", {
                defaultValue: "Next",
              })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-5 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[240px] md:min-w-[280px] snap-start"
                >
                  <PLProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[240px] md:min-w-[280px] snap-start flex-shrink-0 cursor-pointer"
                >
                  {/* Gradient border wrapper */}
                  <div className="rounded-2xl p-[2px] transition-all duration-300 bg-transparent group-hover:bg-gradient-to-br group-hover:from-purple-500 group-hover:via-pink-500 group-hover:to-cyan-500">
                    <div className="rounded-[14px] overflow-hidden bg-white">
                      {/* Image */}
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <Image
                          src={getProductImage(product, "medium")}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="280px"
                        />
                        {/* NEW pill badge */}
                        <span
                          className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${PL.cyan}, ${PL.purple})`,
                          }}
                        >
                          {t("playful.newArrivals.badge", {
                            defaultValue: "NEW",
                          })}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="p-4">
                        <h3
                          className="text-sm font-bold line-clamp-1 mb-1"
                          style={{ color: PL.dark }}
                        >
                          {product.name}
                        </h3>
                        {!isShowcase && (
                          <span
                            className="text-sm font-extrabold"
                            style={{ color: PL.purple }}
                          >
                            {formatPrice(product.price)}
                          </span>
                        )}
                        {/* Rating */}
                        {product.ratings.count > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star
                              className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                              aria-hidden="true"
                            />
                            <span className="text-xs text-gray-500 font-medium">
                              {product.ratings.average.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 -- PLTestimonials
   3 hardcoded testimonial cards with different pastel backgrounds,
   colored avatar circles with initials, star ratings in yellow
   ══════════════════════════════════════════════════════════════════ */

export function PLTestimonials() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const testimonials = [
    {
      name: t("playful.testimonials.t1.name", { defaultValue: "Sarah M." }),
      location: t("playful.testimonials.t1.location", {
        defaultValue: "Tunis",
      }),
      quote: t("playful.testimonials.t1.quote", {
        defaultValue:
          "Shopping here always puts a smile on my face. The quality is top-notch and delivery is super fast!",
      }),
      rating: 5,
      initial: "S",
      bgClass: "bg-purple-50",
      avatarBg: PL.purple,
      ringClass: PASTEL_RING[0],
    },
    {
      name: t("playful.testimonials.t2.name", { defaultValue: "Ahmed B." }),
      location: t("playful.testimonials.t2.location", {
        defaultValue: "Sousse",
      }),
      quote: t("playful.testimonials.t2.quote", {
        defaultValue:
          "I love the variety of products. Found exactly what I was looking for and the prices are very fair.",
      }),
      rating: 5,
      initial: "A",
      bgClass: "bg-pink-50",
      avatarBg: PL.pink,
      ringClass: PASTEL_RING[1],
    },
    {
      name: t("playful.testimonials.t3.name", { defaultValue: "Leila K." }),
      location: t("playful.testimonials.t3.location", {
        defaultValue: "Sfax",
      }),
      quote: t("playful.testimonials.t3.quote", {
        defaultValue:
          "Cash on delivery is so convenient. The whole experience from browsing to receiving my order was great.",
      }),
      rating: 4,
      initial: "L",
      bgClass: "bg-cyan-50",
      avatarBg: PL.cyan,
      ringClass: PASTEL_RING[2],
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`py-16 md:py-24 ${PLPX}`}
      style={{ backgroundColor: PL.white }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 reveal">
          <h2
            className="text-3xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: PL.dark }}
          >
            {t("playful.testimonials.heading", {
              defaultValue: "Happy Customers",
            })}
          </h2>
          <p className="text-gray-500 mt-3 text-base md:text-lg max-w-lg mx-auto">
            {t("playful.testimonials.subtitle", {
              defaultValue: "See what people are saying about their experience.",
            })}
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 reveal-stagger">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className={`${item.bgClass} rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-200/50 hover:scale-[1.02]`}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < item.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-200"
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>

              {/* Quote */}
              <p
                className="text-base leading-relaxed mb-6 font-medium"
                style={{ color: PL.dark }}
              >
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                {/* Colored avatar circle with initial */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ring-4 ${item.ringClass}`}
                  style={{ backgroundColor: item.avatarBg }}
                >
                  {item.initial}
                </div>
                <div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: PL.dark }}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 -- PLNewsletter
   Dark purple background with confetti-style dots,
   gradient input border on focus, gradient subscribe button
   ══════════════════════════════════════════════════════════════════ */

export function PLNewsletter() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      await fetchAPI("/api/subscribers", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`relative py-16 md:py-24 ${PLPX} overflow-hidden`}
      style={{ backgroundColor: PL.dark }}
    >
      {/* Confetti-style decorative dots */}
      <div
        className="absolute top-8 left-[8%] w-3 h-3 rounded-full opacity-40"
        style={{ backgroundColor: PL.pink }}
      />
      <div
        className="absolute top-16 left-[22%] w-2 h-2 rounded-full opacity-50"
        style={{ backgroundColor: PL.yellow }}
      />
      <div
        className="absolute top-12 right-[12%] w-4 h-4 rounded-full opacity-30"
        style={{ backgroundColor: PL.purple }}
      />
      <div
        className="absolute top-24 right-[28%] w-2.5 h-2.5 rounded-full opacity-40"
        style={{ backgroundColor: PL.cyan }}
      />
      <div
        className="absolute bottom-12 left-[15%] w-3.5 h-3.5 rounded-full opacity-35"
        style={{ backgroundColor: PL.yellow }}
      />
      <div
        className="absolute bottom-20 right-[18%] w-2 h-2 rounded-full opacity-45"
        style={{ backgroundColor: PL.pink }}
      />
      <div
        className="absolute top-1/2 left-[5%] w-2 h-2 rounded-full opacity-30"
        style={{ backgroundColor: PL.cyan }}
      />
      <div
        className="absolute top-1/3 right-[6%] w-3 h-3 rounded-full opacity-25"
        style={{ backgroundColor: PL.yellow }}
      />
      <div
        className="absolute bottom-8 left-[40%] w-2.5 h-2.5 rounded-full opacity-35"
        style={{ backgroundColor: PL.purple }}
      />
      <div
        className="absolute bottom-16 right-[40%] w-2 h-2 rounded-full opacity-40"
        style={{ backgroundColor: PL.pink }}
      />
      {/* Larger faint blobs */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: PL.purple }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 blur-2xl"
        style={{ backgroundColor: PL.pink }}
      />

      <div className="relative z-10 max-w-2xl mx-auto text-center reveal">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
          {t("playful.newsletter.heading", {
            defaultValue: "Don't Miss the Fun!",
          })}
        </h2>
        <p className="text-base text-gray-400 mb-10 max-w-md mx-auto">
          {t("playful.newsletter.subtitle", {
            defaultValue:
              "Subscribe for exclusive drops, colorful deals, and early access to new arrivals.",
          })}
        </p>

        {status === "success" ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${PL.purple}, ${PL.pink})`,
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-white">
              {t("playful.newsletter.success", {
                defaultValue: "You are in! Check your inbox.",
              })}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            {/* Input with gradient border on focus */}
            <div className="flex-1 relative group rounded-full p-[2px] bg-gray-600 focus-within:bg-gradient-to-r focus-within:from-purple-500 focus-within:via-pink-500 focus-within:to-cyan-500 transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("playful.newsletter.placeholder", {
                  defaultValue: "Enter your email",
                })}
                className="w-full px-6 py-4 text-sm bg-[#1E1E2E] text-white placeholder:text-gray-500 rounded-full focus:outline-none"
                required
                aria-label={t("playful.newsletter.emailLabel", {
                  defaultValue: "Email address",
                })}
              />
            </div>
            {/* Gradient subscribe button */}
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 text-sm font-bold text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${PL.purple}, ${PL.pink})`,
              }}
            >
              {status === "loading"
                ? t("playful.newsletter.sending", {
                    defaultValue: "Sending...",
                  })
                : t("playful.newsletter.cta", {
                    defaultValue: "Subscribe",
                  })}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm mt-4 text-red-400">
            {t("playful.newsletter.error", {
              defaultValue: "Something went wrong. Please try again.",
            })}
          </p>
        )}
      </div>
    </section>
  );
}
