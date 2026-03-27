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
const AR = {
  dark: "#2C1810",
  accent: "#C67B4A",
  cream: "#FFF8F0",
  olive: "#6B7C5E",
  text: "#3D2B1F",
  muted: "#9C8B7E",
  border: "#E8DDD0",
  white: "#FFFFFF",
} as const;

const ARPX = "px-6 md:px-16 lg:px-24";

/* ──────────────────────────── HELPERS ──────────────────────────── */

function getProductImage(product: Product, size: "thumbnail" | "medium" | "large" | "original" = "medium"): string {
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

function ArtisanProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: AR.white }}>
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

function ArtisanCategorySkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border-2 border-dashed" style={{ borderColor: AR.border }}>
      <Skeleton className="aspect-[4/3] w-full" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Warm hero with serif headline, earthy overlay, organic CTA
   ══════════════════════════════════════════════════════════════════ */

export function ARHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center overflow-hidden"
      style={{ backgroundColor: AR.cream }}
    >
      {/* Background image with warm overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/homepage/hero/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${AR.cream}CC 0%, ${AR.cream}80 50%, transparent 100%)` }}
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-5xl mx-auto text-center ${ARPX} py-20 reveal`}>
        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="w-12 h-[1px]" style={{ backgroundColor: AR.accent }} />
          <p
            className="text-sm font-medium tracking-[0.2em] uppercase"
            style={{ color: AR.accent }}
          >
            {t("vitrine.hero.tagline", { defaultValue: "New Collection 2025" })}
          </p>
          <div className="w-12 h-[1px]" style={{ backgroundColor: AR.accent }} />
        </div>

        {/* Main headline — serif style */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight mb-6"
          style={{ color: AR.dark }}
        >
          {t("vitrine.hero.heading", { defaultValue: "Redefine Your Style" })}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: AR.muted }}>
          {t("vitrine.hero.subtitle", { defaultValue: "Discover bold products built for those who stand out. Premium quality, unmatched design." })}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg text-white"
            style={{ backgroundColor: AR.accent }}
          >
            {t("vitrine.hero.cta", { defaultValue: "Shop Now" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-medium text-sm border-2 transition-all duration-300 hover:shadow-md"
            style={{ borderColor: AR.dark, color: AR.dark }}
          >
            {t("vitrine.hero.ctaSecondary", { defaultValue: "Explore Categories" })}
          </Link>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: i === 2 ? AR.accent : `${AR.accent}40` }}
          />
        ))}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — CATEGORIES
   Rounded cards with dotted borders, olive accent
   ══════════════════════════════════════════════════════════════════ */

export function ARCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories?limit=6&isActive=true")
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 6));
      })
      .catch((err) => logger.error("ARCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${ARPX}`} style={{ backgroundColor: AR.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-14 reveal">
          <p className="text-sm font-medium tracking-[0.2em] uppercase mb-3" style={{ color: AR.olive }}>
            {t("vitrine.categories.tagline", { defaultValue: "Curated Collections" })}
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: AR.dark }}>
            {t("vitrine.categories.heading", { defaultValue: "Shop by Category" })}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-8 h-[1px]" style={{ backgroundColor: AR.border }} />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AR.accent }} />
            <div className="w-8 h-[1px]" style={{ backgroundColor: AR.border }} />
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-8 reveal-stagger">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <ArtisanCategorySkeleton key={i} />)
            : categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed transition-all duration-500 hover:border-solid hover:shadow-lg"
                  style={{ borderColor: AR.border }}
                >
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {/* Warm overlay */}
                  <div
                    className="absolute inset-0 transition-opacity"
                    style={{ background: `linear-gradient(to top, ${AR.dark}CC, ${AR.dark}20, transparent)` }}
                  />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-lg md:text-xl font-serif font-bold text-white mb-1">
                      {cat.name}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium tracking-wide transition-all group-hover:gap-3"
                      style={{ color: AR.accent }}
                    >
                      {t("vitrine.categories.explore", { defaultValue: "Explore" })}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
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
   Rounded corners, warm shadows, handcrafted feel
   ══════════════════════════════════════════════════════════════════ */

