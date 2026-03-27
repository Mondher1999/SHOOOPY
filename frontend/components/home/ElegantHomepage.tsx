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
const EL = {
  dark: "#1B1B1B",
  gold: "#C5A467",
  cream: "#FAF7F2",
  white: "#FFFFFF",
  textMuted: "#7A7A7A",
  border: "#E8E0D4",
} as const;

const ELPX = "px-6 md:px-16 lg:px-24";

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

/* ──────────────────────────── SKELETONS ─────────────────────────── */

function ElegantProductSkeleton() {
  return (
    <div className="overflow-hidden" style={{ borderColor: EL.border, borderWidth: 1 }}>
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-4 w-3/4 mx-auto" />
        <Skeleton className="h-3 w-1/3 mx-auto" />
      </div>
    </div>
  );
}

function ElegantCategorySkeleton() {
  return (
    <div className="relative overflow-hidden">
      <Skeleton className="aspect-[2/3] w-full" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Full-screen elegant hero with cream/dark split, serif headline
   ══════════════════════════════════════════════════════════════════ */

export function ELHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: EL.cream }}
    >
      {/* Background image with cream overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/homepage/hero/hero-bg.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${EL.cream}e6 0%, ${EL.cream}b3 40%, transparent 70%)`,
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${EL.dark}40 0%, transparent 40%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-5xl mx-auto text-center ${ELPX} py-24 reveal`}>
        {/* Gold accent line */}
        <div
          className="w-16 h-[1px] mx-auto mb-8"
          style={{ backgroundColor: EL.gold }}
        />

        {/* Tagline */}
        <p
          className="text-xs md:text-sm font-light uppercase tracking-[0.4em] mb-6"
          style={{ color: EL.gold }}
        >
          {t("vitrine.hero.tagline", { defaultValue: "Curated Collection" })}
        </p>

        {/* Main headline */}
        <h1
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight leading-[1.05] mb-8"
          style={{ color: EL.dark }}
        >
          {t("vitrine.hero.heading", { defaultValue: "Timeless Elegance" })}
        </h1>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg font-light max-w-xl mx-auto mb-14 leading-relaxed"
          style={{ color: EL.textMuted }}
        >
          {t("vitrine.hero.subtitle", {
            defaultValue:
              "Discover a refined selection of pieces crafted with exceptional attention to detail and enduring quality.",
          })}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 px-10 py-4 text-xs uppercase tracking-[0.25em] font-light transition-all duration-500 border"
            style={{
              borderColor: EL.gold,
              color: EL.gold,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = EL.gold;
              e.currentTarget.style.color = EL.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = EL.gold;
            }}
          >
            {t("vitrine.hero.cta", { defaultValue: "Explore Collection" })}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 px-10 py-4 text-xs uppercase tracking-[0.25em] font-light transition-all duration-500 border"
            style={{
              borderColor: EL.dark,
              color: EL.dark,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = EL.dark;
              e.currentTarget.style.color = EL.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = EL.dark;
            }}
          >
            {t("vitrine.hero.ctaSecondary", { defaultValue: "View Categories" })}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-3 animate-bounce">
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-light"
            style={{ color: EL.textMuted }}
          >
            {t("vitrine.hero.scroll", { defaultValue: "Scroll" })}
          </span>
          <div
            className="w-[1px] h-8"
            style={{ backgroundColor: EL.gold }}
          />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — COLLECTIONS
   Tall portrait-style category cards with minimal overlay
   ══════════════════════════════════════════════════════════════════ */

