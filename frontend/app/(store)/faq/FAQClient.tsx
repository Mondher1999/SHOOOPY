"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicFAQsAPI } from "@/services/faq-service";
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import type { FAQ } from "@/types";

export default function FAQClient() {
  const { t } = useTranslation("common");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicFAQsAPI();
        setFaqs(res.data);
      } catch (err) {
        logger.error("loadFAQs error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">{t("faq.title")}</h1>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-muted-foreground">{t("faq.empty")}</p>
      ) : (
        <div className="divide-y border rounded-lg">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id}>
                <button
                  onClick={() => toggle(faq.id)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left cursor-pointer hover:bg-muted/30 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180"
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground whitespace-pre-wrap">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