export function ARFeaturedProducts() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=bestseller&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("ARFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${ARPX}`} style={{ backgroundColor: AR.cream }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 reveal">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase mb-2" style={{ color: AR.olive }}>
              {t("vitrine.featured.tagline", { defaultValue: "Top Picks" })}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: AR.dark }}>
              {t("vitrine.featured.heading", { defaultValue: "Best Sellers" })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-medium tracking-wide transition-colors hover:opacity-70"
            style={{ color: AR.accent }}
          >
            {t("vitrine.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ArtisanProductSkeleton key={i} />)
            : products.map((product) => {
                const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group cursor-pointer"
                  >
                    {/* Image */}
                    <div
                      className="relative aspect-square rounded-2xl overflow-hidden mb-4 transition-shadow duration-500 group-hover:shadow-lg"
                      style={{ backgroundColor: AR.cream }}
                    >
                      <Image
                        src={getProductImage(product, "medium")}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Discount badge */}
                      {hasDiscount && (
                        <span
                          className="absolute top-3 left-3 px-3 py-1 text-xs font-medium rounded-full text-white"
                          style={{ backgroundColor: AR.olive }}
                        >
                          -{discountPercent}%
                        </span>
                      )}
                      {/* Quick add */}
                      {!isShowcase && product.stock > 0 && (
                        <button
                          type="button"
                          className="absolute bottom-3 left-3 right-3 py-2.5 text-xs font-medium rounded-full text-white text-center transition-all translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                          style={{ backgroundColor: AR.accent }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(product.id, 1);
                          }}
                        >
                          {t("vitrine.featured.addToCart", { defaultValue: "Add to Cart" })}
                        </button>
                      )}
                    </div>
                    {/* Info */}
                    <h3 className="text-sm font-medium line-clamp-1 mb-1" style={{ color: AR.text }}>
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: AR.dark }}>
                          {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through" style={{ color: AR.muted }}>
                            {formatPrice(product.compareAtPrice!)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Rating */}
                    {product.ratings.count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                        <span className="text-xs" style={{ color: AR.muted }}>
                          {product.ratings.average.toFixed(1)}
                        </span>
                      </div>
                    )}
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
   Warm terracotta banner with handcrafted typography
   ══════════════════════════════════════════════════════════════════ */

