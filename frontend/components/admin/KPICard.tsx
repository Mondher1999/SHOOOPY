"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  accentClass?: string;
}

export function KPICard({
  title,
  value,
  description,
  isLoading,
  icon,
  iconBg = "bg-polaris-surface-hovered",
  iconColor = "text-polaris-icon",
  accentClass = "border-t-polaris-primary",
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className="bg-polaris-surface border border-polaris-border border-t-2 border-t-polaris-border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-36" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-polaris-surface border border-polaris-border border-t-2 rounded-lg p-4 shadow-sm",
        "hover:shadow-md hover:border-polaris-border-hovered transition-all duration-200",
        accentClass
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-polaris-text-subdued uppercase tracking-wider leading-none mt-1">
          {title}
        </p>
        {icon && (
          <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg shrink-0", iconBg)}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
      </div>

      <p className="text-[28px] font-bold text-polaris-text tracking-tight leading-none mb-2">
        {value}
      </p>

      {description && (
        <p className="text-xs text-polaris-text-subdued leading-snug">
          {description}
        </p>
      )}
    </div>
  );
}
