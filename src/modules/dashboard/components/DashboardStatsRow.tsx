"use client";

import { DollarSign, Building2, FileText, AlertCircle } from "@/assets/icons/icons";
import { Text } from "@/components/atoms/Text";
import type { DashboardStats } from "../types/dashboard.types";

interface MiniStatCardProps {
  icon: React.ElementType<any>;
  label: string;
  value: string;
  sub: string;
  trend?: string;
  trendColor?: string;
}

function MiniStatCard({ icon: Icon, label, value, sub, trend, trendColor }: MiniStatCardProps) {
  const IconEl = Icon as any;
  return (
    <div className="rounded-2xl p-4 flex gap-3 ds-bg-form ds-border-form ds-shadow-sm border border-[#E2E8F0]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ds-bg-primary-200">
        <IconEl size={16} className="ds-text-brand" />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <Text size="sm" color="gray-200" className="text-[11px] leading-tight">{label}</Text>
        <Text size="xl" weight="bold" className="leading-tight">{value}</Text>
        <Text size="sm" color="gray-200" className="text-[11px]">{sub}</Text>
        {trend && (
          <span
            className="text-[11px] font-semibold"
            style={{ color: trendColor ?? "var(--color-chart-new)" }}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MiniStatCard
        icon={DollarSign}
        label="MRR"
        value={`$${stats.mrr.toLocaleString('en-US')}`}
        sub="Compared to last month"
        trend={stats.mrrTrend}
      />
      <MiniStatCard
        icon={Building2}
        label="Companies"
        value={`${stats.companiesActive} / ${stats.companiesTotal}`}
        sub={`Engagement Rate: ${stats.engagementRate}`}
        trend={`↑ +8 this month`}
      />
      <MiniStatCard
        icon={FileText}
        label="Invoices"
        value={`$${stats.invoicesAmount.toLocaleString('en-US')}`}
        sub="Requires Follow-up"
        trend={`↑ ${stats.invoicesOverdue} overdue`}
        trendColor="var(--color-priority-high)"
      />
      <MiniStatCard
        icon={AlertCircle}
        label="Pending"
        value={String(stats.pending)}
        sub="Needs Processing"
      />
    </div>
  );
}

