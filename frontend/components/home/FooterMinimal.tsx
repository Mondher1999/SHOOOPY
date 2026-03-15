"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { buildSocialLinks } from "@/lib/social-icons";

const LINKS = [
  { key: "landing.footer.allProducts", href: "/products" },
  { key: "landing.footer.categories", href: "/categories" },
  { key: "landing.footer.contact", href: "/contact" },
  { key: "landing.footer.terms", href: "/terms" },
];

export function FooterMinimal() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const socialLinks = useMemo(() => buildSocialLinks(settings?.social as Record<string, string> | undefined), [settings?.social]);
  const store = settings?.store;

  return (
    <footer className="bg-white border-t border-[#e8e8e8]">
      <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo / Store name */}
          <Link
            href="/"
            className="font-heading text-[16px] font-normal tracking-[0.24em] uppercase text-allure-text hover:text-allure-text-muted transition-colors"
          >
            {t("appName", { defaultValue: "ShopFlow" })}
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-6 flex-wrap justify-center">
            {LINKS.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className="text-[12px] tracking-[0.1em] uppercase text-allure-text-muted hover:text-allure-text transition-colors"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.key}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
                className="text-allure-text-muted hover:text-allure-text transition-colors cursor-pointer"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d={link.svg} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        {(store?.contactEmail || store?.contactPhone || store?.address) && (
          <div className="mt-6 pt-5 border-t border-[#f0f0f0] flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {store?.contactEmail && (
              <a href={`mailto:${store.contactEmail}`} className="text-[12px] tracking-[0.1em] text-allure-text-muted hover:text-allure-text transition-colors">
                {store.contactEmail}
              </a>
            )}
            {store?.contactPhone && (
              <a href={`tel:${store.contactPhone}`} className="text-[12px] tracking-[0.1em] text-allure-text-muted hover:text-allure-text transition-colors">
                {store.contactPhone}
              </a>
            )}
            {store?.address && (
              <span className="text-[12px] tracking-[0.1em] text-allure-text-muted">
                {store.address}
              </span>
            )}
          </div>
        )}

        {/* Copyright */}
        <div className="mt-6 pt-5 border-t border-[#f0f0f0] text-center">
          <p className="text-[11px] uppercase tracking-[0.12em] text-allure-text-muted">
            &copy; {new Date().getFullYear()} &mdash; {t("appName", { defaultValue: "ShopFlow" })}. {t("landing.footer.rights", { defaultValue: "All rights reserved." })}
          </p>
        </div>
      </div>
    </footer>
  );
}
