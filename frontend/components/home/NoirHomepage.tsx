"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Star,
  Shield,
  Truck,
  RotateCcw,
  Plus,
  Minus,
  Headphones,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useLandingProduct } from "@/hooks/useLandingProduct";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { Product, Review } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */
const NR = {
  charcoal: "#0A0A0A",
  charcoalLight: "#1A1A1A",
  cream: "#FAF8F5",
  creamDark: "#F0EDE8",
  gold: "#C4A35A",
  goldMuted: "rgba(196, 163, 90, 0.5)",
  textLight: "#E5E2DD",
  textMuted: "#6E6B66",
  textDark: "#2A2520",
} as const;

/* ──────────────────────────── HELPERS ──────────────────────────── */

function getProductImage(
  product: {
    images?: Array<{
      thumbnail?: string;
      medium?: string;
      large?: string;
      original?: string;
    }>;
  },
  size: "thumbnail" | "medium" | "large" | "original" = "large"
): string {
  const img = product.images?.[0];
  if (!img) return "/images/homepage/products/product-1.jpg";
  const src = img[size] || img.large || img.original;
  return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
}

function getAllProductImages(
  product: {
    images?: Array<{
      thumbnail?: string;
      medium?: string;
      large?: string;
      original?: string;
    }>;
  },
  size: "thumbnail" | "medium" | "large" | "original" = "large"
): string[] {
  if (!product.images?.length)
    return ["/images/homepage/products/product-1.jpg"];
  return product.images.map((img) => {
    const src = img[size] || img.large || img.original;
    return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
  });
}

/* ──────────────────────────── SKELETONS ─────────────────────────── */

function NoirHeroSkeleton() {
  return (
    <div
      className="min-h-screen flex items-end justify-center pb-24"
      style={{ backgroundColor: NR.charcoal }}
    >
      <div className="w-full max-w-3xl mx-auto text-center px-6 space-y-6">
        <Skeleton className="h-[1px] w-16 mx-auto bg-neutral-800" />
        <Skeleton className="h-12 w-3/4 mx-auto bg-neutral-800" />
        <Skeleton className="h-5 w-1/2 mx-auto bg-neutral-800" />
      </div>
    </div>
  );
}

function NoirGallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      <div className="md:col-span-2 md:row-span-2">
        <Skeleton className="aspect-square w-full bg-neutral-800" />
      </div>
      <Skeleton className="aspect-square w-full bg-neutral-800" />
      <Skeleton className="aspect-square w-full bg-neutral-800" />
    </div>
  );
}

function NoirPurchaseSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      <Skeleton className="aspect-[4/5] w-full bg-neutral-800" />
      <div className="space-y-6 py-8">
        <Skeleton className="h-8 w-3/4 bg-neutral-800" />
        <Skeleton className="h-6 w-1/4 bg-neutral-800" />
        <Skeleton className="h-12 w-full bg-neutral-800" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — CINEMATIC HERO
   Full-viewport hero with product image background, serif headline
   ══════════════════════════════════════════════════════════════════ */

