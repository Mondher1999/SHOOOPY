"use client";

import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import type { DashboardRevenuePoint } from "@/types";

interface RevenueChartProps {
  data: DashboardRevenuePoint[];
  isLoading: boolean;
}

/* Design-system/MASTER.md — primary action color (Polaris green) */
const CHART_COLOR = "#008060";

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  const { t } = useTranslation("admin");
  const formatPrice = useFormatPrice();

  if (isLoading) {
    return (
      <Card className="shadow-polaris">
        <CardHeader className="p-4 pb-2">
          <Skeleton className="h-5 w-52" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-polaris">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-semibold text-polaris-text">
            {t("dashboard.chart.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-polaris-text-subdued py-12 text-center">
            {t("dashboard.chart.noData")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const currencySymbol = formatPrice(0).replace(/[\d.,\s]/g, "").trim();

  const formatYAxis = (v: number) => {
    if (v === 0) return `0 ${currencySymbol}`;
    if (v >= 1000) return `${Math.round(v / 1000)}K ${currencySymbol}`;
    return formatPrice(v);
  };

  return (
    <Card className="shadow-polaris">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-polaris-text">
          {t("dashboard.chart.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLOR} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBEBEB" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12, fill: "#6D7175" }}
                axisLine={{ stroke: "#E3E3E3" }}
                tickLine={{ stroke: "#E3E3E3" }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#6D7175" }}
                axisLine={{ stroke: "#E3E3E3" }}
                tickLine={{ stroke: "#E3E3E3" }}
                tickFormatter={formatYAxis}
                width={80}
              />
              <Tooltip
                formatter={(value: number | undefined) => [formatPrice(value ?? 0), t("dashboard.chart.revenue")]}
                labelFormatter={(label: unknown) => formatDate(String(label))}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E3E3E3",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  fontSize: "13px",
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={CHART_COLOR}
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 5, fill: CHART_COLOR, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
