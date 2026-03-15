"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  Star,
  Truck,
  Shield,
  RotateCcw,
  Clock,
  XCircle,
  CheckCircle,
  Sparkles,
  Zap,
  Heart,
  Award,
  ThumbsUp,
  ShoppingCart,
  Package,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useLandingProduct } from "@/hooks/useLandingProduct";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { getPublicFAQsAPI } from "@/services/faq-service";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { FAQ } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */

const SG = {
  white: "#FFFFFF",
  navy: "#1A1A2E",
  navyLight: "#2A2A4E",
  orange: "#E05A2B",
  orangeHover: "#E55A27",
  orangeLight: "#FFF3ED",
  lightGray: "#F8F9FA",
  textDark: "#1A1A2E",
  textMuted: "#6B7280",
  success: "#22C55E",
  danger: "#EF4444",
  starGold: "#FBBF24",
} as const;

/* ──────────────────────────── HELPERS ──────────────────────────── */

function getProductImage(
  product: { images?: Array<{ thumbnail?: string; medium?: string; large?: string; original?: string }> },
  size: "thumbnail" | "medium" | "large" | "original" = "large"
): string {
  const img = product.images?.[0];
  if (!img) return "/images/homepage/products/product-1.jpg";
  const src = img[size] || img.large || img.original;
  return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
}

