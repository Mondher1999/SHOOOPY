"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/logger";
import type { Product, Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */
const B = {
  dark: "#0F0F0F",
  accent: "#FF3C00",
  white: "#FFFFFF",
  grey: "#8A8A8A",
  light: "#F7F7F7",
  darkGrey: "#1A1A1A",
} as const;

const BPX = "px-6 md:px-16 lg:px-24";

/* ──────────────────────────── HELPERS ──────────────────────────── */

function formatPrice(price: number): string {
  return `${price.toLocaleString()} DT`;
}

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

/* ──────────────────────────── SKELETON ─────────────────────────── */

function BoldProductSkeleton() {
  return (
    <div className="bg-white rounded-none overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

function BoldCategorySkeleton() {
  return (
    <div className="relative overflow-hidden">
      <Skeleton className="aspect-[4/5] w-full" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Full-screen dark hero with oversized bold headline
   ══════════════════════════════════════════════════════════════════ */

export function BDHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: B.dark }}
    >
      {/* Background image with dark overlay */}
      <div className="absolute inset-0">
        <Image
          src="/images/homepage/hero/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-40"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center max-w-5xl mx-auto ${BPX} py-20 reveal`}>
        {/* Tagline */}
        <p
          className="text-sm md:text-base font-bold uppercase tracking-[0.3em] mb-6"
          style={{ color: B.accent }}
        >
          {t("vitrine.hero.tagline", { defaultValue: "New Collection 2025" })}
        </p>

        {/* Main headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold uppercase tracking-tight leading-[0.9] mb-8 text-white">
          {t("vitrine.hero.heading", { defaultValue: "Redefine Your Style" })}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-12" style={{ color: B.grey }}>
          {t("vitrine.hero.subtitle", { defaultValue: "Discover bold products built for those who stand out. Premium quality, unmatched design." })}
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm transition-all duration-300 hover:scale-105"
            style={{ backgroundColor: B.accent, color: B.white }}
          >
            {t("vitrine.hero.cta", { defaultValue: "Shop Now" })}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm border-2 border-white text-white transition-all duration-300 hover:bg-white hover:text-black"
          >
            {t("vitrine.hero.ctaSecondary", { defaultValue: "Explore Categories" })}
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/60 rounded-full" />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — CATEGORIES
   Bold category cards with dark overlay and uppercase labels
   ══════════════════════════════════════════════════════════════════ */

export function BDCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories?limit=6&isActive=true")
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 6));
      })
      .catch((err) => logger.error("BDCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${BPX}`} style={{ backgroundColor: B.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight" style={{ color: B.dark }}>
            {t("vitrine.categories.heading", { defaultValue: "Shop by Category" })}
          </h2>
          <div className="w-16 h-1 mx-auto mt-4" style={{ backgroundColor: B.accent }} />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 reveal-stagger">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <BoldCategorySkeleton key={i} />)
            : categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group relative aspect-[4/5] overflow-hidden cursor-pointer"
                >
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/90" />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                    <h3 className="text-lg md:text-2xl font-bold uppercase tracking-wider text-white">
                      {cat.name}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 text-xs md:text-sm font-bold uppercase tracking-wider mt-2 transition-all group-hover:gap-3"
                      style={{ color: B.accent }}
                    >
                      {t("vitrine.categories.explore", { defaultValue: "Explore" })}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
   Bold product grid with strong hover and pricing
   ══════════════════════════════════════════════════════════════════ */

export function BDFeaturedProducts() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=bestseller&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("BDFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${BPX}`} style={{ backgroundColor: B.light }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 reveal">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: B.accent }}>
              {t("vitrine.featured.tagline", { defaultValue: "Top Picks" })}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight" style={{ color: B.dark }}>
              {t("vitrine.featured.heading", { defaultValue: "Best Sellers" })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors hover:opacity-70"
            style={{ color: B.dark }}
          >
            {t("vitrine.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <BoldProductSkeleton key={i} />)
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
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
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
                          className="absolute top-3 left-3 px-3 py-1 text-xs font-bold uppercase text-white"
                          style={{ backgroundColor: B.accent }}
                        >
                          -{discountPercent}%
                        </span>
                      )}
                      {/* Quick add on hover */}
                      {!isShowcase && product.stock > 0 && (
                        <button
                          type="button"
                          className="absolute bottom-0 left-0 right-0 py-3 text-xs font-bold uppercase tracking-wider text-white text-center transition-all translate-y-full group-hover:translate-y-0"
                          style={{ backgroundColor: B.dark }}
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
                    <h3 className="text-sm font-medium line-clamp-1 mb-1" style={{ color: B.dark }}>
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: B.dark }}>
                          {formatPrice(product.price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs line-through" style={{ color: B.grey }}>
                            {formatPrice(product.compareAtPrice!)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Rating */}
                    {product.ratings.count > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                        <span className="text-xs" style={{ color: B.grey }}>
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
   Full-width dark banner with vibrant accent CTA
   ══════════════════════════════════════════════════════════════════ */

export function BDPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ backgroundColor: B.dark }}
    >
      {/* Diagonal accent line */}
      <div
        className="absolute top-0 right-0 w-1/3 h-full opacity-10 -skew-x-12 translate-x-1/4"
        style={{ backgroundColor: B.accent }}
      />

      <div className={`relative z-10 max-w-4xl mx-auto text-center ${BPX} reveal`}>
        <p
          className="text-sm font-bold uppercase tracking-[0.3em] mb-4"
          style={{ color: B.accent }}
        >
          {t("vitrine.promo.tagline", { defaultValue: "Limited Time Offer" })}
        </p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.9] text-white mb-6">
          {t("vitrine.promo.heading", { defaultValue: "Up to 50% Off" })}
        </h2>
        <p className="text-base md:text-lg max-w-xl mx-auto mb-10" style={{ color: B.grey }}>
          {t("vitrine.promo.subtitle", { defaultValue: "Don't miss out on our biggest sale of the season. Premium products at unbeatable prices." })}
        </p>
        <Link
          href="/products?sale=true"
          className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm text-white transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: B.accent }}
        >
          {t("vitrine.promo.cta", { defaultValue: "Shop the Sale" })}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — NEW ARRIVALS
   Latest products with "NEW" badge
   ══════════════════════════════════════════════════════════════════ */

export function BDNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=newest&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("BDNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${BPX}`} style={{ backgroundColor: B.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] mb-2" style={{ color: B.accent }}>
              {t("vitrine.newArrivals.tagline", { defaultValue: "Just Dropped" })}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight" style={{ color: B.dark }}>
              {t("vitrine.newArrivals.heading", { defaultValue: "New Arrivals" })}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 border border-gray-300 transition-colors hover:bg-black hover:text-white hover:border-black"
              aria-label={t("vitrine.newArrivals.prev", { defaultValue: "Previous" })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 border border-gray-300 transition-colors hover:bg-black hover:text-white hover:border-black"
              aria-label={t("vitrine.newArrivals.next", { defaultValue: "Next" })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[260px] md:min-w-[300px] snap-start">
                  <BoldProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[260px] md:min-w-[300px] snap-start cursor-pointer flex-shrink-0"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-4">
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="300px"
                    />
                    <span
                      className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: B.accent }}
                    >
                      {t("vitrine.newArrivals.badge", { defaultValue: "New" })}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium line-clamp-1 mb-1" style={{ color: B.dark }}>
                    {product.name}
                  </h3>
                  {!isShowcase && (
                    <span className="text-sm font-bold" style={{ color: B.dark }}>
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
   SECTION 6 — SOCIAL PROOF
   Animated stats bar (orders, customers, products)
   ══════════════════════════════════════════════════════════════════ */

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function BDSocialProof() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const stats = [
    { value: 5000, suffix: "+", label: t("vitrine.socialProof.ordersDelivered", { defaultValue: "Orders Delivered" }) },
    { value: 3200, suffix: "+", label: t("vitrine.socialProof.happyCustomers", { defaultValue: "Happy Customers" }) },
    { value: 500, suffix: "+", label: t("vitrine.socialProof.products", { defaultValue: "Products" }) },
    { value: 98, suffix: "%", label: t("vitrine.socialProof.satisfaction", { defaultValue: "Satisfaction Rate" }) },
  ];

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-28 ${BPX}`}
      style={{ backgroundColor: B.dark }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center reveal-stagger">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-xs md:text-sm font-bold uppercase tracking-[0.15em]" style={{ color: B.grey }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — NEWSLETTER
   Dark newsletter with vibrant accent button
   ══════════════════════════════════════════════════════════════════ */

export function BDNewsletter() {
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
      className={`py-20 md:py-32 ${BPX}`}
      style={{ backgroundColor: B.darkGrey }}
    >
      <div className="max-w-2xl mx-auto text-center reveal">
        <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight text-white mb-4">
          {t("vitrine.newsletter.heading", { defaultValue: "Stay in the Loop" })}
        </h2>
        <p className="text-base mb-10" style={{ color: B.grey }}>
          {t("vitrine.newsletter.subtitle", { defaultValue: "Subscribe for exclusive drops, early access, and special offers." })}
        </p>

        {status === "success" ? (
          <p className="text-lg font-bold" style={{ color: B.accent }}>
            {t("vitrine.newsletter.success", { defaultValue: "You're in! Check your inbox." })}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("vitrine.newsletter.placeholder", { defaultValue: "Enter your email" })}
              className="flex-1 px-5 py-4 text-sm bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/50 transition-colors"
              required
              aria-label={t("vitrine.newsletter.emailLabel", { defaultValue: "Email address" })}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: B.accent }}
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
