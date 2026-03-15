"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { buildSocialLinks } from "@/lib/social-icons";

const SHOP_LINKS = [
  { key: "landing.footer.newArrivals", href: "/products?sort=-createdAt" },
  { key: "landing.footer.allProducts", href: "/products" },
  { key: "landing.footer.categories", href: "/categories" },
];

const INFO_LINKS = [
  { key: "landing.footer.ourStory", href: "/" },
  { key: "landing.footer.contact", href: "/contact" },
  { key: "landing.footer.faq", href: "/faq" },
  { key: "landing.footer.terms", href: "/terms" },
  { key: "landing.footer.shippingPolicy", href: "/shipping-policy" },
];

export function LuxuryFooter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const [email, setEmail] = useState("");
  const socialLinks = useMemo(() => buildSocialLinks(settings?.social as Record<string, string> | undefined), [settings?.social]);
  const store = settings?.store;

  return (
    <footer className="bg-white border-t border-[#e8e8e8]">
      {/* ── Main 4-column grid ── */}
      <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] pt-16 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Column 1 — Newsletter */}
          <div>
            <h3 suppressHydrationWarning className="text-[11px] uppercase tracking-[0.2em] font-heading font-medium mb-5 text-allure-text">
              {t("landing.newsletter.heading", { defaultValue: "Newsletter" })}
            </h3>
            <p suppressHydrationWarning className="text-[13px] leading-relaxed text-allure-text-muted mb-6">
              {t("landing.newsletter.sub", {
                defaultValue:
                  "Subscribe to receive updates, access to exclusive deals, and more.",
              })}
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              suppressHydrationWarning
              aria-label={t("landing.newsletter.formLabel", { defaultValue: "Newsletter signup" })}
            >
              <input
                suppressHydrationWarning
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("landing.newsletter.placeholder", {
                  defaultValue: "E-mail",
                })}
                className="w-full px-0 py-2.5 text-[13px] bg-transparent border-b border-[#d0d0d0] text-allure-text placeholder:text-allure-text-muted/60 outline-none transition-colors focus:border-allure-text"
                aria-label={t("landing.newsletter.emailLabel", { defaultValue: "Email address" })}
              />
              <button
                suppressHydrationWarning
                type="submit"
                className="mt-4 px-6 py-2.5 text-[11px] uppercase tracking-[0.2em] font-heading font-medium bg-allure-dark text-white hover:bg-allure-text-muted transition-colors cursor-pointer"
              >
                {t("landing.newsletter.subscribe", { defaultValue: "Subscribe" })}
              </button>
            </form>
          </div>

          {/* Column 2 — Shop */}
          <div>
            <h3 suppressHydrationWarning className="text-[11px] uppercase tracking-[0.2em] font-heading font-medium mb-5 text-allure-text">
              {t("landing.footer.shop")}
            </h3>
            <ul className="space-y-3">
              {SHOP_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-allure-text-muted transition-colors hover:text-allure-text cursor-pointer"
                  >
                    <span suppressHydrationWarning>{t(link.key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Information */}
          <div>
            <h3 suppressHydrationWarning className="text-[11px] uppercase tracking-[0.2em] font-heading font-medium mb-5 text-allure-text">
              {t("landing.footer.customerService", { defaultValue: "Information" })}
            </h3>
            <ul className="space-y-3">
              {INFO_LINKS.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-allure-text-muted transition-colors hover:text-allure-text cursor-pointer"
                  >
                    <span suppressHydrationWarning>{t(link.key)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Contact Info */}
          <div>
            <h3 suppressHydrationWarning className="text-[11px] uppercase tracking-[0.2em] font-heading font-medium mb-5 text-allure-text">
              {t("landing.footer.contactInfo", { defaultValue: "Contact" })}
            </h3>
            <div className="space-y-3 text-[13px] text-allure-text-muted">
              {store?.contactEmail && (
                <p>
                  <a href={`mailto:${store.contactEmail}`} className="hover:text-allure-text transition-colors">
                    {store.contactEmail}
                  </a>
                </p>
              )}
              {store?.contactPhone && (
                <p>
                  <a href={`tel:${store.contactPhone}`} className="hover:text-allure-text transition-colors">
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

      {/* ── Bottom bar ── */}
      <div className="border-t border-[#e8e8e8]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-[60px] py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Social icons — left */}
          <div className="flex items-center gap-4 order-2 md:order-1">
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

          {/* Copyright — center */}
          <p suppressHydrationWarning className="text-[11px] uppercase tracking-[0.12em] text-allure-text-muted order-1 md:order-2">
            &copy; {new Date().getFullYear()} &mdash; {t("appName", { defaultValue: "ShopFlow" })}. {t("landing.footer.rights", { defaultValue: "All rights reserved." })}
          </p>

          {/* Payment icons — right */}
          <div className="flex items-center gap-2 order-3">
            {/* Visa */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="Visa" role="img">
              <rect width="750" height="471" rx="40" fill="#1A1F71" />
              <path d="M278.198 334.228l33.36-195.763h53.358l-33.385 195.763H278.198zm246.11-191.54c-10.57-3.966-27.135-8.222-47.822-8.222-52.726 0-89.863 26.551-90.18 64.604-.633 28.129 26.512 43.822 46.752 53.185 20.77 9.597 27.752 15.716 27.652 24.27-.133 13.116-16.584 19.116-31.922 19.116-21.355 0-32.701-2.966-50.225-10.274l-6.879-3.112-7.488 43.822c12.463 5.467 35.508 10.2 59.438 10.452 56.09 0 92.502-26.246 92.965-66.884.199-22.27-14.016-39.216-44.801-53.188-18.652-9.056-30.078-15.1-29.928-24.27 0-8.137 9.66-16.838 30.56-16.838 17.432-.27 30.178 3.534 40.025 7.5l4.802 2.27 7.252-42.431h-.201zm-71.148 121.407c4.41-11.271 21.26-54.684 21.26-54.684-.316.525 4.38-11.33 7.074-18.684l3.606 16.878s10.22 46.7 12.37 56.49h-44.31zm-334.27-121.407L118.89 280.2l-5.34-25.555c-14.836-47.717-61.225-99.454-113.032-125.32l47.82 204.603h56.47L175.63 142.688h-56.74z" fill="#fff" />
              <path d="M85.608 138.464H2.108l-.66 3.934c67.04 16.2 111.38 55.363 129.76 102.41l-18.73-89.96c-3.23-12.396-12.6-15.975-26.87-16.384z" fill="#F9A533" />
            </svg>

            {/* Mastercard */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="Mastercard" role="img">
              <rect width="750" height="471" rx="40" fill="#000" />
              <circle cx="301" cy="236" r="148" fill="#EB001B" />
              <circle cx="449" cy="236" r="148" fill="#F79E1B" />
              <path d="M375 120.2a148 148 0 00-74 115.8 148 148 0 0074 115.8 148 148 0 0074-115.8 148 148 0 00-74-115.8z" fill="#FF5F00" />
            </svg>

            {/* American Express */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="American Express" role="img">
              <rect width="750" height="471" rx="40" fill="#2E77BC" />
              <text x="375" y="270" textAnchor="middle" fontSize="110" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#fff" letterSpacing="4">AMEX</text>
            </svg>

            {/* PayPal */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="PayPal" role="img">
              <rect width="750" height="471" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2" />
              <text x="375" y="280" textAnchor="middle" fontSize="130" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#003087" letterSpacing="2">Pay<tspan fill="#009CDE">Pal</tspan></text>
            </svg>

            {/* Diners Club */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="Diners Club" role="img">
              <rect width="750" height="471" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2" />
              <circle cx="375" cy="236" r="150" fill="none" stroke="#004A97" strokeWidth="24" />
              <line x1="375" y1="110" x2="375" y2="362" stroke="#004A97" strokeWidth="16" />
            </svg>

            {/* Discover */}
            <svg className="h-[26px] w-auto" viewBox="0 0 750 471" aria-label="Discover" role="img">
              <rect width="750" height="471" rx="40" fill="#fff" stroke="#ddd" strokeWidth="2" />
              <rect y="320" width="750" height="151" rx="0" fill="#F48120" />
              <text x="375" y="250" textAnchor="middle" fontSize="100" fontWeight="bold" fontFamily="Arial, sans-serif" fill="#000" letterSpacing="6">DISCOVER</text>
              <circle cx="555" cy="220" r="50" fill="#F48120" />
            </svg>
          </div>
        </div>
      </div>
    </footer>
  );
}
