"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";
import { fetchAPI } from "@/lib/api";
import type { TestimonialItem } from "@/types";

const DEFAULT_TESTIMONIAL_KEYS = [
  {
    quoteKey: "landing.testimonials.quote1",
    nameKey: "landing.testimonials.name1",
    locationKey: "landing.testimonials.location1",
    rating: 5,
  },
  {
    quoteKey: "landing.testimonials.quote2",
    nameKey: "landing.testimonials.name2",
    locationKey: "landing.testimonials.location2",
    rating: 5,
  },
  {
    quoteKey: "landing.testimonials.quote3",
    nameKey: "landing.testimonials.name3",
    locationKey: "landing.testimonials.location3",
    rating: 5,
  },
];

export function Testimonials() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [autoItems, setAutoItems] = useState<TestimonialItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const ts = settings?.homepage?.testimonials;
  const title = ts?.title || t("landing.testimonials.heading");
  const mode = ts?.mode || "manual";
  const manualItems = ts?.items || [];

  useEffect(() => {
    if (mode === "auto") {
      fetchAPI<{ success: true; data: TestimonialItem[] }>("/api/settings/top-reviews")
        .then((res) => setAutoItems(res.data))
        .catch(() => setAutoItems([]));
    }
  }, [mode]);

  const hasManualItems = mode === "manual" && manualItems.length > 0;
  const hasAutoItems = mode === "auto" && autoItems.length > 0;

  // Build unified items array
  const items: Array<{ quote: string; name: string; location?: string; rating: number }> =
    hasManualItems
      ? manualItems
      : hasAutoItems
      ? autoItems
      : DEFAULT_TESTIMONIAL_KEYS.map((d) => ({
          quote: t(d.quoteKey),
          name: t(d.nameKey),
          location: t(d.locationKey),
          rating: d.rating,
        }));

  const totalItems = items.length;

  const goTo = useCallback(
    (idx: number) => {
      setCurrentIdx(Math.max(0, Math.min(idx, totalItems - 1)));
    },
    [totalItems]
  );

  const current = items[currentIdx];
  if (!current) return null;

  const rating = Math.min(5, Math.max(1, current.rating || 5));

  return (
    <section
      ref={sectionRef}
      aria-labelledby="testimonials-heading"
      className="bg-white py-16 md:py-24 px-8 md:px-[100px]"
    >
      <div className="max-w-[1200px] mx-auto">
        <h2 id="testimonials-heading" className="sr-only">
          {title}
        </h2>

        {/* Single testimonial card */}
        <div className="rounded-2xl border border-gray-200 px-8 md:px-16 py-14 text-center">
          <p className="text-base font-semibold text-gray-900 mb-2">{current.name}</p>
          <div className="flex justify-center gap-1 mb-6" aria-label={`${rating} out of 5 stars`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? "text-amber-400" : "text-gray-200"}`}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden="true"
              />
            ))}
          </div>
          <blockquote className="text-base md:text-lg text-gray-700 italic leading-relaxed max-w-3xl mx-auto">
            &ldquo;{current.quote}&rdquo;
          </blockquote>
        </div>

        {/* Carousel pagination */}
        <div
          className="flex items-center justify-center gap-3 mt-8"
          role="tablist"
          aria-label={title}
        >
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
            aria-label={t("landing.hero.prevSlide")}
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.max(totalItems, 2) }).map((_, i) => (
              <button
                key={i}
                onClick={() => i < totalItems && goTo(i)}
                disabled={i >= totalItems}
                role="tab"
                aria-selected={i === currentIdx}
                aria-label={`${t("landing.hero.goToSlide")} ${i + 1}`}
                className={`rounded-full transition-all duration-300 cursor-pointer disabled:cursor-default ${
                  i === currentIdx
                    ? "w-8 h-3 bg-gray-800"
                    : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(currentIdx + 1)}
            disabled={currentIdx >= totalItems - 1}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
            aria-label={t("landing.hero.nextSlide")}
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Read all link */}
        <div className="text-center mt-5">
          <Link
            href="/products"
            className="text-sm text-gray-500 hover:text-gray-700 underline cursor-pointer transition-colors"
          >
            {t("landing.testimonials.readAll", { defaultValue: "Read All Testimonials" })}
          </Link>
        </div>
      </div>
    </section>
  );
}