export function NRCinematicHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, isLoading } = useLandingProduct();

  if (isLoading) {
    return <NoirHeroSkeleton />;
  }

  if (!product) {
    return (
      <section
        ref={sectionRef}
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: NR.charcoal }}
      >
        <p
          className="font-serif text-lg font-light tracking-wide reveal"
          style={{ color: NR.gold }}
        >
          {t("noir.hero.empty", {
            defaultValue: "Select a product to preview",
          })}
        </p>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-end justify-center overflow-hidden"
      style={{ backgroundColor: NR.charcoal }}
    >
      {/* Background product image */}
      <div className="absolute inset-0">
        <Image
          src={getProductImage(product, "large")}
          alt={product.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark gradient overlay from bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${NR.charcoal} 0%, ${NR.charcoal}cc 30%, ${NR.charcoal}66 50%, transparent 100%)`,
          }}
        />
      </div>

      {/* Content at bottom */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center px-6 md:px-16 pb-24 md:pb-32 reveal">
        {/* Gold accent line */}
        <div
          className="w-16 h-[1px] mx-auto mb-8"
          style={{ backgroundColor: NR.gold }}
        />

        {/* Product name */}
        <h1
          className="font-serif text-4xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.1] mb-6"
          style={{ color: NR.cream }}
        >
          {product.name}
        </h1>

        {/* Short description */}
        <p
          className="text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed mb-16"
          style={{ color: NR.textMuted }}
        >
          {product.description.length > 150
            ? `${product.description.slice(0, 150)}...`
            : product.description}
        </p>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-3">
          <span
            className="text-[10px] uppercase tracking-[0.3em] font-light"
            style={{ color: NR.textMuted }}
          >
            {t("noir.hero.scroll", { defaultValue: "Scroll to discover" })}
          </span>
          <ChevronDown
            className="h-4 w-4 animate-bounce motion-reduce:animate-none"
            style={{ color: NR.gold }}
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — BRAND STATEMENT
   Cream background, centered serif italic quote
   ══════════════════════════════════════════════════════════════════ */

export function NRBrandStatement() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product } = useLandingProduct();

  const statement = product
    ? product.description.slice(0, 200) +
      (product.description.length > 200 ? "..." : "")
    : t("noir.brandStatement.placeholder", {
        defaultValue:
          "Where craft meets consciousness. Every detail considered, every material purposeful.",
      });

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.cream }}
    >
      <div className="max-w-3xl mx-auto text-center reveal">
        {/* Top gold divider */}
        <div
          className="w-12 h-[1px] mx-auto mb-12"
          style={{ backgroundColor: NR.gold }}
        />

        {/* Statement text */}
        <blockquote
          className="font-serif text-xl md:text-2xl lg:text-3xl font-light italic leading-relaxed"
          style={{ color: NR.textDark }}
        >
          {statement}
        </blockquote>

        {/* Bottom gold divider */}
        <div
          className="w-12 h-[1px] mx-auto mt-12"
          style={{ backgroundColor: NR.gold }}
        />
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — PRODUCT GALLERY
   Asymmetric editorial image grid, dark background
   ══════════════════════════════════════════════════════════════════ */

export function NRProductGallery() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, isLoading } = useLandingProduct();

  if (isLoading) {
    return (
      <section
        className="py-16 md:py-24 px-6 md:px-16"
        style={{ backgroundColor: NR.charcoal }}
      >
        <div className="max-w-7xl mx-auto">
          <NoirGallerySkeleton />
        </div>
      </section>
    );
  }

  if (!product) return null;

  const images = getAllProductImages(product, "large");

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16"
      style={{ backgroundColor: NR.charcoal }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section label */}
        <p
          className="text-xs uppercase tracking-[0.4em] font-light mb-10 text-center reveal"
          style={{ color: NR.gold }}
        >
          {t("noir.gallery.tagline", { defaultValue: "The Details" })}
        </p>

        {/* Asymmetric grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 reveal">
          {images.map((src, idx) => {
            const isFirst = idx === 0;
            return (
              <div
                key={idx}
                className={cn(
                  "relative overflow-hidden group",
                  isFirst && images.length > 1
                    ? "md:col-span-2 md:row-span-2"
                    : ""
                )}
              >
                <div
                  className={cn(
                    "relative w-full overflow-hidden",
                    isFirst && images.length > 1
                      ? "aspect-square"
                      : "aspect-square"
                  )}
                >
                  <Image
                    src={src}
                    alt={`${product.name} - ${t("noir.gallery.imageAlt", {
                      defaultValue: "detail",
                    })} ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes={
                      isFirst && images.length > 1
                        ? "(max-width: 768px) 100vw, 66vw"
                        : "(max-width: 768px) 100vw, 33vw"
                    }
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — BENEFITS TRIPTYCH
   3 key benefits with icons, cream background
   ══════════════════════════════════════════════════════════════════ */

