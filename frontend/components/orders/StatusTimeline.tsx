"use client";

import { useTranslation } from "react-i18next";
import { Check, X, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus, OrderStatusHistory } from "@/types";

/** The linear order flow (excluding cancelled) */
const FLOW_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

interface StatusTimelineProps {
  statusHistory: OrderStatusHistory[];
  currentStatus: OrderStatus;
  className?: string;
}

export function StatusTimeline({
  statusHistory,
  currentStatus,
  className,
}: StatusTimelineProps) {
  const { t } = useTranslation("orders");
  const isCancelled = currentStatus === "cancelled";

  // Build a map of status → date for quick lookup
  const statusDates = new Map<string, string>();
  for (const entry of statusHistory) {
    // Keep the latest date per status
    statusDates.set(entry.status, entry.date);
  }

  // Which step index is the current one?
  const currentIdx = FLOW_STEPS.indexOf(currentStatus);

  return (
    <div className={cn("w-full", className)} role="list" aria-label={t("timeline.label")}>
      {/* Flow steps */}
      <div className="flex items-start justify-between gap-0">
        {FLOW_STEPS.map((step, idx) => {
          const isCompleted = !isCancelled && currentIdx > idx;
          const isCurrent = !isCancelled && currentIdx === idx;
          const isFuture = !isCancelled && currentIdx < idx;
          const dateStr = statusDates.get(step);

          return (
            <div
              key={step}
              className="flex flex-1 flex-col items-center relative"
              role="listitem"
              aria-label={`${t(`status.${step}`)}: ${
                isCompleted ? t("timeline.completed") :
                isCurrent ? t("timeline.current") :
                t("timeline.upcoming")
              }`}
            >
              {/* Connector line (before this step) */}
              {idx > 0 && (
                <div
                  className={cn(
                    "absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2",
                    isCompleted || isCurrent
                      ? "bg-primary"
                      : isCancelled
                        ? "bg-destructive/30"
                        : "bg-muted"
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Step circle */}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background ring-2 ring-primary ring-offset-2",
                  isFuture && "border-muted bg-muted text-muted-foreground",
                  isCancelled && (statusDates.has(step)
                    ? "border-destructive bg-destructive text-destructive-foreground"
                    : "border-muted bg-muted text-muted-foreground")
                )}
                aria-hidden="true"
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isCancelled && statusDates.has(step) ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center leading-tight",
                  isCompleted && "text-primary",
                  isCurrent && "text-primary font-semibold",
                  isFuture && "text-muted-foreground",
                  isCancelled && "text-muted-foreground"
                )}
              >
                {t(`status.${step}`)}
              </span>

              {/* Date */}
              {dateStr && (
                <span className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(dateStr).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancelled banner */}
      {isCancelled && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <X className="h-4 w-4 shrink-0" />
          <span>
            {t("timeline.cancelled")}
            {statusDates.get("cancelled") && (
              <> &mdash; {new Date(statusDates.get("cancelled")!).toLocaleDateString()}</>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
