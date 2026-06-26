"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, ArrowUpRight } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRole } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { DashboardStatsRow } from "./DashboardStatsRow";
import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
import { RecentRequestsList } from "./RecentRequestsList";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";

interface Props { role: DashboardRole; token: string }

export function CompanyDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "company_admin"],
    queryFn:  () => dashboardApi.getCompanyDashboard(token),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Pending timesheets from API → shown as "Pending Approvals"
  const pendingItems = data?.pendingInvoices ?? [];

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[
            {
              label: t("newProject"),
              icon: Plus,
              variant: "solid",
              onClick: () => router.push("/projects/add"),
            },
          ]}
        />

        {/* Stats row — real data */}
        {data && <DashboardStatsRow stats={data.stats} />}

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Cash flow chart — real data */}
            <DashboardCard title={t("monthlyCashFlow")} action={<CashFlowLegend />}>
              {data && data.cashFlow.length > 0 ? (
                <CashFlowChart data={data.cashFlow} />
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-10">
                  No cash flow data available
                </Text>
              )}
            </DashboardCard>

            {/* Recent Invoices table — replaces mock topProjects */}
            <DashboardCard
              title="Recent Invoices"
              action={<ShowAll href="/invoices" />}
            >
              {data && data.recentRequests.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  {/* Table head */}
                  <div className="grid grid-cols-4 pb-2 mb-1 border-b ds-border-form text-[10px] font-bold uppercase tracking-wider ds-text-gray-200">
                    <span>Invoice ID</span>
                    <span>Company</span>
                    <span>Priority</span>
                    <span className="text-right">Amount</span>
                  </div>

                  {/* Table rows */}
                  {data.recentRequests.map((req, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-4 items-center py-3 border-b ds-border-form last:border-0"
                    >
                      <Text size="sm" weight="bold" tag="span" className="truncate pr-2 ds-text-brand">
                        {req.id}
                      </Text>

                      <Text size="sm" color="gray-200" tag="span">
                        {req.company}
                      </Text>

                      <span>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            req.priority === "High"
                              ? "ds-bg-priority-high ds-text-priority-high"
                              : req.priority === "Medium"
                              ? "ds-bg-priority-medium ds-text-priority-medium"
                              : "ds-bg-priority-low ds-text-priority-low"
                          )}
                        >
                          {req.priority}
                        </span>
                      </span>

                      <Text size="sm" weight="bold" tag="span" className="text-right ds-text-success">
                        {req.sub.replace("Invoice — ", "")}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No invoices found
                </Text>
              )}
            </DashboardCard>
          </div>

          {/* Right column – Pending Approvals from real timesheets */}
          <div>
            <DashboardCard
              title="Pending Approvals"
              action={
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full ds-bg-priority-high ds-text-priority-high">
                  {data?.stats.pending ?? 0} tasks
                </span>
              }
              className="h-full"
            >
              {pendingItems.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {pendingItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-3 flex items-start justify-between gap-3 ds-bg ds-border-form"
                    >
                      <div className="min-w-0">
                        <Text size="sm" weight="bold" tag="p" className="truncate ds-text-brand">
                          {item.id}
                        </Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[10px] mt-0.5 truncate">
                          {item.sub}
                        </Text>
                      </div>
                      <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center ds-bg-primary-200 ds-text-brand">
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No pending approvals
                </Text>
              )}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}