function useCountdown(targetDate: string | Date | null | undefined) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setIsExpired(true);
      return;
    }
    const target = new Date(targetDate).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setIsExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return { timeLeft, isExpired };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function getStarFill(rating: number, index: number): "full" | "half" | "empty" {
  if (rating >= index + 1) return "full";
  if (rating >= index + 0.5) return "half";
  return "empty";
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = getStarFill(rating, i);
        return (
          <Star
            key={i}
            className={cn(
              fill === "full" && "fill-current",
              fill === "half" && "fill-current opacity-60",
              fill === "empty" && "opacity-30"
            )}
            style={{ color: SG.starGold, width: size, height: size }}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — ANNOUNCEMENT BAR
   Countdown timer banner with urgency messaging
   ══════════════════════════════════════════════════════════════════ */

export function SGAnnouncementBar() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { settings } = useSettings();
  const countdownEnd = settings?.homepage?.promoBanner?.countdownEnd;
  const { timeLeft, isExpired } = useCountdown(countdownEnd);

  return (
    <section
      ref={sectionRef}
      className="w-full py-3 px-4 text-center"
      style={{ backgroundColor: SG.orange }}
      aria-label={t("surge.announcement.label", { defaultValue: "Announcement" })}
    >
      <div className="reveal max-w-7xl mx-auto">
        {!isExpired ? (
          <p className="text-sm md:text-base font-semibold text-white tracking-wide">
            {t("surge.announcement.limitedTime", { defaultValue: "LIMITED TIME OFFER" })}
            <span className="mx-2" aria-hidden="true">
              &mdash;
            </span>
            <span className="sr-only">
              {t("surge.announcement.endsIn", { defaultValue: "ends in" })}
            </span>
            <span className="inline-flex items-center gap-1 font-bold tabular-nums">
              <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.days)}</span>
              <span aria-hidden="true">:</span>
              <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}</span>
              <span aria-hidden="true">:</span>
              <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}</span>
              <span aria-hidden="true">:</span>
              <span className="bg-white/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}</span>
              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes remaining`}
              </span>
            </span>
          </p>
        ) : (
          <p className="text-sm md:text-base font-semibold text-white tracking-wide uppercase">
            {t("surge.announcement.freeShipping", { defaultValue: "Free Shipping on All Orders" })}
          </p>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — HERO WITH CTA
   Split hero with product image + purchase section + sticky mobile bar
   ══════════════════════════════════════════════════════════════════ */

export function SGHeroWithCta() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const heroRef = useRef<HTMLElement>(null);
  const { product, reviews, isLoading, onBuyNow } = useLandingProduct();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Intersection observer for sticky mobile bar
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const avgRating = product?.ratings?.average ?? 0;
  const reviewCount = product?.ratings?.count ?? reviews.length;
  const savings = product?.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  if (isLoading) {
    return (
      <section ref={sectionRef} className="py-12 md:py-20 px-6 md:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </section>
    );
  }

  if (!product) return null;

  return (
    <>
      <section
        ref={(el) => {
          // Merge refs
          (heroRef as React.MutableRefObject<HTMLElement | null>).current = el;
          if (typeof sectionRef === "function") {
            (sectionRef as unknown as (el: HTMLElement | null) => void)(el);
          } else if (sectionRef && "current" in sectionRef) {
            (sectionRef as React.MutableRefObject<HTMLElement | null>).current = el;
          }
        }}
        className="py-12 md:py-20 px-6 md:px-16 lg:px-24 bg-white"
      >
        <div className="reveal max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* LEFT — Product image */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100">
            <Image
              src={getProductImage(product, "large")}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          {/* RIGHT — Purchase info */}
          <div className="flex flex-col gap-5">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <StarRating rating={avgRating} size={18} />
              <span className="text-sm font-medium" style={{ color: SG.textMuted }}>
                {avgRating.toFixed(1)}/5{" "}
                {t("surge.hero.fromReviews", {
                  defaultValue: "from {{count}} reviews",
                  count: reviewCount,
                })}
              </span>
            </div>

            {/* Product name */}
            <h1
              className="text-3xl md:text-5xl font-extrabold leading-tight"
              style={{ color: SG.textDark }}
            >
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg leading-relaxed" style={{ color: SG.textMuted }}>
              {product.description?.substring(0, 150)}
              {(product.description?.length ?? 0) > 150 ? "..." : ""}
            </p>

            {/* Price */}
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-3xl md:text-4xl font-extrabold"
                style={{ color: SG.textDark }}
              >
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span
                    className="text-xl line-through"
                    style={{ color: SG.textMuted }}
                  >
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span
                    className="px-2 py-1 rounded-md text-sm font-bold text-white"
                    style={{ backgroundColor: SG.danger }}
                  >
                    {t("surge.hero.save", { defaultValue: "SAVE {{percent}}%", percent: savings })}
                  </span>
                </>
              )}
            </div>

            {/* CTA Button */}
            {!isShowcase && (
              <button
                type="button"
                onClick={onBuyNow}
                disabled={product.stock <= 0}
                className={cn(
                  "w-full lg:w-auto min-w-[280px] h-14 rounded-xl text-white font-bold text-lg",
                  "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2"
                )}
                style={{ backgroundColor: SG.orange }}
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {product.stock <= 0
                  ? t("surge.hero.outOfStock", { defaultValue: "Out of Stock" })
                  : t("surge.hero.buyNow", { defaultValue: "Buy Now" })}
              </button>
            )}

            {/* Trust badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                { Icon: Truck, label: t("surge.hero.trustFreeShipping", { defaultValue: "Free Shipping" }) },
                { Icon: Shield, label: t("surge.hero.trustSecure", { defaultValue: "Secure Payment" }) },
                { Icon: RotateCcw, label: t("surge.hero.trustReturn", { defaultValue: "Easy Returns" }) },
                { Icon: Clock, label: t("surge.hero.trustFast", { defaultValue: "Fast Delivery" }) },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs font-medium rounded-lg px-3 py-2"
                  style={{ backgroundColor: SG.lightGray, color: SG.textMuted }}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: SG.orange }} aria-hidden="true" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* STICKY MOBILE CTA BAR */}
      {!isShowcase && product && (
        <div
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
            "transition-transform duration-300",
            showStickyBar ? "translate-y-0" : "translate-y-full"
          )}
          style={{ backgroundColor: SG.white, borderTopColor: SG.lightGray }}
          aria-hidden={!showStickyBar}
        >
          <div className="flex items-center gap-3 px-4 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
              <Image
                src={getProductImage(product, "thumbnail")}
                alt={product.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: SG.textDark }}>
                {product.name}
              </p>
              <p className="text-sm font-bold" style={{ color: SG.orange }}>
                {formatPrice(product.price)}
              </p>
            </div>
            <button
              type="button"
              onClick={onBuyNow}
              disabled={product.stock <= 0}
              className="flex-shrink-0 px-5 py-2.5 rounded-lg text-white font-bold text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: SG.orange }}
              tabIndex={showStickyBar ? 0 : -1}
            >
              {t("surge.sticky.buyNow", { defaultValue: "Buy Now" })}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — SOCIAL PROOF BAR
   Scrolling ticker with trust signals
   ══════════════════════════════════════════════════════════════════ */

export function SGSocialProofBar() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, reviews } = useLandingProduct();

  const avgRating = product?.ratings?.average ?? 4.8;
  const reviewCount = product?.ratings?.count ?? reviews.length;

  const items = [
    t("surge.socialProof.rating", {
      defaultValue: "\u2605 {{rating}}/5 from {{count}} reviews",
      rating: avgRating.toFixed(1),
      count: reviewCount,
    }),
    t("surge.socialProof.secure", { defaultValue: "\uD83D\uDD12 Secure Checkout" }),
    t("surge.socialProof.shipping", { defaultValue: "\uD83D\uDE9A Free Shipping" }),
    t("surge.socialProof.guarantee", { defaultValue: "\u2705 30-Day Guarantee" }),
  ];

  // Duplicate for seamless loop
  const marqueeItems = [...items, ...items, ...items];

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden py-4"
      style={{ backgroundColor: SG.lightGray }}
      aria-label={t("surge.socialProof.label", { defaultValue: "Social proof" })}
    >
      <div className="reveal relative">
        <div
          className="sg-marquee-track flex gap-12 whitespace-nowrap"
          style={{
            animation: "sgMarquee 30s linear infinite",
          }}
        >
          {marqueeItems.map((item, i) => (
            <span
              key={i}
              className="text-sm md:text-base font-medium inline-flex items-center gap-2"
              style={{ color: SG.textDark }}
              {...(i >= items.length ? { "aria-hidden": true as const } : {})}
            >
              {item}
              <span className="mx-4" style={{ color: SG.textMuted }} aria-hidden="true">
                |
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style jsx>{`
        @keyframes sgMarquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .sg-marquee-track {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — PROBLEM / SOLUTION
   Pain points vs product benefits
   ══════════════════════════════════════════════════════════════════ */

export function SGProblemSolution() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product } = useLandingProduct();

  const productName = product?.name ?? t("surge.problemSolution.product", { defaultValue: "This Product" });

  const painPoints = [
    t("surge.problemSolution.pain1", { defaultValue: "Wasting money on low-quality alternatives" }),
    t("surge.problemSolution.pain2", { defaultValue: "Frustrating returns and poor customer service" }),
    t("surge.problemSolution.pain3", { defaultValue: "Products that don't match their description" }),
    t("surge.problemSolution.pain4", { defaultValue: "Long shipping times and unreliable delivery" }),
  ];

  const solutions = [
    t("surge.problemSolution.sol1", { defaultValue: "Premium quality that lasts" }),
    t("surge.problemSolution.sol2", { defaultValue: "Hassle-free 30-day returns" }),
    t("surge.problemSolution.sol3", { defaultValue: "Exactly as described, guaranteed" }),
    t("surge.problemSolution.sol4", { defaultValue: "Fast, tracked delivery to your door" }),
  ];

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16 lg:px-24 bg-white">
      <div className="reveal max-w-6xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: SG.textDark }}
        >
          {t("surge.problemSolution.heading", {
            defaultValue: "Why Choose {{name}}?",
            name: productName,
          })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
          {/* LEFT — Pain points */}
          <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "#FEF2F2" }}>
            <h3
              className="text-lg font-bold mb-6 flex items-center gap-2"
              style={{ color: SG.danger }}
            >
              <XCircle className="h-5 w-5" aria-hidden="true" />
              {t("surge.problemSolution.without", {
                defaultValue: "Without {{name}}",
                name: productName,
              })}
            </h3>
            <ul className="space-y-4">
              {painPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <XCircle
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    style={{ color: SG.danger }}
                    aria-hidden="true"
                  />
                  <span className="text-sm md:text-base" style={{ color: SG.textMuted }}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* VS badge (desktop) */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-lg"
              style={{ backgroundColor: SG.navy }}
            >
              VS
            </span>
          </div>

          {/* RIGHT — Solutions */}
          <div className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: "#F0FDF4" }}>
            <h3
              className="text-lg font-bold mb-6 flex items-center gap-2"
              style={{ color: SG.success }}
            >
              <CheckCircle className="h-5 w-5" aria-hidden="true" />
              {t("surge.problemSolution.with", {
                defaultValue: "With {{name}}",
                name: productName,
              })}
            </h3>
            <ul className="space-y-4">
              {solutions.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle
                    className="h-5 w-5 flex-shrink-0 mt-0.5"
                    style={{ color: SG.success }}
                    aria-hidden="true"
                  />
                  <span className="text-sm md:text-base" style={{ color: SG.textDark }}>
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — VIDEO DEMO
   Product video or image showcase on dark background
   ══════════════════════════════════════════════════════════════════ */

export function SGVideoDemo() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, isLoading } = useLandingProduct();

  if (isLoading) {
    return (
      <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16 lg:px-24" style={{ backgroundColor: SG.navy }}>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-64 mx-auto mb-8 bg-white/10" />
          <Skeleton className="aspect-video w-full rounded-2xl bg-white/10" />
        </div>
      </section>
    );
  }

  if (!product) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16 lg:px-24"
      style={{ backgroundColor: SG.navy }}
    >
      <div className="reveal max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-extrabold text-center text-white mb-10">
          {t("surge.video.heading", { defaultValue: "See It In Action" })}
        </h2>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/20">
          <Image
            src={getProductImage(product, "large")}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 800px"
          />
          {/* Decorative play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm"
              aria-hidden="true"
            >
              <div
                className="w-0 h-0 ml-1"
                style={{
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderLeft: `20px solid ${SG.white}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — BENEFITS CAROUSEL
   Horizontal swipeable benefit cards
   ══════════════════════════════════════════════════════════════════ */

export function SGBenefitsCarousel() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const benefits = [
    {
      Icon: Sparkles,
      title: t("surge.benefits.quality.title", { defaultValue: "Premium Quality" }),
      desc: t("surge.benefits.quality.desc", { defaultValue: "Crafted with the finest materials for lasting durability" }),
    },
    {
      Icon: Shield,
      title: t("surge.benefits.warranty.title", { defaultValue: "Guaranteed Satisfaction" }),
      desc: t("surge.benefits.warranty.desc", { defaultValue: "30-day money-back guarantee, no questions asked" }),
    },
    {
      Icon: Zap,
      title: t("surge.benefits.fast.title", { defaultValue: "Lightning Fast" }),
      desc: t("surge.benefits.fast.desc", { defaultValue: "Quick setup and immediate results from day one" }),
    },
    {
      Icon: Heart,
      title: t("surge.benefits.loved.title", { defaultValue: "Customer Favorite" }),
      desc: t("surge.benefits.loved.desc", { defaultValue: "Loved by thousands of satisfied customers worldwide" }),
    },
    {
      Icon: Award,
      title: t("surge.benefits.award.title", { defaultValue: "Award Winning" }),
      desc: t("surge.benefits.award.desc", { defaultValue: "Recognized for excellence in design and performance" }),
    },
    {
      Icon: ThumbsUp,
      title: t("surge.benefits.easy.title", { defaultValue: "Easy to Use" }),
      desc: t("surge.benefits.easy.desc", { defaultValue: "Simple and intuitive — works right out of the box" }),
    },
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollLeft = el.scrollLeft;
      const cardWidth = 280 + 16; // min-w + gap
      const idx = Math.round(scrollLeft / cardWidth);
      setActiveIndex(Math.min(idx, benefits.length - 1));
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [benefits.length]);

  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-white">
      <div className="reveal max-w-7xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-extrabold text-center mb-10 px-6"
          style={{ color: SG.textDark }}
        >
          {t("surge.benefits.heading", { defaultValue: "Why You'll Love It" })}
        </h2>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-6 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {benefits.map(({ Icon, title, desc }, i) => (
            <div
              key={i}
              className="snap-start flex-shrink-0 min-w-[280px] max-w-[320px] rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              style={{ backgroundColor: SG.white }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: SG.orangeLight }}
              >
                <Icon className="h-6 w-6" style={{ color: SG.orange }} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: SG.textDark }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: SG.textMuted }}>
                {desc}
              </p>
            </div>
          ))}
        </div>

        {/* Scroll indicators */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {benefits.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                el.scrollTo({ left: i * (280 + 16), behavior: "smooth" });
              }}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={t("surge.benefits.goToSlide", {
                defaultValue: "Go to slide {{index}}",
                index: i + 1,
              })}
            >
              <span
                className={cn(
                  "block w-3 h-3 rounded-full transition-all duration-200",
                  i === activeIndex ? "w-6" : "opacity-40"
                )}
                style={{ backgroundColor: i === activeIndex ? SG.orange : SG.textMuted }}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — COMPARISON TABLE
   Before/After comparison
   ══════════════════════════════════════════════════════════════════ */

