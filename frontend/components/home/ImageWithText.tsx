"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function ImageWithText() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();

  const bs = settings?.homepage?.brandStory;
  const heading = bs?.title || t("landing.brandStory.heading");
  const body = bs?.body || t("landing.brandStory.body");
  const ctaText = bs?.ctaText || t("landing.brandStory.cta");
  const ctaHref = bs?.ctaLink || "/products";
  const imagePosition = bs?.imagePosition || "left";
  const rawImage = bs?.imageUrl || "";

  const imageSrc = rawImage
    ? rawImage.startsWith("http")
      ? rawImage
      : `${BASE_URL}${rawImage}`
    : "";

  const imageBlock = (
    <div className="reveal w-full md:w-[55%] min-h-[360px] md:min-h-[480px] relative overflow-hidden">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={heading}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 55vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gray-100" />
      )}
    </div>
  );

  const textBlock = (
    <div className="w-full md:w-[45%] flex items-center bg-white">
      <div className="px-10 py-12 md:px-14 lg:px-16">
        <h2
          id="brand-story-heading"
          className="reveal text-2xl md:text-3xl font-bold text-gray-900 mb-5 leading-tight"
        >
          {heading}
        </h2>
        <div className="reveal text-sm text-gray-500 leading-[1.9] mb-8 space-y-4">
          {body.split("\n").filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="reveal">
          <Link
            href={ctaHref}
            className="inline-block bg-gray-900 text-white rounded-full px-8 py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="brand-story-heading"
      className="bg-white py-10 md:py-16 px-8 md:px-[100px]"
    >
      <div
        className={`flex flex-col ${
          imagePosition === "right" ? "md:flex-row-reverse" : "md:flex-row"
        } rounded-2xl overflow-hidden border border-gray-200`}
      >
        {imageBlock}
        {textBlock}
      </div>
    </section>
  );
}