export function ELCollections() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories?limit=4&isActive=true")
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 4));
      })
      .catch((err) => logger.error("ELCollections: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-36 ${ELPX}`}
      style={{ backgroundColor: EL.white }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 md:mb-20 reveal">
          <p
            className="text-xs uppercase tracking-[0.4em] font-light mb-4"
            style={{ color: EL.gold }}
          >
            {t("vitrine.collections.tagline", { defaultValue: "Our Collections" })}
          </p>
          <h2
            className="font-serif text-3xl md:text-5xl font-light tracking-tight"
            style={{ color: EL.dark }}
          >
            {t("vitrine.collections.heading", { defaultValue: "Shop by Category" })}
          </h2>
          <div
            className="w-12 h-[1px] mx-auto mt-6"
            style={{ backgroundColor: EL.gold }}
          />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal-stagger">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <ElegantCategorySkeleton key={i} />)
            : categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group relative aspect-[2/3] overflow-hidden cursor-pointer"
                >
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {/* Minimal gradient overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(to top, ${EL.dark}99 0%, ${EL.dark}1a 50%, transparent 100%)`,
                    }}
                  />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-center">
                    <h3 className="font-serif text-lg md:text-xl font-light text-white tracking-wide mb-2">
                      {cat.name}
                    </h3>
                    {/* Gold underline on hover */}
                    <div
                      className="w-0 h-[1px] mx-auto transition-all duration-500 group-hover:w-12"
                      style={{ backgroundColor: EL.gold }}
                    />
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — FEATURED PRODUCTS
   Clean white cards, thin borders, serif product names
   ══════════════════════════════════════════════════════════════════ */

export function ELFeaturedProducts() {
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
      .catch((err) => logger.error("ELFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-36 ${ELPX}`}
      style={{ backgroundColor: EL.cream }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 md:mb-16 reveal">
          <div>
            <p
              className="text-xs uppercase tracking-[0.4em] font-light mb-3"
              style={{ color: EL.gold }}
            >
              {t("vitrine.featured.tagline", { defaultValue: "Curated Selection" })}
            </p>
            <h2
              className="font-serif text-3xl md:text-5xl font-light tracking-tight"
              style={{ color: EL.dark }}
            >
              {t("vitrine.featured.heading", { defaultValue: "Featured Pieces" })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-light transition-all duration-300"
            style={{ color: EL.gold }}
            onMouseEnter={(e) => (e.currentTarget.style.color = EL.dark)}
            onMouseLeave={(e) => (e.currentTarget.style.color = EL.gold)}
          >
            {t("vitrine.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ElegantProductSkeleton key={i} />)
            : products.map((product) => {
                const hasDiscount =
                  product.compareAtPrice && product.compareAtPrice > product.price;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group cursor-pointer"
                  >
                    {/* Image with border */}
                    <div
                      className="relative aspect-[3/4] overflow-hidden mb-5 border transition-all duration-500"
                      style={{
                        borderColor: EL.border,
                        backgroundColor: EL.white,
                      }}
                    >
                      <Image
                        src={getProductImage(product, "medium")}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Discount badge */}
                      {hasDiscount && (
                        <span
                          className="absolute top-4 left-4 px-3 py-1 text-[10px] font-serif font-light tracking-wider"
                          style={{
                            backgroundColor: EL.cream,
                            color: EL.gold,
                            border: `1px solid ${EL.gold}`,
                          }}
                        >
                          {t("vitrine.featured.sale", { defaultValue: "Sale" })}
                        </span>
                      )}
                      {/* Add to Bag on hover */}
                      {!isShowcase && product.stock > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full transition-transform duration-500 group-hover:translate-y-0">
                          <button
                            type="button"
                            className="w-full text-center text-[11px] uppercase tracking-[0.2em] font-light py-3 transition-all duration-300 border"
                            style={{
                              borderColor: EL.gold,
                              color: EL.gold,
                              backgroundColor: `${EL.white}f2`,
                              backdropFilter: "blur(8px)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = EL.gold;
                              e.currentTarget.style.color = EL.white;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `${EL.white}f2`;
                              e.currentTarget.style.color = EL.gold;
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              addItem(product.id, 1);
                            }}
                          >
                            {t("vitrine.featured.addToBag", { defaultValue: "Add to Bag" })}
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="text-center">
                      <h3
                        className="font-serif text-sm md:text-base font-light line-clamp-1 mb-2 tracking-wide"
                        style={{ color: EL.dark }}
                      >
                        {product.name}
                      </h3>
                      {!isShowcase && (
                        <div className="flex items-center justify-center gap-3">
                          <span
                            className="text-sm font-light tracking-wide"
                            style={{ color: EL.dark }}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {hasDiscount && (
                            <span
                              className="text-xs font-light line-through"
                              style={{ color: EL.textMuted }}
                            >
                              {formatPrice(product.compareAtPrice!)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Rating */}
                      {product.ratings.count > 0 && (
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3"
                              style={{
                                fill:
                                  i < Math.round(product.ratings.average)
                                    ? EL.gold
                                    : "transparent",
                                color:
                                  i < Math.round(product.ratings.average)
                                    ? EL.gold
                                    : EL.border,
                              }}
                              aria-hidden="true"
                            />
                          ))}
                          <span
                            className="text-[11px] font-light ml-1"
                            style={{ color: EL.textMuted }}
                          >
                            ({product.ratings.count})
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
   SECTION 4 — PROMO BANNER
   Full-width cream background with gold borders and serif headline
   ══════════════════════════════════════════════════════════════════ */

export function ELPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ backgroundColor: EL.cream }}
    >
      {/* Top gold border */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: EL.gold }}
      />
      {/* Bottom gold border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ backgroundColor: EL.gold }}
      />

      {/* Decorative corner accents */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10">
        <div className="w-8 h-8 md:w-12 md:h-12">
          <div className="absolute top-0 left-0 w-full h-[1px]" style={{ backgroundColor: EL.gold }} />
          <div className="absolute top-0 left-0 w-[1px] h-full" style={{ backgroundColor: EL.gold }} />
        </div>
      </div>
      <div className="absolute bottom-6 right-6 md:bottom-10 md:right-10">
        <div className="w-8 h-8 md:w-12 md:h-12 relative">
          <div className="absolute bottom-0 right-0 w-full h-[1px]" style={{ backgroundColor: EL.gold }} />
          <div className="absolute bottom-0 right-0 w-[1px] h-full" style={{ backgroundColor: EL.gold }} />
        </div>
      </div>

      <div className={`relative z-10 max-w-3xl mx-auto text-center ${ELPX} reveal`}>
        {/* Gold ornament */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-[1px]" style={{ backgroundColor: EL.gold }} />
          <div
            className="w-2 h-2 rotate-45"
            style={{ border: `1px solid ${EL.gold}` }}
          />
          <div className="w-12 h-[1px]" style={{ backgroundColor: EL.gold }} />
        </div>

        <p
          className="text-xs uppercase tracking-[0.4em] font-light mb-5"
          style={{ color: EL.gold }}
        >
          {t("vitrine.promo.tagline", { defaultValue: "Exclusive Offer" })}
        </p>

        <h2
          className="font-serif text-3xl md:text-5xl lg:text-6xl font-light tracking-tight leading-[1.1] mb-6"
          style={{ color: EL.dark }}
        >
          {t("vitrine.promo.heading", { defaultValue: "The Art of Living Well" })}
        </h2>

        <p
          className="text-base font-light max-w-lg mx-auto mb-12 leading-relaxed"
          style={{ color: EL.textMuted }}
        >
          {t("vitrine.promo.subtitle", {
            defaultValue:
              "Indulge in our carefully curated selection of premium pieces. Elevate your everyday with uncompromising quality.",
          })}
        </p>

        <Link
          href="/products"
          className="group inline-flex items-center gap-3 px-10 py-4 text-xs uppercase tracking-[0.25em] font-light transition-all duration-500 border"
          style={{
            borderColor: EL.gold,
            color: EL.gold,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = EL.gold;
            e.currentTarget.style.color = EL.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = EL.gold;
          }}
        >
          {t("vitrine.promo.cta", { defaultValue: "Discover Now" })}
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — NEW ARRIVALS
   Horizontal scrollable row with elegant gold "New" badge
   ══════════════════════════════════════════════════════════════════ */

export function ELNewArrivals() {
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
      .catch((err) => logger.error("ELNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-36 ${ELPX}`}
      style={{ backgroundColor: EL.white }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-14 md:mb-16 reveal">
          <div>
            <p
              className="text-xs uppercase tracking-[0.4em] font-light mb-3"
              style={{ color: EL.gold }}
            >
              {t("vitrine.newArrivals.tagline", { defaultValue: "Just Arrived" })}
            </p>
            <h2
              className="font-serif text-3xl md:text-5xl font-light tracking-tight"
              style={{ color: EL.dark }}
            >
              {t("vitrine.newArrivals.heading", { defaultValue: "New Arrivals" })}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 border transition-all duration-300"
              style={{ borderColor: EL.border, color: EL.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = EL.gold;
                e.currentTarget.style.color = EL.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = EL.border;
                e.currentTarget.style.color = EL.textMuted;
              }}
              aria-label={t("vitrine.newArrivals.prev", { defaultValue: "Previous" })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 border transition-all duration-300"
              style={{ borderColor: EL.border, color: EL.textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = EL.gold;
                e.currentTarget.style.color = EL.gold;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = EL.border;
                e.currentTarget.style.color = EL.textMuted;
              }}
              aria-label={t("vitrine.newArrivals.next", { defaultValue: "Next" })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-5 md:gap-7 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[240px] md:min-w-[280px] snap-start">
                  <ElegantProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[240px] md:min-w-[280px] snap-start cursor-pointer flex-shrink-0"
                >
                  <div
                    className="relative aspect-[3/4] overflow-hidden mb-5 border transition-all duration-500"
                    style={{
                      borderColor: EL.border,
                      backgroundColor: EL.white,
                    }}
                  >
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                      sizes="280px"
                    />
                    {/* Elegant "New" badge */}
                    <div
                      className="absolute top-4 left-4 px-3 py-1.5 font-serif text-[11px] tracking-wider italic"
                      style={{
                        backgroundColor: `${EL.white}f0`,
                        color: EL.gold,
                        border: `1px solid ${EL.gold}`,
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {t("vitrine.newArrivals.badge", { defaultValue: "New" })}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="text-center">
                    <h3
                      className="font-serif text-sm font-light line-clamp-1 tracking-wide mb-1.5"
                      style={{ color: EL.dark }}
                    >
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <span
                        className="text-sm font-light tracking-wide"
                        style={{ color: EL.textMuted }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — BRAND STORY
   Split layout: left image, right serif headline + body + gold CTA
   ══════════════════════════════════════════════════════════════════ */

export function ELBrandStory() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-36 ${ELPX}`}
      style={{ backgroundColor: EL.cream }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Left side: Image */}
          <div className="relative reveal">
            <div
              className="relative aspect-[4/5] overflow-hidden border"
              style={{ borderColor: EL.border }}
            >
              <Image
                src="/images/homepage/hero/hero-bg.jpg"
                alt={t("vitrine.brandStory.imageAlt", { defaultValue: "Our story" })}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            {/* Decorative gold frame offset */}
            <div
              className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-full h-full border pointer-events-none -z-10"
              style={{ borderColor: EL.gold }}
            />
          </div>

          {/* Right side: Content */}
          <div className="lg:pl-6 reveal">
            {/* Gold accent */}
            <div
              className="w-12 h-[1px] mb-8"
              style={{ backgroundColor: EL.gold }}
            />

            <p
              className="text-xs uppercase tracking-[0.4em] font-light mb-4"
              style={{ color: EL.gold }}
            >
              {t("vitrine.brandStory.tagline", { defaultValue: "Our Story" })}
            </p>

            <h2
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-tight leading-[1.15] mb-8"
              style={{ color: EL.dark }}
            >
              {t("vitrine.brandStory.heading", {
                defaultValue: "Crafted with Passion & Purpose",
              })}
            </h2>

            <p
              className="text-base font-light leading-[1.9] mb-6"
              style={{ color: EL.textMuted }}
            >
              {t("vitrine.brandStory.body1", {
                defaultValue:
                  "Every piece in our collection tells a story of meticulous craftsmanship and timeless design. We believe that true luxury lies in the details \u2014 the quality of materials, the precision of construction, and the joy of owning something truly exceptional.",
              })}
            </p>

            <p
              className="text-base font-light leading-[1.9] mb-10"
              style={{ color: EL.textMuted }}
            >
              {t("vitrine.brandStory.body2", {
                defaultValue:
                  "Our journey began with a simple vision: to create a destination where discerning individuals discover pieces that transcend fleeting trends and become cherished companions for years to come.",
              })}
            </p>

            <Link
              href="/categories"
              className="group inline-flex items-center gap-3 text-xs uppercase tracking-[0.25em] font-light transition-all duration-300"
              style={{ color: EL.gold }}
              onMouseEnter={(e) => (e.currentTarget.style.color = EL.dark)}
              onMouseLeave={(e) => (e.currentTarget.style.color = EL.gold)}
            >
              {t("vitrine.brandStory.cta", { defaultValue: "Explore Our Collections" })}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — NEWSLETTER
   Dark background, centered serif headline, gold-bordered input
   ══════════════════════════════════════════════════════════════════ */

export function ELNewsletter() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
      className={`py-24 md:py-36 ${ELPX}`}
      style={{ backgroundColor: EL.dark }}
    >
      <div className="max-w-2xl mx-auto text-center reveal">
        {/* Gold ornament */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="w-10 h-[1px]" style={{ backgroundColor: EL.gold }} />
          <div
            className="w-1.5 h-1.5 rotate-45"
            style={{ border: `1px solid ${EL.gold}` }}
          />
          <div className="w-10 h-[1px]" style={{ backgroundColor: EL.gold }} />
        </div>

        <h2 className="font-serif text-3xl md:text-5xl font-light tracking-tight text-white mb-4">
          {t("vitrine.newsletter.heading", { defaultValue: "Join Our World" })}
        </h2>

        <p
          className="text-sm font-light max-w-md mx-auto mb-12 leading-relaxed"
          style={{ color: EL.textMuted }}
        >
          {t("vitrine.newsletter.subtitle", {
            defaultValue:
              "Be the first to discover new collections, exclusive offers, and the stories behind our craft.",
          })}
        </p>

        {status === "success" ? (
          <div>
            <p
              className="font-serif text-lg font-light tracking-wide"
              style={{ color: EL.gold }}
            >
              {t("vitrine.newsletter.success", { defaultValue: "Welcome to our world." })}
            </p>
            <p
              className="text-sm font-light mt-2"
              style={{ color: EL.textMuted }}
            >
              {t("vitrine.newsletter.successSub", {
                defaultValue: "Check your inbox for a special welcome.",
              })}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("vitrine.newsletter.placeholder", {
                defaultValue: "Enter your email address",
              })}
              className="flex-1 px-6 py-4 text-sm font-light tracking-wide bg-transparent text-white placeholder:font-light transition-colors duration-300 focus:outline-none"
              style={{
                border: `1px solid ${EL.gold}66`,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = EL.gold)}
              onBlur={(e) => (e.currentTarget.style.borderColor = `${EL.gold}40`)}
              required
              aria-label={t("vitrine.newsletter.emailLabel", { defaultValue: "Email address" })}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 text-xs uppercase tracking-[0.25em] font-light transition-all duration-500 disabled:opacity-50"
              style={{
                border: `1px solid ${EL.gold}`,
                color: EL.gold,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                if (status !== "loading") {
                  e.currentTarget.style.backgroundColor = EL.gold;
                  e.currentTarget.style.color = EL.white;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = EL.gold;
              }}
            >
              {status === "loading"
                ? t("vitrine.newsletter.sending", { defaultValue: "Sending..." })
                : t("vitrine.newsletter.cta", { defaultValue: "Subscribe" })}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm font-light mt-6 text-red-400">
            {t("vitrine.newsletter.error", {
              defaultValue: "Something went wrong. Please try again.",
            })}
          </p>
        )}

        {/* Bottom gold line */}
        <div
          className="w-16 h-[1px] mx-auto mt-14"
          style={{ backgroundColor: EL.gold }}
        />
      </div>
    </section>
  );
}
