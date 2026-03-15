"use client";

import { useTranslation } from "react-i18next";
import {
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  CreditCard,
  Package,
  Clock,
  Heart,
  Award,
  Star,
  Lock,
  CheckCircle,
  Leaf,
  Zap,
  Gem,
  ThumbsUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";

const ICON_MAP: Record<string, LucideIcon> = {
  Truck,
  Shield,
  RotateCcw,
  Headphones,
  CreditCard,
  Package,
  Clock,
  Heart,
  Award,
  Star,
  Lock,
  CheckCircle,
  Leaf,
  Zap,
  Gem,
  ThumbsUp,
};

const DEFAULT_ITEMS = [
  { icon: "Truck", titleKey: "landing.trust.shipping", descKey: "landing.trust.shippingDesc" },
  { icon: "Shield", titleKey: "landing.trust.payment", descKey: "landing.trust.paymentDesc" },
  { icon: "RotateCcw", titleKey: "landing.trust.returns", descKey: "landing.trust.returnsDesc" },
  { icon: "Headphones", titleKey: "landing.trust.support", descKey: "landing.trust.supportDesc" },
] as const;

export function TrustBar() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const sectionRef = useScrollReveal<HTMLElement>();

  const tb = settings?.homepage?.trustBar;
  const customItems = tb?.items || [];
  const hasCustom = customItems.length > 0;

  return (
    <section
      ref={sectionRef}
      aria-label={t("landing.trust.ariaLabel")}
      className="bg-allure-bg-alt py-10 md:py-14 px-5 md:px-[60px]"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 reveal-stagger">
        {hasCustom
          ? customItems.map((item, idx) => {
              const Icon = ICON_MAP[item.icon] || Shield;
              return (
                <div key={idx} className="reveal flex flex-col items-center text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-3 border border-allure-border">
                    <Icon className="w-5 h-5 text-allure-text" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="font-heading uppercase tracking-allure text-[11px] font-medium text-allure-text mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-allure-text-muted leading-relaxed max-w-[200px]">
                    {item.description}
                  </p>
                </div>
              );
            })
          : DEFAULT_ITEMS.map(({ icon, titleKey, descKey }) => {
              const Icon = ICON_MAP[icon] || Shield;
              return (
                <div key={titleKey} className="reveal flex flex-col items-center text-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-3 border border-allure-border">
                    <Icon className="w-5 h-5 text-allure-text" strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <h3 className="font-heading uppercase tracking-allure text-[11px] font-medium text-allure-text mb-1">
                    {t(titleKey)}
                  </h3>
                  <p className="text-xs text-allure-text-muted leading-relaxed max-w-[200px]">
                    {t(descKey)}
                  </p>
                </div>
              );
            })}
      </div>
    </section>
  );
}
