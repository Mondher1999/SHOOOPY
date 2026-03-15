"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/** Only allow relative paths or http(s) URLs — block javascript: etc. */
const safeHref = (url: string): string => {
  if (url.startsWith("/") || /^https?:\/\//.test(url)) return url;
  return "/products";
};

const DEFAULT_SLIDES = [
  {
    title: "",
    subtitle: "",
    headingKey: "landing.hero.slide1.heading",
    subKey: "landing.hero.slide1.sub",
    ctaText: "",
    ctaLink: "/products",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
  },
  {
    title: "",
    subtitle: "",
    headingKey: "landing.hero.slide2.heading",
    subKey: "landing.hero.slide2.sub",
    ctaText: "",
    ctaLink: "/products",
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d",
  },
  {
    title: "",
    subtitle: "",
    headingKey: "landing.hero.slide3.heading",
    subKey: "landing.hero.slide3.sub",
    ctaText: "",
    ctaLink: "/products",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e",
  },
];

export function HeroSlideshow() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const slides = useMemo(() => {
    const configured = settings?.homepage?.slides;
    if (configured && configured.length > 0) {
      return configured.map((s) => ({
        title: s.title,
        subtitle: s.subtitle,
        ctaText: s.ctaText || t("landing.hero.cta"),
        ctaLink: s.ctaLink || "/products",
        imageUrl: s.imageUrl.startsWith("/") ? `${BASE_URL}${s.imageUrl}` : s.imageUrl,
        type: (s.type || "image") as "image" | "video",
        videoUrl: s.videoUrl || "",
        posterUrl: s.posterUrl ? (s.posterUrl.startsWith("/") ? `${BASE_URL}${s.posterUrl}` : s.posterUrl) : "",
      }));
    }
    return DEFAULT_SLIDES.map((s) => ({
      title: t(s.headingKey),
      subtitle: t(s.subKey),
      ctaText: t("landing.hero.cta"),
      ctaLink: s.ctaLink,
      imageUrl: s.imageUrl,
      type: "image" as const,
      videoUrl: "",
      posterUrl: "",
    }));
  }, [settings, t]);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    setCurrent((p) => (p === 0 ? slides.length - 1 : p - 1));
  }, [slides.length]);

  const advance = useCallback(() => {
    setCurrent((p) => (p + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(advance, 5000);
    return () => clearInterval(timer);
  }, [advance, paused]);

  useEffect(() => {
    setCurrent(0);
  }, [slides.length]);

  return (
    <section
      aria-label={t("landing.hero.ariaLabel")}
      className="relative w-full overflow-hidden"
      style={{ height: "min(90vh, 860px)" }}
    >
      {slides.map((slide, i) => {
        const isActive = i === current;
        return (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 1 : 0,
              transition: "opacity 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            aria-hidden={!isActive}
          >
            {/* Background media — image or video */}
            <div className="absolute inset-0">
              {slide.type === "video" && slide.videoUrl ? (
                (() => {
                  const url = slide.videoUrl;
                  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

                  if (ytMatch) {
                    return (
                      <iframe
                        src={`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=0&showinfo=0&rel=0&modestbranding=1`}
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ transform: "scale(1.2)" }}
                        allow="autoplay; encrypted-media"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        aria-hidden="true"
                        title="Background video"
                      />
                    );
                  }
                  if (vimeoMatch) {
                    return (
                      <iframe
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=1&loop=1&background=1`}
                        className="absolute inset-0 w-full h-full border-0"
                        style={{ transform: "scale(1.2)" }}
                        allow="autoplay"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        aria-hidden="true"
                        title="Background video"
                      />
                    );
                  }
                  // Direct video URL — only allow http(s) or local paths
                  const isValidVideoUrl = /^https?:\/\//.test(url) || url.startsWith("/");
                  if (!isValidVideoUrl) return null;
                  return (
                    <video
                      src={url.startsWith("/") ? `${BASE_URL}${url}` : url}
                      poster={slide.posterUrl || undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      aria-hidden="true"
                    />
                  );
                })()
              ) : (
                <Image
                  src={slide.imageUrl}
                  alt=""
                  aria-hidden="true"
                  fill
                  className="object-cover transition-transform duration-[6000ms] ease-out"
                  style={{ transform: isActive ? "scale(1.05)" : "scale(1)" }}
                  sizes="100vw"
                  priority={i === 0}
                />
              )}
            </div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/60" />

            {/* Text content with staggered entrance */}
            <div className="relative z-10 text-center px-6 max-w-3xl">
              <p
                className="text-[11px] uppercase tracking-[0.25em] mb-5 font-heading text-white/70 transition-all duration-700 ease-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(12px)",
                  transitionDelay: isActive ? "300ms" : "0ms",
                }}
              >
                {slide.subtitle}
              </p>
              <h1
                className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium uppercase tracking-allure mb-8 text-white transition-all duration-700 ease-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(20px)",
                  transitionDelay: isActive ? "100ms" : "0ms",
                }}
              >
                {slide.title}
              </h1>
              <div
                className="transition-all duration-700 ease-out"
                style={{
                  opacity: isActive ? 1 : 0,
                  transform: isActive ? "translateY(0)" : "translateY(12px)",
                  transitionDelay: isActive ? "500ms" : "0ms",
                }}
              >
                <Link href={safeHref(slide.ctaLink)} className="allure-btn allure-btn-light">
                  {slide.ctaText}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Previous / Next slide buttons */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={t("landing.hero.prevSlide", { defaultValue: "Previous slide" })}
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={advance}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={t("landing.hero.nextSlide", { defaultValue: "Next slide" })}
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Slide indicators + pause control */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`${t("landing.hero.goToSlide")} ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
            className="group/dot relative w-10 h-[2px] py-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/30" />
            <span
              className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white origin-left transition-transform duration-500 ease-out"
              style={{
                transform: i === current ? "scaleX(1)" : "scaleX(0)",
              }}
            />
          </button>
        ))}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="ml-2 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={paused ? t("landing.hero.play", { defaultValue: "Play slideshow" }) : t("landing.hero.pause", { defaultValue: "Pause slideshow" })}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </section>
  );
}
