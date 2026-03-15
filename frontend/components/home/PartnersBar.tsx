"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const ITEMS_PER_PAGE = 6;

const safeHref = (url: string): string => {
  if (url.startsWith("/") || /^https?:\/\//.test(url)) return url;
  return "#";
};

export function PartnersBar() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [currentPage, setCurrentPage] = useState(0);

  const partners = settings?.homepage?.partners?.items;

  const totalPages = Math.ceil((partners?.length ?? 0) / ITEMS_PER_PAGE);
  const visiblePartners = (partners ?? []).slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages]
  );

  if (!partners || partners.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="partners-heading"
      className="bg-white py-16 md:py-24 px-8 md:px-[100px]"
    >
      <div className="max-w-[1200px] mx-auto">
        <h2
          id="partners-heading"
          className="reveal text-base font-semibold text-gray-900 mb-10"
        >
          {t("landing.partners.heading")}
        </h2>

        <div className="flex flex-wrap justify-center gap-6 md:gap-10 reveal-stagger">
          {visiblePartners.map((partner, idx) => {
            const src = partner.imageUrl.startsWith("/")
              ? `${BASE_URL}${partner.imageUrl}`
              : partner.imageUrl;

            const inner = (
              <>
                <div className="reveal w-24 h-24 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-white">
                  <Image
                    src={src}
                    alt={partner.name || t("landing.partners.logoAlt")}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
                {partner.name && (
                  <span className="text-xs text-gray-600 mt-2">{partner.name}</span>
                )}
              </>
            );

            return partner.link ? (
              <a
                key={idx}
                href={safeHref(partner.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer"
              >
                {inner}
              </a>
            ) : (
              <div key={idx} className="flex flex-col items-center">
                {inner}
              </div>
            );
          })}
        </div>

        {/* Pagination — only shown when there are multiple pages */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-3 mt-12"
            role="tablist"
            aria-label={t("landing.partners.heading")}
          >
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
              aria-label={t("landing.hero.prevSlide")}
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  role="tab"
                  aria-selected={i === currentPage}
                  aria-label={`${t("landing.hero.goToSlide")} ${i + 1}`}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentPage
                      ? "w-8 h-3 bg-gray-800"
                      : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
              aria-label={t("landing.hero.nextSlide")}
            >
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
