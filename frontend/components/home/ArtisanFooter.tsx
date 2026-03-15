"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { buildSocialLinks } from "@/lib/social-icons";

const NAV_LINKS = [
  { key: "landing.footer.newArrivals", href: "/products?sort=-createdAt" },
  { key: "landing.footer.allProducts", href: "/products" },
  { key: "landing.footer.categories", href: "/categories" },
];

const SERVICE_LINKS = [
  { key: "landing.footer.contact", href: "/contact" },
  { key: "landing.footer.faq", href: "/faq" },
  { key: "landing.footer.shippingPolicy", href: "/shipping-policy" },
  { key: "landing.footer.terms", href: "/terms" },
];

export function ArtisanFooter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const socialLinks = useMemo(() => buildSocialLinks(settings?.social as Record<string, string> | undefined), [settings?.social]);
  const store = settings?.store;

  return (
    <footer className="border-t border-[#E8DDD0]">
      {/* -- Warm cream body -- */}
      <div className="bg-[#FFF8F0]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] pt-14 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Column 1 -- Shop */}
            <div>
              <h3 className="text-[11px] font-serif uppercase tracking-[0.2em] font-medium mb-5 text-[#C67B4A]">
                {t("landing.footer.shop", { defaultValue: "Shop" })}
              </h3>
              <ul className="space-y-3 border-l-2 border-dashed border-[#E8DDD0] pl-4">
                {NAV_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#3D2B1F]/60 transition-colors hover:text-[#C67B4A] cursor-pointer"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2 -- Customer Service */}
            <div>
              <h3 className="text-[11px] font-serif uppercase tracking-[0.2em] font-medium mb-5 text-[#C67B4A]">
                {t("landing.footer.customerService", { defaultValue: "Customer Service" })}
              </h3>
              <ul className="space-y-3 border-l-2 border-dashed border-[#E8DDD0] pl-4">
                {SERVICE_LINKS.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#3D2B1F]/60 transition-colors hover:text-[#C67B4A] cursor-pointer"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3 -- Contact Info */}
            <div>
              <h3 className="text-[11px] font-serif uppercase tracking-[0.2em] font-medium mb-5 text-[#C67B4A]">
                {t("landing.footer.contactInfo", { defaultValue: "Contact" })}
              </h3>
              <div className="space-y-3 text-[13px] text-[#3D2B1F]/60 border-l-2 border-dashed border-[#E8DDD0] pl-4">
                {store?.contactEmail && (
                  <p>
                    <a href={`mailto:${store.contactEmail}`} className="hover:text-[#C67B4A] transition-colors">
                      {store.contactEmail}
                    </a>
                  </p>
                )}
                {store?.contactPhone && (
                  <p>
                    <a href={`tel:${store.contactPhone}`} className="hover:text-[#C67B4A] transition-colors">
                      {store.contactPhone}
                    </a>
                  </p>
                )}
                {store?.address && (
                  <p className="leading-relaxed">{store.address}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Dark brown copyright bar -- */}
      <div className="bg-[#2C1810]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social icons */}
          <div className="flex items-center gap-4 order-2 md:order-1">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-white/40 hover:text-[#C67B4A] transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={link.svg} />
                </svg>
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[11px] tracking-[0.1em] text-white/40 order-1 md:order-2">
            &copy; {new Date().getFullYear()} &mdash; {t("appName", { defaultValue: "ShopFlow" })}. {t("landing.footer.rights", { defaultValue: "All rights reserved." })}
          </p>
        </div>
      </div>
    </footer>
  );
}
