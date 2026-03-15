"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Leaf,
  Gem,
  Package,
  Zap,
  Shield,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard,
  Clock,
  Heart,
  Award,
  Star,
  Lock,
  CheckCircle,
  ThumbsUp,
  Wallet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";

const ICON_MAP: Record<string, LucideIcon> = {
  Leaf, Gem, Package, Zap, Shield, Truck, RotateCcw, Headphones,
  CreditCard, Clock, Heart, Award, Star, Lock, CheckCircle, ThumbsUp,
  Wallet, ShieldCheck,
};

const DEFAULT_ITEMS = [
  { icon: "ThumbsUp", titleKey: "landing.values.trustedService", descKey: "landing.values.trustedServiceDesc" },
  { icon: "Wallet", titleKey: "landing.values.flexiblePayment", descKey: "landing.values.flexiblePaymentDesc" },
  { icon: "Package", titleKey: "landing.values.curatedSelection", descKey: "landing.values.curatedSelectionDesc" },
  { icon: "ShieldCheck", titleKey: "landing.values.localWarranties", descKey: "landing.values.localWarrantiesDesc" },
] as const;

const ITEMS_PER_PAGE = 4;

export function ValuePropositions() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [currentPage, setCurrentPage] = useState(0);

  const vp = settings?.homepage?.valuePropositions;
  const hasCustomItems = vp?.items && vp.items.length > 0;

  const items = hasCustomItems
    ? vp!.items.map((item, idx) => ({
        key: `custom-${idx}`,
        icon: item.icon,
        title: item.title,
        description: item.description,
      }))
    : DEFAULT_ITEMS.map(({ icon, titleKey, descKey }) => ({
        key: titleKey,
        icon,
        title: t(titleKey),
        description: t(descKey),
      }));

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages],
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby="values-heading"
      className="bg-white py-24 md:py-36 px-8 md:px-[100px] overflow-hidden"
    >
      <h2 id="values-heading" className="sr-only">
        {t("landing.values.heading")}
      </h2>

      <div className="max-w-[1200px] mx-auto">
        {/* Carousel track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {Array.from({ length: totalPages }).map((_, pageIdx) => (
            <div
              key={pageIdx}
              className="min-w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 reveal-stagger"
            >
              {items
                .slice(pageIdx * ITEMS_PER_PAGE, (pageIdx + 1) * ITEMS_PER_PAGE)
                .map((item) => {
                  const Icon = ICON_MAP[item.icon] || Shield;
                  return (
                    <div
                      key={item.key}
                      className="reveal flex flex-col items-center text-center"
                    >
                      <div className="mb-6">
                        <Icon
                          className="w-16 h-16 md:w-20 md:h-20 text-lime-500"
                          strokeWidth={1}
                          aria-hidden="true"
                        />
                      </div>
                      <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs md:text-sm text-gray-400 leading-relaxed max-w-[260px]">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>

        {/* Carousel pagination — always visible for visual consistency */}
        <div
          className="flex items-center justify-center gap-3 mt-14"
          role="tablist"
          aria-label={t("landing.values.heading")}
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
            {Array.from({ length: Math.max(totalPages, 2) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => idx < totalPages && goToPage(idx)}
                disabled={idx >= totalPages}
                role="tab"
                className={`rounded-full transition-all duration-300 cursor-pointer disabled:cursor-default ${
                  idx === currentPage
                    ? "w-8 h-3 bg-gray-800"
                    : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`${t("landing.hero.goToSlide")} ${idx + 1}`}
                aria-selected={idx === currentPage}
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
      </div>
    </section>
  );
}
