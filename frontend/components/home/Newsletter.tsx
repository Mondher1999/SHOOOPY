"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { subscribeAPI } from "@/services/subscriber-service";
import { useToast } from "@/hooks/use-toast";
import logger from "@/lib/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isHex = (c: string) => /^#[0-9a-fA-F]{6}$/.test(c);

export function Newsletter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const { toast } = useToast();
  const sectionRef = useScrollReveal<HTMLElement>();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const nl = settings?.homepage?.newsletter;
  const title = nl?.title || t("landing.newsletter.heading");
  const subtitle = nl?.subtitle || t("landing.newsletter.subtitle");
  const placeholder = nl?.placeholder || t("landing.newsletter.placeholder");
  const buttonText = nl?.buttonText || t("landing.newsletter.button");
  const bgColor = isHex(nl?.bgColor || "") ? nl!.bgColor : "";
  const textColor = isHex(nl?.textColor || "") ? nl!.textColor : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      toast({ title: t("landing.newsletter.invalidEmail"), variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await subscribeAPI(email, "homepage");
      setSuccess(true);
      setEmail("");
    } catch (err) {
      logger.error("Newsletter subscribe error:", err);
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg || t("landing.newsletter.error"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="newsletter-heading"
      className="py-20 md:py-[120px] px-5 md:px-[60px] bg-allure-dark"
      style={bgColor ? { backgroundColor: bgColor } : undefined}
    >
      <div className="max-w-[600px] mx-auto text-center">
        <h2
          id="newsletter-heading"
          className="reveal font-heading text-2xl md:text-3xl font-medium uppercase tracking-allure text-white mb-4"
          style={textColor ? { color: textColor } : undefined}
        >
          {title}
        </h2>
        <p
          className="reveal text-sm text-white/70 leading-relaxed mb-8"
          style={textColor ? { color: textColor, opacity: 0.7 } : undefined}
        >
          {subtitle}
        </p>

        {success ? (
          <p
            className="reveal text-sm text-white/90 font-heading uppercase tracking-allure"
            role="status"
            aria-live="polite"
            style={textColor ? { color: textColor } : undefined}
          >
            {t("landing.newsletter.success")}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="reveal flex flex-col sm:flex-row gap-0">
            <label htmlFor="newsletter-email" className="sr-only">
              {t("landing.newsletter.emailLabel")}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              required
              className="h-12 flex-1 px-4 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/50 transition-colors"
              style={textColor ? { color: textColor, borderColor: `${textColor}33` } : undefined}
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-12 px-6 bg-white text-allure-dark text-xs uppercase tracking-allure font-heading font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {buttonText}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
