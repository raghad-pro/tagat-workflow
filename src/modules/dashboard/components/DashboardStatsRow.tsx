"use client";

import React from "react";
import { DollarSign, Building2, FileText, AlertCircle } from "@/assets/icons/icons";
import type { DashboardStats } from "../types/dashboard.types";

interface MiniStatCardProps {
  icon: React.ElementType<any>;
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  trendColor?: string;
  iconBg?: string;
  iconColor?: string;
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  trendColor,
  iconBg = "#E6F6FE",
  iconColor = "#03A9F4",
}: MiniStatCardProps) {
  const IconEl = Icon as any;

  return (
    <div className="ds-bg-form rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all min-w-0 border border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-4 min-w-0 w-full">
        {/* 48x48 rounded 8px icon container */}
        <div
          className="w-[48px] h-[48px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <IconEl size={24} style={{ color: iconColor }} />
        </div>

        {/* Text Area */}
        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300 truncate leading-[20px]">
            {label}
          </span>
          <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px] truncate tracking-tight">
            {value}
          </span>
          {sub && (
            <span className="text-[11px] text-[#707070] dark:text-gray-400 truncate mt-0.5">
              {sub}
            </span>
          )}
          {trend && (
            <span
              className="text-[11px] font-semibold truncate"
              style={{ color: trendColor ?? "#4CAF50" }}
            >
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MiniStatCard
        icon={DollarSign}
        label="MRR"
        value={`$${stats.mrr.toLocaleString("en-US")}`}
        sub="Compared to last month"
        trend={stats.mrrTrend}
        iconBg="#E6F6FE"
        iconColor="#03A9F4"
      />
      <MiniStatCard
        icon={Building2}
        label="Companies"
        value={`${stats.companiesActive} / ${stats.companiesTotal}`}
        sub={`Engagement Rate: ${stats.engagementRate}`}
        trend={`↑ +8 this month`}
        iconBg="#EDF7EE"
        iconColor="#4CAF50"
      />
      <MiniStatCard
        icon={FileText}
        label="Invoices"
        value={`$${stats.invoicesAmount.toLocaleString("en-US")}`}
        sub="Requires Follow-up"
        trend={`↑ ${stats.invoicesOverdue} overdue`}
        trendColor="#F44336"
        iconBg="#FFFDEB"
        iconColor="#E8D636"
      />
      <MiniStatCard
        icon={AlertCircle}
        label="Pending"
        value={String(stats.pending)}
        sub="Needs Processing"
        iconBg="#FEECEB"
        iconColor="#F44336"
      />
    </div>
  );
}
