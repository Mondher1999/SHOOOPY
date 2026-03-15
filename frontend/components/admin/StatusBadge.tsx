"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-polaris-highlight text-polaris-text",
  confirmed: "bg-polaris-info-light text-polaris-info",
  processing: "bg-polaris-warning-light text-polaris-warning",
  shipped: "bg-[#DFE3E8] text-[#44474A]",
  delivered: "bg-polaris-success-light text-polaris-success",
  cancelled: "bg-polaris-critical-light text-polaris-critical",
  active: "bg-polaris-success-light text-polaris-success",
  inactive: "bg-polaris-highlight text-polaris-text",
  draft: "bg-polaris-highlight text-polaris-text",
  archived: "bg-[#DFE3E8] text-[#44474A]",
};

interface PolarisStatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function PolarisStatusBadge({ status, label, className }: PolarisStatusBadgeProps) {
  const { t } = useTranslation("admin");

  const displayLabel = label ?? t(`dashboard.statuses.${status}`, status);
  const styles = STATUS_STYLES[status] ?? "bg-polaris-highlight text-polaris-text";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        styles,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