export function NRBenefitsTriptych() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const benefits = [
    {
      icon: Shield,
      title: t("noir.benefits.quality.title", {
        defaultValue: "Uncompromising Quality",
      }),
      description: t("noir.benefits.quality.description", {
        defaultValue:
          "Every piece is crafted from the finest materials, inspected to meet exacting standards before it reaches you.",
      }),
    },
    {
      icon: Truck,
      title: t("noir.benefits.shipping.title", {
        defaultValue: "Complimentary Shipping",
      }),
      description: t("noir.benefits.shipping.description", {
        defaultValue:
          "Carefully packaged and delivered to your door at no additional cost, anywhere in the country.",
      }),
    },
    {
      icon: RotateCcw,
      title: t("noir.benefits.returns.title", {
        defaultValue: "Effortless Returns",
      }),
      description: t("noir.benefits.returns.description", {
        defaultValue:
          "Not quite right? Return within 30 days for a full refund. No questions, no hassle.",
      }),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.cream }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 reveal">
          {benefits.map((benefit, idx) => {
            const IconComponent = benefit.icon;
            return (
              <div
                key={idx}
                className={cn(
                  "text-center px-6 md:px-8",
                  idx < benefits.length - 1
                    ? "md:border-r"
                    : ""
                )}
                style={{
                  borderColor: idx < benefits.length - 1 ? NR.goldMuted : undefined,
                }}
              >
                <IconComponent
                  className="h-7 w-7 mx-auto mb-5"
                  style={{ color: NR.gold }}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <h3
                  className="font-serif text-lg font-light tracking-wide mb-3"
                  style={{ color: NR.textDark }}
                >
                  {benefit.title}
                </h3>
                <p
                  className="text-sm font-light leading-relaxed"
                  style={{ color: NR.textMuted }}
                >
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — STORY SECTION
   Split layout: image left, text right, cream background
   ══════════════════════════════════════════════════════════════════ */

export function NRStorySection() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product } = useLandingProduct();

  const storyImage = product?.images?.[1]
    ? `${BASE_URL}${product.images[1].large || product.images[1].original || ""}`
    : product
      ? getProductImage(product, "large")
      : "/images/homepage/products/product-1.jpg";

  const storyText = product?.description
    ? product.description
    : t("noir.story.placeholder", {
        defaultValue:
          "Behind every exceptional piece lies a story of dedication, skill, and an unwavering commitment to excellence. Our artisans bring decades of experience to each creation.",
      });

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.cream }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
          {/* Image */}
          <div className="relative reveal">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={storyImage}
                alt={t("noir.story.imageAlt", {
                  defaultValue: "The making of our craft",
                })}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>

          {/* Text */}
          <div className="lg:pl-4 reveal">
            {/* Gold accent */}
            <div
              className="w-12 h-[1px] mb-8"
              style={{ backgroundColor: NR.gold }}
            />

            <p
              className="text-xs uppercase tracking-[0.4em] font-light mb-4"
              style={{ color: NR.gold }}
            >
              {t("noir.story.tagline", { defaultValue: "Our Craft" })}
            </p>

            <h2
              className="font-serif text-3xl md:text-4xl font-light tracking-tight leading-[1.15] mb-8"
              style={{ color: NR.textDark }}
            >
              {t("noir.story.heading", {
                defaultValue: "Made with Intention",
              })}
            </h2>

            <p
              className="text-sm md:text-base font-light leading-[1.9] mb-8"
              style={{ color: NR.textMuted }}
            >
              {storyText}
            </p>

            <Link
              href={product ? `/products/${product.slug}` : "/products"}
              className="inline-flex items-center text-xs uppercase tracking-[0.25em] font-light transition-colors duration-300"
              style={{ color: NR.gold }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = NR.textDark)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = NR.gold)
              }
            >
              {t("noir.story.cta", { defaultValue: "Read more" })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — TESTIMONIALS
   Editorial pull-quotes on dark background
   ══════════════════════════════════════════════════════════════════ */

export function NRTestimonials() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { reviews, isLoading } = useLandingProduct();

  const displayReviews = reviews.slice(0, 3);

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.charcoal }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-14 md:mb-20 reveal">
          <p
            className="text-xs uppercase tracking-[0.4em] font-light mb-4"
            style={{ color: NR.gold }}
          >
            {t("noir.testimonials.tagline", {
              defaultValue: "What They Say",
            })}
          </p>
          <h2
            className="font-serif text-3xl md:text-4xl font-light tracking-tight"
            style={{ color: NR.cream }}
          >
            {t("noir.testimonials.heading", {
              defaultValue: "Voices of Experience",
            })}
          </h2>
          <div
            className="w-12 h-[1px] mx-auto mt-6"
            style={{ backgroundColor: NR.gold }}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-32 w-full bg-neutral-800" />
                <Skeleton className="h-4 w-1/2 bg-neutral-800" />
              </div>
            ))}
          </div>
        ) : displayReviews.length === 0 ? (
          <div className="text-center reveal">
            <p
              className="font-serif text-lg font-light italic"
              style={{ color: NR.textMuted }}
            >
              {t("noir.testimonials.empty", {
                defaultValue: "Be the first to share your experience",
              })}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "grid grid-cols-1 gap-10 md:gap-8 reveal",
              displayReviews.length === 1
                ? "md:grid-cols-1 max-w-2xl mx-auto"
                : displayReviews.length === 2
                  ? "md:grid-cols-2"
                  : "md:grid-cols-3"
            )}
          >
            {displayReviews.map((review) => (
              <article
                key={review.id}
                className="text-center px-4 md:px-6"
              >
                {/* Decorative gold quote mark */}
                <span
                  className="font-serif text-5xl md:text-6xl leading-none block mb-4"
                  style={{ color: NR.gold }}
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Review text */}
                <p
                  className="font-serif text-base md:text-lg font-light italic leading-relaxed mb-6"
                  style={{ color: NR.textLight }}
                >
                  {review.comment.length > 200
                    ? `${review.comment.slice(0, 200)}...`
                    : review.comment}
                </p>

                {/* Star rating */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <span className="sr-only">{review.rating} out of 5 stars</span>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      style={{
                        fill:
                          i < review.rating ? NR.gold : "transparent",
                        color:
                          i < review.rating ? NR.gold : NR.textMuted,
                      }}
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Reviewer name */}
                <p
                  className="text-xs uppercase tracking-[0.2em] font-light"
                  style={{ color: NR.textMuted }}
                >
                  {review.user.name}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — PRODUCT DETAILS (ACCORDION)
   Expandable custom accordion, cream background
   ══════════════════════════════════════════════════════════════════ */

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="border-b"
      style={{ borderColor: NR.creamDark }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between py-5 md:py-6 text-left min-h-[44px]"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span
          className="font-serif text-base md:text-lg font-light tracking-wide"
          style={{ color: NR.textDark }}
        >
          {title}
        </span>
        <span
          className="flex-shrink-0 ml-4 w-6 h-6 flex items-center justify-center"
          style={{ color: NR.gold }}
          aria-hidden="true"
        >
          {isOpen ? (
            <Minus className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          )}
        </span>
      </button>
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isOpen
            ? contentRef.current?.scrollHeight
              ? `${contentRef.current.scrollHeight}px`
              : "1000px"
            : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="pb-6 md:pb-8">{children}</div>
      </div>
    </div>
  );
}

export function NRProductDetails() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product } = useLandingProduct();

  if (!product) return null;

  const attributes = product.attributes || {};
  const hasAttributes = Object.keys(attributes).length > 0;

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.cream }}
    >
      <div className="max-w-3xl mx-auto reveal">
        {/* Section label */}
        <div className="text-center mb-12">
          <p
            className="text-xs uppercase tracking-[0.4em] font-light mb-4"
            style={{ color: NR.gold }}
          >
            {t("noir.details.tagline", {
              defaultValue: "Know Every Detail",
            })}
          </p>
          <h2
            className="font-serif text-3xl md:text-4xl font-light tracking-tight"
            style={{ color: NR.textDark }}
          >
            {t("noir.details.heading", {
              defaultValue: "Product Information",
            })}
          </h2>
          <div
            className="w-12 h-[1px] mx-auto mt-6"
            style={{ backgroundColor: NR.gold }}
          />
        </div>

        {/* Accordion */}
        <div>
          {/* Description */}
          <AccordionItem
            title={t("noir.details.description", {
              defaultValue: "Description",
            })}
            defaultOpen
          >
            <p
              className="text-sm font-light leading-[1.9]"
              style={{ color: NR.textMuted }}
            >
              {product.description}
            </p>
          </AccordionItem>

          {/* Specifications */}
          {hasAttributes && (
            <AccordionItem
              title={t("noir.details.specifications", {
                defaultValue: "Specifications",
              })}
            >
              <dl className="space-y-3">
                {Object.entries(attributes).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-baseline text-sm font-light"
                  >
                    <dt
                      className="capitalize tracking-wide"
                      style={{ color: NR.textDark }}
                    >
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd style={{ color: NR.textMuted }}>
                      {Array.isArray(value)
                        ? value.join(", ")
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </AccordionItem>
          )}

          {/* Shipping & Returns */}
          <AccordionItem
            title={t("noir.details.shippingReturns", {
              defaultValue: "Shipping & Returns",
            })}
          >
            <div className="space-y-4">
              <p
                className="text-sm font-light leading-[1.9]"
                style={{ color: NR.textMuted }}
              >
                {t("noir.details.shippingText", {
                  defaultValue:
                    "We offer complimentary standard shipping on all orders. Express shipping options are available at checkout. Orders are processed within 1-2 business days.",
                })}
              </p>
              <p
                className="text-sm font-light leading-[1.9]"
                style={{ color: NR.textMuted }}
              >
                {t("noir.details.returnsText", {
                  defaultValue:
                    "Items may be returned within 30 days of receipt for a full refund. Products must be in their original condition with all packaging intact.",
                })}
              </p>
            </div>
          </AccordionItem>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 8 — PURCHASE SECTION
   Split layout: image left, purchase form right, dark background
   ══════════════════════════════════════════════════════════════════ */

export function NRPurchaseSection() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const { product, isLoading } = useLandingProduct();
  const isShowcase = useShowcase();
  const { addItem } = useCart();
  const formatPrice = useFormatPrice();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToBag = async () => {
    if (!product || isAdding) return;
    setIsAdding(true);
    try {
      await addItem(product.id, quantity);
    } catch (err) {
      logger.error("NRPurchaseSection: addItem error", err);
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading) {
    return (
      <section
        className="py-20 md:py-32 px-6 md:px-16"
        style={{ backgroundColor: NR.charcoal }}
      >
        <div className="max-w-6xl mx-auto">
          <NoirPurchaseSkeleton />
        </div>
      </section>
    );
  }

  if (!product) return null;

  const hasDiscount =
    product.compareAtPrice !== null &&
    product.compareAtPrice !== undefined &&
    product.compareAtPrice > product.price;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isInStock = product.stock > 0;

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-32 px-6 md:px-16"
      style={{ backgroundColor: NR.charcoal }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center reveal">
          {/* Product image */}
          <div className="relative aspect-[4/5] overflow-hidden">
            <Image
              src={getProductImage(product, "large")}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          {/* Purchase form */}
          <div className="py-4">
            {/* Product name */}
            <h2
              className="font-serif text-2xl md:text-3xl lg:text-4xl font-light tracking-tight leading-[1.15] mb-4"
              style={{ color: NR.cream }}
            >
              {product.name}
            </h2>

            {/* Price */}
            {!isShowcase && (
              <div className="flex items-baseline gap-4 mb-8">
                <span
                  className="text-xl md:text-2xl font-light tracking-wide"
                  style={{ color: NR.cream }}
                >
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <span
                    className="text-base font-light line-through"
                    style={{ color: NR.textMuted }}
                  >
                    {formatPrice(product.compareAtPrice!)}
                  </span>
                )}
              </div>
            )}

            {/* Stock indicator */}
            {!isShowcase && (
              <p
                className="text-xs uppercase tracking-[0.2em] font-light mb-8"
                style={{
                  color: isInStock
                    ? isLowStock
                      ? "#C49A5A"
                      : NR.textMuted
                    : "#8B4513",
                }}
              >
                {isInStock
                  ? isLowStock
                    ? t("noir.purchase.lowStock", {
                        defaultValue: "Low Stock",
                        count: product.stock,
                      })
                    : t("noir.purchase.inStock", {
                        defaultValue: "In Stock",
                      })
                  : t("noir.purchase.outOfStock", {
                      defaultValue: "Out of Stock",
                    })}
              </p>
            )}

            {/* Quantity selector + Add to Bag */}
            {!isShowcase && isInStock && (
              <div className="space-y-6">
                {/* Quantity */}
                <div className="flex items-center gap-1">
                  <span
                    className="text-xs uppercase tracking-[0.2em] font-light mr-4"
                    style={{ color: NR.textMuted }}
                  >
                    {t("noir.purchase.quantity", {
                      defaultValue: "Quantity",
                    })}
                  </span>
                  <button
                    type="button"
                    className="w-11 h-11 flex items-center justify-center border transition-colors duration-300"
                    style={{
                      borderColor: NR.goldMuted,
                      color: NR.textLight,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = NR.gold;
                      e.currentTarget.style.color = NR.gold;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = NR.goldMuted;
                      e.currentTarget.style.color = NR.textLight;
                    }}
                    onClick={() =>
                      setQuantity((q) => Math.max(1, q - 1))
                    }
                    aria-label={t("noir.purchase.decreaseQty", {
                      defaultValue: "Decrease quantity",
                    })}
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <span
                    className="w-14 h-11 flex items-center justify-center text-sm font-light tracking-wide border-t border-b"
                    style={{
                      borderColor: NR.goldMuted,
                      color: NR.cream,
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    className="w-11 h-11 flex items-center justify-center border transition-colors duration-300"
                    style={{
                      borderColor: NR.goldMuted,
                      color: NR.textLight,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = NR.gold;
                      e.currentTarget.style.color = NR.gold;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = NR.goldMuted;
                      e.currentTarget.style.color = NR.textLight;
                    }}
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(product.stock, q + 1)
                      )
                    }
                    aria-label={t("noir.purchase.increaseQty", {
                      defaultValue: "Increase quantity",
                    })}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>

                {/* Add to Bag button */}
                <button
                  type="button"
                  className="w-full py-4 text-xs uppercase tracking-[0.25em] font-light border transition-all duration-500 min-h-[48px] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#C4A35A] focus-visible:ring-offset-2 focus-visible:outline-none"
                  style={{
                    borderColor: NR.gold,
                    color: NR.gold,
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAdding) {
                      e.currentTarget.style.backgroundColor = NR.gold;
                      e.currentTarget.style.color = NR.charcoal;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = NR.gold;
                  }}
                  onClick={handleAddToBag}
                  disabled={isAdding}
                >
                  {isAdding
                    ? t("noir.purchase.adding", {
                        defaultValue: "Adding...",
                      })
                    : t("noir.purchase.addToBag", {
                        defaultValue: "Add to Bag",
                      })}
                </button>
              </div>
            )}

            {/* View full details link */}
            <div className="mt-8 pt-8 border-t" style={{ borderColor: NR.charcoalLight }}>
              <Link
                href={`/products/${product.slug}`}
                className="text-xs uppercase tracking-[0.25em] font-light transition-colors duration-300"
                style={{ color: NR.textMuted }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = NR.gold)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = NR.textMuted)
                }
              >
                {t("noir.purchase.viewDetails", {
                  defaultValue: "View Full Details",
                })}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 9 — TRUST FOOTER
   Guarantee icons row, cream background, slim section
   ══════════════════════════════════════════════════════════════════ */

export function NRTrustFooter() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const guarantees = [
    {
      icon: Truck,
      label: t("noir.trust.shipping", {
        defaultValue: "Free Shipping",
      }),
    },
    {
      icon: Shield,
      label: t("noir.trust.secure", {
        defaultValue: "Secure Checkout",
      }),
    },
    {
      icon: RotateCcw,
      label: t("noir.trust.returns", {
        defaultValue: "Easy Returns",
      }),
    },
    {
      icon: Headphones,
      label: t("noir.trust.support", {
        defaultValue: "24/7 Support",
      }),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-12 md:py-16 px-6 md:px-16"
      style={{ backgroundColor: NR.cream }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Top divider */}
        <div
          className="w-full h-[1px] mb-12 md:mb-16"
          style={{ backgroundColor: NR.creamDark }}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 reveal">
          {guarantees.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center"
              >
                <IconComponent
                  className="h-6 w-6 mb-3"
                  style={{ color: NR.gold }}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span
                  className="text-xs uppercase tracking-[0.15em] font-light"
                  style={{ color: NR.textDark }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom divider */}
        <div
          className="w-full h-[1px] mt-12 md:mt-16"
          style={{ backgroundColor: NR.creamDark }}
        />
      </div>
    </section>
  );
}
