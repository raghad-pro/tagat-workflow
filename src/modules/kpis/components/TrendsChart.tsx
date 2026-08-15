"use client";

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

const METRIC_TABS: MetricTabConfig[] = [
  { key: "revenue", label: "Revenue", icon: DollarSign, color: "#25C6DA", gradientId: "gradRevenue", prefix: "$" },
  { key: "expenses", label: "Expenses", icon: DollarSign, color: "#F44336", gradientId: "gradExpenses", prefix: "$" },
  { key: "invoiced", label: "Invoiced", icon: FileText, color: "#03A9F4", gradientId: "gradInvoiced", prefix: "$" },
  { key: "projects", label: "Projects", icon: FileText, color: "#9810FA", gradientId: "gradProjects" },
  { key: "tasks", label: "Tasks", icon: CheckSquare, color: "#4CAF50", gradientId: "gradTasks" },
  { key: "users", label: "Users", icon: Users, color: "#E8D636", gradientId: "gradUsers" },
  { key: "meetings", label: "Meetings", icon: Video, color: "#00ACC1", gradientId: "gradMeetings" },
  { key: "hours", label: "Hours", icon: Clock, color: "#FF9800", gradientId: "gradHours", suffix: " hrs" },
];

export function TrendsChart({ trends }: TrendsChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("revenue");

  const currentTab = METRIC_TABS.find((t) => t.key === activeMetric) || METRIC_TABS[0];

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
    <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#25C6DA]" />
            <h3 className="text-[18px] font-bold text-foreground">Annual Trends ({trends?.year || 2026})</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track month-by-month trajectory and growth dynamics
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap bg-gray-100 dark:bg-muted p-1 rounded-xl">
          {METRIC_TABS.map((tab) => {
            const IconEl = tab.icon as any;
            const isActive = tab.key === activeMetric;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveMetric(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-white dark:bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
                )}
              >
                <IconEl className="w-3.5 h-3.5" style={{ color: tab.color }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground border-b border-border/40 pb-4">
        <div className="flex items-center gap-2">
          <span>Active Metric:</span>
          <span className="font-bold text-foreground">{currentTab.label}</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <div className="flex items-center gap-2">
          <span>Annual Total:</span>
          <span className="font-bold text-foreground">
            {currentTab.prefix}
            {totalForMetric.toLocaleString("en-US")}
            {currentTab.suffix}
          </span>
        </div>
        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        <div className="flex items-center gap-2">
          <span>Monthly Average:</span>
          <span className="font-bold text-foreground">
            {currentTab.prefix}
            {avgForMetric}
            {currentTab.suffix}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="kpiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={currentTab.color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={currentTab.color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "currentColor" }}
              className="text-muted-foreground"
              tickFormatter={(v) => `${currentTab.prefix || ""}${v}${currentTab.suffix || ""}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TrendDataPoint;
                  return (
                    <div className="bg-popover border border-border px-3.5 py-2.5 rounded-xl shadow-xl text-xs">
                      <p className="font-bold text-foreground mb-1">{data.label}</p>
                      <p className="flex items-center gap-1.5" style={{ color: currentTab.color }}>
                        <span className="font-semibold">{currentTab.label}:</span>
                        <span className="font-mono font-bold">
                          {currentTab.prefix}
                          {data.value?.toLocaleString("en-US") || 0}
                          {currentTab.suffix}
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
