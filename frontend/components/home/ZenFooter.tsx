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

const ALL_LINKS = [...NAV_LINKS, ...SERVICE_LINKS];

export function ZenFooter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const socialLinks = useMemo(() => buildSocialLinks(settings?.social as Record<string, string> | undefined), [settings?.social]);
  const store = settings?.store;

  return (
    <footer className="bg-[#FFFFFF] border-t border-[#eee]">
      <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] py-12 flex flex-col items-center text-center">
        {/* Brand */}
        <p className="text-[14px] font-extralight tracking-[0.3em] uppercase text-[#111]/30 mb-6">
          {store?.name || t("appName", { defaultValue: "ShopFlow" })}
        </p>

        {/* Links — inline row separated by middots */}
        <nav className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 mb-6">
          {ALL_LINKS.map((link, i) => (
            <span key={link.key} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-[10px] text-[#111]/20 select-none" aria-hidden="true">&middot;</span>
              )}
              <Link
                href={link.href}
                className="text-[10px] font-light tracking-[0.12em] uppercase text-[#111]/30 transition-colors hover:text-[#111]/60 cursor-pointer"
              >
                {t(link.key)}
              </Link>
            </span>
          ))}
        </nav>

        {/* Social icons */}
        {socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-4 mb-6">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-[#111]/20 hover:text-[#111]/50 transition-colors cursor-pointer"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={link.svg} />
                </svg>
              </a>
            ))}
          </div>
        )}

        {/* Contact Info */}
        {(store?.contactEmail || store?.contactPhone || store?.address) && (
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2 mb-2">
            {[
              store?.contactEmail && (
                <a key="email" href={`mailto:${store.contactEmail}`} className="text-[10px] font-light tracking-[0.12em] text-[#111]/30 transition-colors hover:text-[#111]/60">
                  {store.contactEmail}
                </a>
              ),
              store?.contactPhone && (
                <a key="phone" href={`tel:${store.contactPhone}`} className="text-[10px] font-light tracking-[0.12em] text-[#111]/30 transition-colors hover:text-[#111]/60">
                  {store.contactPhone}
                </a>
              ),
              store?.address && (
                <span key="address" className="text-[10px] font-light tracking-[0.12em] text-[#111]/30">
                  {store.address}
                </span>
              ),
            ].filter(Boolean).map((el, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[10px] text-[#111]/20 select-none" aria-hidden="true">&middot;</span>}
                {el}
              </span>
            ))}
          </div>
        )}

        {/* Copyright */}
        <p className="text-[9px] font-light tracking-[0.1em] uppercase text-[#111]/20 mt-6">
          &copy; {new Date().getFullYear()} &mdash; {t("appName", { defaultValue: "ShopFlow" })}. {t("landing.footer.rights", { defaultValue: "All rights reserved." })}
        </p>
      </div>
    </footer>
  );
}