export function ARPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
      style={{ backgroundColor: AR.dark }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
        style={{ backgroundColor: AR.accent }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-10"
        style={{ backgroundColor: AR.olive }}
      />

      <div className={`relative z-10 max-w-4xl mx-auto text-center ${ARPX} reveal`}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-[1px] bg-white/30" />
          <p className="text-sm font-medium tracking-[0.2em] uppercase" style={{ color: AR.accent }}>
            {t("vitrine.promo.tagline", { defaultValue: "Limited Time Offer" })}
          </p>
          <div className="w-10 h-[1px] bg-white/30" />
        </div>
        <h2 className="text-4xl md:text-6xl font-serif font-bold text-white leading-tight mb-6">
          {t("vitrine.promo.heading", { defaultValue: "Up to 50% Off" })}
        </h2>
        <p className="text-base md:text-lg max-w-xl mx-auto mb-10 text-white/60">
          {t("vitrine.promo.subtitle", { defaultValue: "Don't miss out on our biggest sale of the season. Premium products at unbeatable prices." })}
        </p>
        <Link
          href="/products?sale=true"
          className="inline-flex items-center gap-3 px-10 py-4 rounded-full font-medium text-sm text-white transition-all duration-300 hover:scale-105 hover:shadow-lg"
          style={{ backgroundColor: AR.accent }}
        >
          {t("vitrine.promo.cta", { defaultValue: "Shop the Sale" })}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — NEW ARRIVALS
   Horizontal scroll with organic badges
   ══════════════════════════════════════════════════════════════════ */

export function ARNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=newest&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("ARNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${ARPX}`} style={{ backgroundColor: AR.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] uppercase mb-2" style={{ color: AR.olive }}>
              {t("vitrine.newArrivals.tagline", { defaultValue: "Just Dropped" })}
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold" style={{ color: AR.dark }}>
              {t("vitrine.newArrivals.heading", { defaultValue: "New Arrivals" })}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 rounded-full border-2 border-dashed transition-colors"
              style={{ borderColor: AR.border, color: AR.text }}
              aria-label={t("vitrine.newArrivals.prev", { defaultValue: "Previous" })}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 rounded-full border-2 border-dashed transition-colors"
              style={{ borderColor: AR.border, color: AR.text }}
              aria-label={t("vitrine.newArrivals.next", { defaultValue: "Next" })}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-5 md:gap-7 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[240px] md:min-w-[280px] snap-start">
                  <ArtisanProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[240px] md:min-w-[280px] snap-start cursor-pointer flex-shrink-0"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: AR.cream }}>
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="280px"
                    />
                    <span
                      className="absolute top-3 left-3 px-3 py-1 text-[10px] font-medium tracking-wider rounded-full text-white"
                      style={{ backgroundColor: AR.olive }}
                    >
                      {t("vitrine.newArrivals.badge", { defaultValue: "New" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium line-clamp-1 mb-1" style={{ color: AR.text }}>
                    {product.name}
                  </h3>
                  {!isShowcase && (
                    <span className="text-sm font-bold" style={{ color: AR.dark }}>
                      {formatPrice(product.price)}
                    </span>
                  )}
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — CRAFT STORY
   Brand narrative section with warm imagery
   ══════════════════════════════════════════════════════════════════ */

export function ARCraftStory() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className={`py-16 md:py-24 ${ARPX}`} style={{ backgroundColor: AR.cream }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center reveal">
          {/* Image side */}
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
            <Image
              src="/images/homepage/hero/hero-bg.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Warm overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{ background: `linear-gradient(135deg, ${AR.accent}, transparent)` }}
            />
          </div>

          {/* Text side */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-[1px]" style={{ backgroundColor: AR.accent }} />
              <p className="text-sm font-medium tracking-[0.2em] uppercase" style={{ color: AR.accent }}>
                {t("vitrine.craftStory.tagline", { defaultValue: "Our Journey" })}
              </p>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6" style={{ color: AR.dark }}>
              {t("vitrine.craftStory.heading", { defaultValue: "Crafted with Passion" })}
            </h2>
            <p className="text-base leading-relaxed mb-8" style={{ color: AR.muted }}>
              {t("vitrine.craftStory.text", { defaultValue: "Every product in our collection tells a story of dedication, tradition, and artisanal craftsmanship passed down through generations." })}
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-3 px-8 py-3 rounded-full font-medium text-sm text-white transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: AR.accent }}
            >
              {t("vitrine.craftStory.cta", { defaultValue: "Learn More" })}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — NEWSLETTER
   Cream bg newsletter with terracotta accent
   ══════════════════════════════════════════════════════════════════ */

export function ARNewsletter() {
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
      className={`py-16 md:py-24 ${ARPX}`}
      style={{ backgroundColor: AR.dark }}
    >
      <div className="max-w-2xl mx-auto text-center reveal">
        {/* Decorative */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-8 h-[1px] bg-white/20" />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: AR.accent }} />
          <div className="w-8 h-[1px] bg-white/20" />
        </div>

        <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
          {t("vitrine.newsletter.heading", { defaultValue: "Stay in the Loop" })}
        </h2>
        <p className="text-base mb-10 text-white/50">
          {t("vitrine.newsletter.subtitle", { defaultValue: "Subscribe for exclusive drops, early access, and special offers." })}
        </p>

        {status === "success" ? (
          <p className="text-lg font-medium" style={{ color: AR.accent }}>
            {t("vitrine.newsletter.success", { defaultValue: "You're in! Check your inbox." })}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("vitrine.newsletter.placeholder", { defaultValue: "Enter your email" })}
              className="flex-1 px-5 py-3 text-sm rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
              required
              aria-label={t("vitrine.newsletter.emailLabel", { defaultValue: "Email address" })}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-3 text-sm font-medium rounded-full text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: AR.accent }}
            >
              {status === "loading"
                ? t("vitrine.newsletter.sending", { defaultValue: "Sending..." })
                : t("vitrine.newsletter.cta", { defaultValue: "Subscribe" })}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm mt-4 text-red-400">
            {t("vitrine.newsletter.error", { defaultValue: "Something went wrong. Please try again." })}
          </p>
        )}
      </div>
    </section>
  );
}
