"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function useCountdown(targetDate: Date | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!targetDate) return;
    function calculate() {
      const diff = Math.max(0, targetDate!.getTime() - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        mins: Math.floor((diff / (1000 * 60)) % 60),
        secs: Math.floor((diff / 1000) % 60),
      });
    }
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

export function ParallaxBanner() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();

  const promo = settings?.homepage?.promoBanner;
  const title = promo?.title || t("landing.promo.heading");
  const subtitle = promo?.subtitle || t("landing.promo.sub");
  const ctaText = promo?.ctaText || t("landing.promo.cta");
  const ctaLink = promo?.ctaLink || "/products";
  const imageUrl = promo?.imageUrl || "";
  const countdownEnd = promo?.countdownEnd || null;

  const endDate = useMemo(() => {
    if (!countdownEnd) return null;
    const d = new Date(countdownEnd);
    return isNaN(d.getTime()) ? null : d;
  }, [countdownEnd]);

  const { days, hours, mins, secs } = useCountdown(endDate);

  const imageSrc = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${BASE_URL}${imageUrl}`
    : "";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="promo-heading"
      className="bg-white py-8 md:py-12 px-8 md:px-[100px]"
    >
      {/* Rounded card with gradient */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          height: "min(50vh, 400px)",
          background:
            "linear-gradient(135deg, #7D1A00 0%, #C03A10 40%, #E86A2A 80%, #FF9040 100%)",
        }}
      >
        {/* Background image (person / product) — blends naturally with gradient */}
        {imageSrc && (
          <Image
            src={imageSrc}
            alt=""
            aria-hidden="true"
            fill
            className="object-cover object-right"
            sizes="100vw"
          />
        )}

        {/* Left-side gradient overlay to keep text readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(100,20,0,0.88) 0%, rgba(100,20,0,0.55) 45%, transparent 75%)",
          }}
        />

        {/* Text — left-aligned inside card */}
        <div className="relative z-10 flex items-center h-full px-10 md:px-20">
          <div className="max-w-lg">
            <p className="text-white/70 text-xs uppercase tracking-widest mb-3">
              {t("landing.promo.label")}
            </p>
            <h2
              id="promo-heading"
              className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight"
            >
              {title}
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8">{subtitle}</p>

            {endDate && (
              <div className="flex items-center gap-4 mb-8" suppressHydrationWarning>
                {[
                  { value: days, label: t("landing.promo.days") },
                  { value: hours, label: t("landing.promo.hours") },
                  { value: mins, label: t("landing.promo.mins") },
                  { value: secs, label: t("landing.promo.secs") },
                ].map((item, i) => (
                  <div key={i} className="text-center" suppressHydrationWarning>
                    <span
                      className="text-3xl font-bold text-white tabular-nums block"
                      suppressHydrationWarning
                    >
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="block text-[10px] uppercase tracking-widest text-white/60 mt-0.5">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href={ctaLink}
              className="inline-flex items-center gap-2 bg-white text-gray-900 rounded-full px-8 py-3 text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {ctaText} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
