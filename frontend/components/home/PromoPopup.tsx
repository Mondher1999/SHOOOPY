"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "react-i18next";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
const STORAGE_KEY = "shopflow_popup_dismissed";

/** Only allow relative paths or http(s) URLs */
const safeHref = (url: string): string => {
  if (url.startsWith("/") || /^https?:\/\//.test(url)) return url;
  return "/products";
};

function shouldShow(frequency: "once" | "session" | "daily"): boolean {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return true;

  try {
    const parsed = JSON.parse(stored);
    if (typeof parsed !== "object" || parsed === null) return true;
    const freq = typeof parsed.freq === "string" ? parsed.freq : "";
    const ts = typeof parsed.ts === "number" && Number.isFinite(parsed.ts) ? parsed.ts : 0;
    if (freq === "once") return false;
    if (freq === "session") return true; // sessionStorage check handled in show()
    if (freq === "daily") {
      const dayMs = 24 * 60 * 60 * 1000;
      return Date.now() - ts > dayMs;
    }
  } catch {
    return true;
  }
  return true;
}

function markDismissed(frequency: "once" | "session" | "daily") {
  const data = JSON.stringify({ freq: frequency, ts: Date.now() });
  localStorage.setItem(STORAGE_KEY, data);
  if (frequency === "session") {
    sessionStorage.setItem(STORAGE_KEY, "1");
  }
}

export function PromoPopup() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const popup = settings?.homepage?.popup;
  const enabled = popup?.enabled === true;
  const trigger = popup?.trigger || "timed";
  const delay = popup?.delay ?? 5;
  const scrollPercent = popup?.scrollPercent ?? 50;
  const frequency = popup?.frequency || "session";

  const show = useCallback(() => {
    if (frequency === "session" && sessionStorage.getItem(STORAGE_KEY)) return;
    if (!shouldShow(frequency)) return;
    setOpen(true);
  }, [frequency]);

  const close = useCallback(() => {
    setOpen(false);
    markDismissed(frequency);
  }, [frequency]);

  // Timed trigger
  useEffect(() => {
    if (!enabled || trigger !== "timed") return;
    const timer = setTimeout(show, delay * 1000);
    return () => clearTimeout(timer);
  }, [enabled, trigger, delay, show]);

  // Scroll trigger
  useEffect(() => {
    if (!enabled || trigger !== "scroll") return;
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrolled >= scrollPercent) {
        show();
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled, trigger, scrollPercent, show]);

  // Exit-intent trigger (mouse leaves viewport from top)
  useEffect(() => {
    if (!enabled || trigger !== "exit") return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        show();
        document.removeEventListener("mouseout", handleMouseLeave);
      }
    };
    document.addEventListener("mouseout", handleMouseLeave);
    return () => document.removeEventListener("mouseout", handleMouseLeave);
  }, [enabled, trigger, show]);

  // Escape key, body scroll lock, focus trap when popup is open
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  if (!enabled || !open) return null;

  const title = popup?.title || "";
  const body = popup?.body || "";
  const ctaText = popup?.ctaText || "";
  const ctaLink = popup?.ctaLink || "/products";
  const imageUrl = popup?.imageUrl || "";
  const imgSrc = imageUrl.startsWith("/") ? `${BASE_URL}${imageUrl}` : imageUrl;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || t("landing.popup.ariaLabel")}
      onClick={close}
    >
      <div
        ref={dialogRef}
        className="relative bg-white max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="absolute top-2 right-2 z-10 w-11 h-11 flex items-center justify-center text-allure-text-muted hover:text-allure-text transition-colors cursor-pointer"
          aria-label={t("actions.close", { defaultValue: "Close" })}
        >
          <X className="w-5 h-5" />
        </button>

        {imgSrc && (
          <div className="relative w-full aspect-video">
            <Image
              src={imgSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 448px) 100vw, 448px"
            />
          </div>
        )}

        <div className="p-6 text-center">
          {title && (
            <h2 className="font-heading text-xl md:text-2xl font-medium uppercase tracking-allure text-allure-text mb-3">
              {title}
            </h2>
          )}
          {body && (
            <p className="text-sm text-allure-text-muted leading-relaxed mb-5">
              {body}
            </p>
          )}
          {ctaText && (
            <Link
              href={safeHref(ctaLink)}
              onClick={close}
              className="inline-block px-8 py-3 bg-allure-dark text-white text-xs uppercase tracking-allure font-heading font-medium hover:bg-allure-dark/90 transition-colors"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
