"use client";

import { useTranslations } from "next-intl";
import { TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRole } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { ShowAll } from "./DashboardCard";
import { RecentRequestsList } from "./RecentRequestsList";
import { PackageDistributionCard } from "./PackageDistributionCard";
import { DashboardCard } from "./DashboardCard";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";

interface Props { role: DashboardRole; token: string }

export function ClientDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn:  () => dashboardApi.getClientDashboard(token),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const cs = data?.clientStats;

  // ─── Stat cards from real API data ───────────────────────────────────────
  const statCards = [
    {
      icon: TrendingUp,
      label: "Total Invoices (YTD)",
      value: cs?.totalInvoicesAmount ?? "—",
      trend: cs?.totalInvoicesTrend,
      trendColor: "var(--color-chart-new)",
    },
    {
      icon: CheckCircle,
      label: "Paid Invoices",
      value: String(cs?.paidCount ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: AlertCircle,
      label: "Unpaid Invoices",
      value: String(cs?.unpaidCount ?? "—"),
      trend: cs?.unpaidCount ? `${cs.unpaidCount} pending` : undefined,
      trendColor: "var(--color-priority-high)",
    },
  ];

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <PageHeader
          title={t("title")}
          subtitle="Overview of your invoices and payment status."
        />

        {/* 3 stat cards — real data */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {statCards.map(({ icon: Icon, label, value, trend, trendColor }) => (
            <div key={label} className="rounded-2xl p-5 flex flex-col gap-1 ds-bg-form ds-border-form ds-shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
                  <Icon size={14} className="ds-text-brand" />
                </div>
                <Text size="sm" color="gray-200" className="text-[11px] uppercase tracking-wide">{label}</Text>
              </div>
              <Text size="xl" weight="bold" className="text-2xl leading-tight">{value}</Text>
              {trend && (
                <span className="text-[11px] font-semibold mt-0.5" style={{ color: trendColor ?? "var(--color-chart-new)" }}>
                  {trend}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left: Recent Invoices ─────────────────────────────────────────── */}
          <div className="xl:col-span-2">
            <DashboardCard
              title="Recent Invoices"
              action={<ShowAll href="/invoices" />}
            >
              {data && data.recentRequests.length > 0 ? (
                <RecentRequestsList requests={data.recentRequests} />
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No invoices found
                </Text>
              )}
            </DashboardCard>
          </div>

          {/* ── Right: Invoice Distribution ──────────────────────────────────── */}
          <div>
            <DashboardCard title="Invoice Status">
              {data && data.packageDistribution.length > 0 ? (
                <PackageDistributionCard data={data.packageDistribution} />
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No data available
                </Text>
              )}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}