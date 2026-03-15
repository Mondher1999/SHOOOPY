"use client";

import { useReportWebVitals } from "next/web-vitals";
import logger from "@/lib/logger";

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Log all Core Web Vitals (LCP, FID, CLS, INP, TTFB, FCP)
    logger.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`);
  });

  return null;
}
