"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Briefcase, Users, Wallet, ArrowUpRight, ListTodo } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRole } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { CompanyDashboardData } from "../types/dashboard.types";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Props {
  role: DashboardRole;
  token: string;
}

const invoicesChartConfig = {
  amount: { label: "Invoices", color: "var(--color-chart-expenses)" },
};

function InvoicesChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ChartContainer config={invoicesChartConfig} className="h-[200px] w-full">
      <BarChart data={data} barGap={3} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-primary)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-primary)" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="amount" fill="var(--color-chart-expenses)" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

function CompanyStatsRow({ data }: { data: CompanyDashboardData }) {
  const stats = [
    {
      icon: Users,
      label: "Clients",
      value: String(data.clientsCount),
    },
    {
      icon: Users,
      label: "Employees",
      value: String(data.employeesCount),
    },
    {
      icon: Briefcase,
      label: "Projects",
      value: String(data.projectsCount),
    },
    {
      icon: Wallet,
      label: "Wallet Balance",
      value: `$${Number(data.walletBalance).toLocaleString()}`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="rounded-2xl p-4 flex gap-3 ds-bg-form ds-border-form ds-shadow-sm items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ds-bg-primary-200">
              <Icon size={18} className="ds-text-brand" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <Text size="sm" color="gray-200" className="text-[11px] leading-tight font-medium">{stat.label}</Text>
              <Text size="lg" weight="bold" className="leading-tight mt-0.5">{stat.value}</Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getDummyMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = d.toLocaleString("en-US", { month: "short" });
    months.push({ month: monthName, amount: 0 });
  }
  return months;
}

export function CompanyDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "company"],
    queryFn: () => dashboardApi.getDashboard("company", token),
    enabled: !!token,
    staleTime: 0,
    retry: 2,
  });

  const companyData = data?.companyData;
  const hasInvoices = !!(companyData?.monthlyInvoices && companyData.monthlyInvoices.length > 0);
  const invoicesData = hasInvoices && companyData?.monthlyInvoices ? companyData.monthlyInvoices : getDummyMonths();

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
              onClick: () => router.push("/projects?add=true"),
            },
          ]}
        />

        {/* Stats Row */}
        {companyData && <CompanyStatsRow data={companyData} />}

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Invoices Chart */}
            <DashboardCard title="Monthly Invoices">
              <div className="relative">
                <InvoicesChart data={invoicesData} />
                {!hasInvoices && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {t("noInvoices")}
                    </span>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Recent Projects */}
            <DashboardCard
              title="Recent Projects"
              action={<ShowAll href="/projects" />}
            >
              {companyData && companyData.latestProjects.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {companyData.latestProjects.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
                        <Briefcase size={14} className="ds-text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text size="sm" weight="bold" tag="p" className="truncate">
                          {p.title || p.name}
                        </Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[10px] uppercase">
                          {p.status}
                        </Text>
                      </div>
                      <Text size="sm" weight="bold" className="ds-text-success shrink-0">
                        {p.budget ? `$${Number(p.budget).toLocaleString()}` : "-"}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No projects found
                </Text>
              )}
            </DashboardCard>
          </div>

          {/* Right column */}
          <div>
            <DashboardCard
              title="Recent Tasks"
              action={<ShowAll href="/tasks" />}
              className="h-full"
            >
              {companyData && companyData.latestTasks.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {companyData.latestTasks.map((t: any) => (
                    <div
                      key={t.id}
                      className="rounded-xl p-3 flex items-start justify-between gap-3 ds-bg ds-border-form"
                    >
                      <div className="min-w-0">
                        <Text size="sm" weight="bold" tag="p" className="truncate ds-text-brand">
                          {t.title}
                        </Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[10px] mt-0.5 truncate uppercase">
                          {t.status}
                        </Text>
                      </div>
                      <div className="w-6 h-6 rounded-md shrink-0 flex items-center justify-center ds-bg-primary-200 ds-text-brand">
                        <ListTodo size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No tasks found
                </Text>
              )}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}