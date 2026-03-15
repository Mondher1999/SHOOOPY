"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Instagram } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const DEFAULT_IMAGES = [
  { url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80", link: "" },
  { url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80", link: "" },
  { url: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&q=80", link: "" },
  { url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80", link: "" },
  { url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80", link: "" },
  { url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80", link: "" },
];

export function InstagramFeed() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();

  const instagramUrl = settings?.social?.instagram || "https://instagram.com";
  const ig = settings?.homepage?.instagram;
  const username = ig?.username || "";

  const images = useMemo(() => {
    if (ig?.images && ig.images.length > 0) {
      return ig.images.slice(0, 6).map((img) => ({
        url: img.url.startsWith("/") ? `${BASE_URL}${img.url}` : img.url,
        link: img.link || instagramUrl,
      }));
    }
    return DEFAULT_IMAGES.map((img) => ({ ...img, link: instagramUrl }));
  }, [ig?.images, instagramUrl]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="instagram-heading"
      className="py-20 md:py-[120px] px-5 md:px-[60px] bg-allure-bg"
    >
      <h2
        id="instagram-heading"
        className="reveal font-heading text-2xl md:text-3xl font-medium uppercase tracking-allure text-center text-allure-text mb-12 md:mb-16"
      >
        {username ? `@${username}` : t("landing.instagram.heading")}
      </h2>

      <div className="max-w-[1400px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-[3px] reveal-stagger">
        {images.map((img, idx) => (
          <a
            key={idx}
            href={img.link}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal allure-img-zoom relative aspect-square group block cursor-pointer"
          >
            <Image
              src={img.url}
              alt={t("landing.instagram.imageAlt", { defaultValue: `Instagram post ${idx + 1}` })}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16.67vw"
            />
            <div className="absolute inset-0 bg-allure-dark/0 group-hover:bg-allure-dark/40 transition-all duration-300 flex items-center justify-center">
              <Instagram
                className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
          </a>
        ))}
      </div>

      <div className="reveal text-center mt-10">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="allure-link text-xs uppercase tracking-allure font-heading font-medium text-allure-text cursor-pointer"
        >
          {t("landing.instagram.followUs")}
        </a>
      </div>
    </section>
  );
}
