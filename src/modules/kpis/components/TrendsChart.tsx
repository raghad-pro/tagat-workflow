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
    <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[8px] bg-[rgba(37,198,218,0.12)] flex items-center justify-center text-[#25C6DA]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-[18px] font-bold text-[#000000] dark:text-white">{t("heading", { year: trends?.year || 2026 })}</h3>
          </div>
          <p className="text-xs text-[#707070] dark:text-gray-400 mt-1">
            {t("subtitle")}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap bg-[#F3F4F6] dark:bg-muted p-1 rounded-[8px]">
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
                    ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                    : "text-[#707070] dark:text-gray-300 hover:text-foreground hover:bg-white/50"
                )}
              >
                <IconEl className="w-3.5 h-3.5" style={{ color: isActive ? "#ffffff" : tab.color }} />
                <span>{t(tab.key)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-[#707070] dark:text-gray-400 border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <span>{t("activeMetric")}</span>
          <span className="font-bold text-[#000000] dark:text-white">{currentLabel}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-[#707070]" />
        <div className="flex items-center gap-2">
          <span>{t("annualTotal")}</span>
          <span className="font-bold text-[#000000] dark:text-white">
            {currentPrefix}
            {totalForMetric.toLocaleString("en-US")}
            {currentSuffix}
          </span>
        </div>
        <div className="w-1 h-1 rounded-full bg-[#707070]" />
        <div className="flex items-center gap-2">
          <span>{t("monthlyAverage")}</span>
          <span className="font-bold text-[#000000] dark:text-white">
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
              className="text-[#707070]"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-[#707070]"
              tickFormatter={(v) => `${currentPrefix}${v}${currentSuffix}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TrendDataPoint;
                  return (
                    <div className="ds-bg-form border border-slate-100 dark:border-slate-800 border border-border px-3.5 py-2.5 rounded-[8px] shadow-xl text-xs">
                      <p className="font-bold text-[#000000] dark:text-white mb-1">{data.label}</p>
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
              dot={{ r: 4, fill: currentTab.color, strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, fill: currentTab.color, stroke: "#ffffff", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