export function SGComparison() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product } = useLandingProduct();

  const productName = product?.name ?? t("surge.comparison.ourProduct", { defaultValue: "Our Product" });

  const features = [
    {
      label: t("surge.comparison.feature1", { defaultValue: "Premium Materials" }),
      standard: false,
      ours: true,
    },
    {
      label: t("surge.comparison.feature2", { defaultValue: "Free Shipping" }),
      standard: false,
      ours: true,
    },
    {
      label: t("surge.comparison.feature3", { defaultValue: "Money-Back Guarantee" }),
      standard: false,
      ours: true,
    },
    {
      label: t("surge.comparison.feature4", { defaultValue: "Fast Delivery" }),
      standard: true,
      ours: true,
    },
    {
      label: t("surge.comparison.feature5", { defaultValue: "Customer Support" }),
      standard: true,
      ours: true,
    },
    {
      label: t("surge.comparison.feature6", { defaultValue: "Verified Reviews" }),
      standard: false,
      ours: true,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16 lg:px-24"
      style={{ backgroundColor: SG.lightGray }}
    >
      <div className="reveal max-w-4xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: SG.textDark }}
        >
          {t("surge.comparison.heading", { defaultValue: "See the Difference" })}
        </h2>

        {/* Desktop table */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-4 text-sm font-semibold" style={{ color: SG.textMuted }}>
                  {t("surge.comparison.feature", { defaultValue: "Feature" })}
                </th>
                <th className="text-center p-4 text-sm font-semibold" style={{ color: SG.textMuted }}>
                  {t("surge.comparison.standard", { defaultValue: "Standard Product" })}
                </th>
                <th
                  className="text-center p-4 text-sm font-bold text-white"
                  style={{ backgroundColor: SG.orange }}
                >
                  {productName}
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map(({ label, standard, ours }, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white" : ""}
                  style={i % 2 !== 0 ? { backgroundColor: SG.lightGray } : undefined}
                >
                  <td className="p-4 text-sm font-medium" style={{ color: SG.textDark }}>
                    {label}
                  </td>
                  <td className="p-4 text-center">
                    {standard ? (
                      <CheckCircle className="h-5 w-5 mx-auto" style={{ color: SG.success }} aria-label={t("surge.comparison.yes", { defaultValue: "Yes" })} />
                    ) : (
                      <XCircle className="h-5 w-5 mx-auto" style={{ color: SG.danger }} aria-label={t("surge.comparison.no", { defaultValue: "No" })} />
                    )}
                  </td>
                  <td
                    className="p-4 text-center"
                    style={{ borderLeft: `3px solid ${SG.orange}` }}
                  >
                    {ours ? (
                      <CheckCircle className="h-5 w-5 mx-auto" style={{ color: SG.success }} aria-label={t("surge.comparison.yes", { defaultValue: "Yes" })} />
                    ) : (
                      <XCircle className="h-5 w-5 mx-auto" style={{ color: SG.danger }} aria-label={t("surge.comparison.no", { defaultValue: "No" })} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-4">
          {/* Standard product card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-base font-bold mb-4" style={{ color: SG.textMuted }}>
              {t("surge.comparison.standard", { defaultValue: "Standard Product" })}
            </h3>
            <ul className="space-y-3">
              {features.map(({ label, standard }, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: SG.textDark }}>
                  {standard ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: SG.success }} aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: SG.danger }} aria-hidden="true" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Our product card */}
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: SG.orangeLight, border: `2px solid ${SG.orange}` }}
          >
            <h3 className="text-base font-bold mb-4" style={{ color: SG.orange }}>
              {productName}
            </h3>
            <ul className="space-y-3">
              {features.map(({ label, ours }, i) => (
                <li key={i} className="flex items-center gap-3 text-sm" style={{ color: SG.textDark }}>
                  {ours ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0" style={{ color: SG.success }} aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 flex-shrink-0" style={{ color: SG.danger }} aria-hidden="true" />
                  )}
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 8 — TESTIMONIALS GRID
   Review cards in a responsive grid
   ══════════════════════════════════════════════════════════════════ */

export function SGTestimonialsGrid() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, reviews } = useLandingProduct();

  const avgRating = product?.ratings?.average ?? 0;

  const placeholderReviews = [
    {
      id: "ph-1",
      user: { id: "u1", name: t("surge.testimonials.ph1Name", { defaultValue: "Sarah M." }), avatar: null },
      rating: 5,
      title: "",
      comment: t("surge.testimonials.ph1Comment", {
        defaultValue: "Absolutely love this product! The quality exceeded my expectations. Would definitely buy again.",
      }),
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ph-2",
      user: { id: "u2", name: t("surge.testimonials.ph2Name", { defaultValue: "James K." }), avatar: null },
      rating: 5,
      title: "",
      comment: t("surge.testimonials.ph2Comment", {
        defaultValue: "Fast shipping and the product is exactly as described. Very happy with my purchase.",
      }),
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ph-3",
      user: { id: "u3", name: t("surge.testimonials.ph3Name", { defaultValue: "Emily R." }), avatar: null },
      rating: 4,
      title: "",
      comment: t("surge.testimonials.ph3Comment", {
        defaultValue: "Great value for money. The customer service team was also very helpful when I had a question.",
      }),
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const displayReviews = reviews.length > 0 ? reviews.slice(0, 6) : placeholderReviews;

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16 lg:px-24 bg-white">
      <div className="reveal max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-3" style={{ color: SG.textDark }}>
            {t("surge.testimonials.heading", { defaultValue: "What Our Customers Say" })}
          </h2>
          {avgRating > 0 && (
            <div className="flex items-center justify-center gap-2">
              <StarRating rating={avgRating} size={20} />
              <span className="text-base font-semibold" style={{ color: SG.textDark }}>
                {avgRating.toFixed(1)}/5
              </span>
            </div>
          )}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayReviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: SG.white }}
            >
              {/* Reviewer */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: SG.navy }}
                >
                  {review.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: SG.textDark }}>
                    {review.user.name}
                  </p>
                  {review.isVerified && (
                    <p className="text-xs font-medium" style={{ color: SG.success }}>
                      {t("surge.testimonials.verified", { defaultValue: "Verified Purchase" })}
                    </p>
                  )}
                </div>
              </div>

              {/* Stars */}
              <div className="mb-3">
                <StarRating rating={review.rating} size={14} />
              </div>

              {/* Comment */}
              <p className="text-sm leading-relaxed" style={{ color: SG.textMuted }}>
                &ldquo;{review.comment.substring(0, 150)}
                {review.comment.length > 150 ? "..." : ""}&rdquo;
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 9 — MID-PAGE CTA
   Compact repeat purchase section
   ══════════════════════════════════════════════════════════════════ */

export function SGMidPageCta() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, onBuyNow } = useLandingProduct();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();

  if (!product) return null;

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-20 px-6 md:px-16 lg:px-24"
      style={{ backgroundColor: SG.navy }}
    >
      <div className="reveal max-w-3xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
          {product.name}
        </h2>
        <p className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: SG.orange }}>
          {formatPrice(product.price)}
        </p>
        <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
          {t("surge.midCta.happy", { defaultValue: "Join 10,000+ happy customers" })}
        </p>

        {!isShowcase && (
          <button
            type="button"
            onClick={onBuyNow}
            disabled={product.stock <= 0}
            className={cn(
              "px-10 py-4 rounded-xl text-white font-bold text-lg",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "inline-flex items-center gap-2"
            )}
            style={{ backgroundColor: SG.orange }}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {t("surge.midCta.cta", { defaultValue: "Buy Now" })}
          </button>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 10 — HOW IT WORKS
   3-step guide with connecting line
   ══════════════════════════════════════════════════════════════════ */

export function SGHowItWorks() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const steps = [
    {
      num: 1,
      Icon: ShoppingCart,
      title: t("surge.howItWorks.step1Title", { defaultValue: "Order" }),
      desc: t("surge.howItWorks.step1Desc", {
        defaultValue: "Choose your product and place your order",
      }),
    },
    {
      num: 2,
      Icon: Package,
      title: t("surge.howItWorks.step2Title", { defaultValue: "Receive" }),
      desc: t("surge.howItWorks.step2Desc", {
        defaultValue: "Fast delivery right to your door",
      }),
    },
    {
      num: 3,
      Icon: Heart,
      title: t("surge.howItWorks.step3Title", { defaultValue: "Enjoy" }),
      desc: t("surge.howItWorks.step3Desc", {
        defaultValue: "Experience the difference",
      }),
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 md:py-24 px-6 md:px-16 lg:px-24 bg-white">
      <div className="reveal max-w-5xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-extrabold text-center mb-14"
          style={{ color: SG.textDark }}
        >
          {t("surge.howItWorks.heading", { defaultValue: "How It Works" })}
        </h2>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Connecting line (desktop) */}
          <div
            className="hidden md:block absolute top-10 left-[16.66%] right-[16.66%] h-0.5"
            style={{ backgroundColor: SG.orange, opacity: 0.3 }}
            aria-hidden="true"
          />

          {steps.map(({ num, Icon, title, desc }) => (
            <div key={num} className="relative flex flex-col items-center text-center">
              {/* Numbered circle */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5 relative z-10"
                style={{ backgroundColor: SG.orangeLight }}
              >
                <span
                  className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                  style={{ backgroundColor: SG.orange }}
                >
                  {num}
                </span>
                <Icon className="h-8 w-8" style={{ color: SG.orange }} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: SG.textDark }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed max-w-[240px]" style={{ color: SG.textMuted }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 11 — FAQ ACCORDION
   Expandable frequently asked questions
   ══════════════════════════════════════════════════════════════════ */

export function SGFaqSection() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getPublicFAQsAPI()
      .then((res) => {
        if (res.success && res.data.length > 0) {
          setFaqs(res.data);
        }
      })
      .catch((err) => {
        logger.error("SGFaqSection fetch error:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const defaultFaqs = [
    {
      id: "d1",
      question: t("surge.faq.q1", { defaultValue: "What is your return policy?" }),
      answer: t("surge.faq.a1", {
        defaultValue:
          "We offer a 30-day money-back guarantee. If you are not satisfied with your purchase, you can return it for a full refund within 30 days of delivery.",
      }),
    },
    {
      id: "d2",
      question: t("surge.faq.q2", { defaultValue: "How long does shipping take?" }),
      answer: t("surge.faq.a2", {
        defaultValue:
          "Standard shipping takes 3-7 business days. Express shipping options are also available at checkout for faster delivery.",
      }),
    },
    {
      id: "d3",
      question: t("surge.faq.q3", { defaultValue: "Is the payment secure?" }),
      answer: t("surge.faq.a3", {
        defaultValue:
          "Yes, we use secure checkout processes to protect your information. You can also choose Cash on Delivery as a payment method.",
      }),
    },
    {
      id: "d4",
      question: t("surge.faq.q4", { defaultValue: "Do you offer customer support?" }),
      answer: t("surge.faq.a4", {
        defaultValue:
          "Absolutely! Our customer support team is available via email and phone. We typically respond within 24 hours.",
      }),
    },
  ];

  const displayFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16 lg:px-24"
      style={{ backgroundColor: SG.lightGray }}
    >
      <div className="reveal max-w-3xl mx-auto">
        <h2
          className="text-2xl md:text-4xl font-extrabold text-center mb-12"
          style={{ color: SG.textDark }}
        >
          {t("surge.faq.heading", { defaultValue: "Frequently Asked Questions" })}
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayFaqs.map((faq) => {
              const isOpen = expandedId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggle(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left min-h-[56px]"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm md:text-base font-semibold pr-4" style={{ color: SG.textDark }}>
                      {faq.question}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: SG.textMuted }} aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: SG.textMuted }} aria-hidden="true" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <p className="text-sm leading-relaxed" style={{ color: SG.textMuted }}>
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 12 — FINAL CTA
   Urgency-driven last call to action with countdown + stock
   ══════════════════════════════════════════════════════════════════ */

export function SGFinalCta() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, onBuyNow } = useLandingProduct();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const { settings } = useSettings();
  const countdownEnd = settings?.homepage?.promoBanner?.countdownEnd;
  const { timeLeft, isExpired } = useCountdown(countdownEnd);

  if (!product) return null;

  const stockPercent = Math.min(Math.max((product.stock / 50) * 100, 5), 100);

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16 lg:px-24"
      style={{ backgroundColor: SG.navy }}
    >
      <div className="reveal max-w-2xl mx-auto text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-8">
          {t("surge.finalCta.heading", { defaultValue: "Don't Miss Out" })}
        </h2>

        {/* Countdown */}
        {!isExpired && (
          <div className="flex items-center justify-center gap-3 mb-8">
            {[
              { value: timeLeft.days, label: t("surge.finalCta.days", { defaultValue: "Days" }) },
              { value: timeLeft.hours, label: t("surge.finalCta.hours", { defaultValue: "Hours" }) },
              { value: timeLeft.minutes, label: t("surge.finalCta.mins", { defaultValue: "Mins" }) },
              { value: timeLeft.seconds, label: t("surge.finalCta.secs", { defaultValue: "Secs" }) },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-extrabold text-white tabular-nums"
                  style={{ backgroundColor: SG.navyLight }}
                >
                  {pad(value)}
                </span>
                <span className="text-xs mt-1.5 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {label}
                </span>
              </div>
            ))}
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {`${timeLeft.days} days, ${timeLeft.hours} hours, ${timeLeft.minutes} minutes remaining`}
            </span>
          </div>
        )}

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= 50 && (
          <div className="mb-6">
            <p className="text-sm font-bold mb-2" style={{ color: SG.danger }}>
              {t("surge.finalCta.onlyLeft", {
                defaultValue: "Only {{count}} left in stock!",
                count: product.stock,
              })}
            </p>
            <div className="w-full max-w-xs mx-auto h-2 rounded-full overflow-hidden" style={{ backgroundColor: SG.navyLight }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stockPercent}%`,
                  backgroundColor: SG.orange,
                }}
              />
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xl line-through" style={{ color: "rgba(255,255,255,0.4)" }}>
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-3xl md:text-4xl font-extrabold" style={{ color: SG.orange }}>
            {formatPrice(product.price)}
          </span>
        </div>

        {/* CTA */}
        {!isShowcase && (
          <button
            type="button"
            onClick={onBuyNow}
            disabled={product.stock <= 0}
            className={cn(
              "px-12 py-4 rounded-xl text-white font-bold text-lg",
              "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "inline-flex items-center gap-2"
            )}
            style={{ backgroundColor: SG.orange }}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {t("surge.finalCta.cta", { defaultValue: "Order Now" })}
          </button>
        )}

        {/* Guarantee */}
        <p className="mt-6 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          <Shield className="inline-block h-4 w-4 mr-1 -mt-0.5" aria-hidden="true" />
          {t("surge.finalCta.guarantee", { defaultValue: "30-Day Money-Back Guarantee" })}
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 13 — GUARANTEE BADGE
   Money-back guarantee seal
   ══════════════════════════════════════════════════════════════════ */

export function SGGuaranteeBadge() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className="py-16 md:py-20 px-6 md:px-16 lg:px-24 bg-white">
      <div className="reveal max-w-xl mx-auto text-center">
        <div
          className="rounded-2xl border-2 p-8 md:p-12"
          style={{ borderColor: SG.success, backgroundColor: "#F0FDF4" }}
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: "rgba(34, 197, 94, 0.15)" }}
          >
            <Shield className="h-10 w-10" style={{ color: SG.success }} aria-hidden="true" />
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold mb-3" style={{ color: SG.textDark }}>
            {t("surge.guarantee.heading", { defaultValue: "30-Day Money-Back Guarantee" })}
          </h2>

          <p className="text-sm md:text-base leading-relaxed" style={{ color: SG.textMuted }}>
            {t("surge.guarantee.description", {
              defaultValue:
                "If you're not 100% satisfied, return it for a full refund. No questions asked.",
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
