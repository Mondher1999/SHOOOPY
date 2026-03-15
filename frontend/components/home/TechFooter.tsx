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

export function TechFooter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const socialLinks = useMemo(() => buildSocialLinks(settings?.social as Record<string, string> | undefined), [settings?.social]);
  const store = settings?.store;

  return (
    <footer className="bg-[#0A0A0F] border-t border-[#00FF88]/20">
      {/* ── Dark 4-column grid ── */}
      <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Column 1 — Shop */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold mb-5 text-[#00FF88]">
              {t("landing.footer.shop", { defaultValue: "Shop" })}
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-mono text-white/40 transition-all hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.3)] cursor-pointer"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2 — Customer Service */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold mb-5 text-[#00FF88]">
              {t("landing.footer.customerService", { defaultValue: "Customer Service" })}
            </h3>
            <ul className="space-y-3">
              {SERVICE_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-[13px] font-mono text-white/40 transition-all hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.3)] cursor-pointer"
                  >
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Contact Info */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold mb-5 text-[#00FF88]">
              {t("landing.footer.contactInfo", { defaultValue: "Contact" })}
            </h3>
            <div className="space-y-3 text-[13px] font-mono text-white/40">
              {store?.contactEmail && (
                <p>
                  <a
                    href={`mailto:${store.contactEmail}`}
                    className="hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.3)] transition-all"
                  >
                    {store.contactEmail}
                  </a>
                </p>
              )}
              {store?.contactPhone && (
                <p>
                  <a
                    href={`tel:${store.contactPhone}`}
                    className="hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.3)] transition-all"
                  >
                    {store.contactPhone}
                  </a>
                </p>
              )}
              {store?.address && (
                <p className="leading-relaxed">{store.address}</p>
              )}
            </div>
          </div>

          {/* Column 4 — Connect (Social Links) */}
          <div>
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] font-bold mb-5 text-[#00FF88]">
              {t("landing.footer.connect", { defaultValue: "Connect" })}
            </h3>
            <div className="flex flex-wrap gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="text-white/30 hover:text-[#00FF88] hover:drop-shadow-[0_0_6px_rgba(0,255,136,0.3)] transition-all cursor-pointer"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={link.svg} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#00FF88]/10">
        <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] py-5 flex items-center justify-center">
          <p className="font-mono text-[10px] text-white/20">
            &copy; {new Date().getFullYear()} &mdash; {t("appName", { defaultValue: "ShopFlow" })}. {t("landing.footer.rights", { defaultValue: "All rights reserved." })}
          </p>
        </div>
      </div>
    </footer>
  );
}
