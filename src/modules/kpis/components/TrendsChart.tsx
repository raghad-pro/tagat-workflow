"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, FileText, CheckSquare, Users, Video, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { KPI_CARD } from "../tones";
import type { KpiTrends, TrendDataPoint } from "../types/kpis.types";

interface TrendsChartProps {
  trends?: KpiTrends;
}

type MetricKey = "revenue" | "expenses" | "invoiced" | "projects" | "tasks" | "users" | "meetings" | "hours";

interface MetricTabConfig {
  key: MetricKey;
  label: string;
  icon: React.ElementType;
  color: string;
  gradientId: string;
  prefix?: string;
  suffix?: string;
}

const METRIC_TABS = [
  { key: "revenue", icon: DollarSign, color: "#25C6DA", gradientId: "gradRevenue", prefix: "$" },
  { key: "expenses", icon: DollarSign, color: "#F44336", gradientId: "gradExpenses", prefix: "$" },
  { key: "invoiced", icon: FileText, color: "#03A9F4", gradientId: "gradInvoiced", prefix: "$" },
  { key: "projects", icon: FileText, color: "#9810FA", gradientId: "gradProjects" },
  { key: "tasks", icon: CheckSquare, color: "#4CAF50", gradientId: "gradTasks" },
  { key: "users", icon: Users, color: "#E8D636", gradientId: "gradUsers" },
  { key: "meetings", icon: Video, color: "#00ACC1", gradientId: "gradMeetings" },
  { key: "hours", icon: Clock, color: "#FF9800", gradientId: "gradHours", suffixKey: "hoursSuffix" },
] as const;

export function TrendsChart({ trends }: TrendsChartProps) {
  const t = useTranslations("kpis.trends");
  const [activeMetric, setActiveMetric] = useState<MetricKey>("revenue");

  const currentTab = METRIC_TABS.find((tab) => tab.key === activeMetric) || METRIC_TABS[0];
  const currentLabel = t(currentTab.key);
  const currentSuffix = "suffixKey" in currentTab ? t(currentTab.suffixKey) : "";
  const currentPrefix = "prefix" in currentTab ? currentTab.prefix : "";

  // Prepare chart data points
  const rawPoints = trends?.[activeMetric];
  const chartData: TrendDataPoint[] = Array.isArray(rawPoints)
    ? rawPoints
    : (trends?.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]).map(
        (label, idx) => ({
          month: idx + 1,
          label,
          value: 0,
        })
      );

  const totalForMetric = chartData.reduce((acc, p) => acc + (p.value || 0), 0);
  const avgForMetric = chartData.length > 0 ? (totalForMetric / chartData.length).toFixed(1) : "0";

  return (
    <div className={cn(KPI_CARD, "flex flex-col gap-6 p-6")}>
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                color: "var(--kpi-brand)",
                backgroundColor: "color-mix(in srgb, var(--kpi-brand) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--kpi-brand) 22%, transparent)",
              }}
            >
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-[18px] font-bold ds-text-primary">{t("heading", { year: trends?.year || 2026 })}</h3>
          </div>
          <p className="mt-1 text-xs ds-text-gray-200">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab Buttons */}
        <div
          className="flex flex-wrap items-center gap-1.5 rounded-xl p-1"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-text-primary) 7%, transparent)" }}
        >
          {METRIC_TABS.map((tab) => {
            const IconEl = tab.icon as any;
            const isActive = tab.key === activeMetric;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveMetric(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "font-bold text-white shadow-sm"
                    : "ds-text-gray-100 hover:text-[color:var(--color-text-primary)]"
                )}
                style={isActive ? { backgroundColor: "var(--color-btn-brand)" } : undefined}
              >
                <IconEl className="w-3.5 h-3.5" style={{ color: isActive ? "currentColor" : tab.color }} />
                <span>{t(tab.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Chips */}
      <div
        className="flex flex-wrap items-center gap-4 border-b pb-4 text-xs ds-text-gray-200"
        style={{ borderColor: "color-mix(in srgb, var(--color-text-primary) 10%, transparent)" }}
      >
        <div className="flex items-center gap-2">
          <span>{t("activeMetric")}</span>
          <span className="font-bold ds-text-primary">{currentLabel}</span>
        </div>
        <div className="h-1 w-1 rounded-full" style={{ backgroundColor: "var(--color-text-gray-200)" }} />
        <div className="flex items-center gap-2">
          <span>{t("annualTotal")}</span>
          <span className="font-bold ds-text-primary">
            {currentPrefix}
            {totalForMetric.toLocaleString("en-US")}
            {currentSuffix}
          </span>
        </div>
        <div className="h-1 w-1 rounded-full" style={{ backgroundColor: "var(--color-text-gray-200)" }} />
        <div className="flex items-center gap-2">
          <span>{t("monthlyAverage")}</span>
          <span className="font-bold ds-text-primary">
            {currentPrefix}
            {avgForMetric}
            {currentSuffix}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentTab.color} stopOpacity={0.35} />
                <stop offset="95%" stopColor={currentTab.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="ds-text-gray-200"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="ds-text-gray-200"
              tickFormatter={(v) => `${currentPrefix}${v}${currentSuffix}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TrendDataPoint;
                  return (
                    <div className={cn(KPI_CARD, "rounded-lg px-3.5 py-2.5 text-xs shadow-xl")}>
                      <p className="mb-1 font-bold ds-text-primary">{data.label}</p>
                      <p className="flex items-center gap-1.5" style={{ color: currentTab.color }}>
                        <span className="font-semibold">{currentLabel}:</span>
                        <span className="font-mono font-bold">
                          {currentPrefix}
                          {data.value?.toLocaleString("en-US") || 0}
                          {currentSuffix}
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={currentTab.color}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#kpiGradient)"
              dot={{ r: 4, fill: currentTab.color, strokeWidth: 2, stroke: "var(--color-bg-form)" }}
              activeDot={{ r: 6, fill: currentTab.color, stroke: "var(--color-bg-form)", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
