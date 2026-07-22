// "use client";

// import { useRouter } from "next/navigation";
// import { Text } from "@/components/atoms/Text";
// import { PageContainer } from "@/components/template/PageContainer";
// import { PageHeader } from "@/components/molecules/Pageheader";
// import { useTranslations } from "next-intl";
// import { useDashboard } from "../hooks/useDashboard";
// import { DashboardStatsRow } from "./DashboardStatsRow";
// import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
// import { ChurnChart, ChurnLegend } from "./ChurnChart";
// import { PackageDistributionCard } from "./PackageDistributionCard";
// import { RecentCompaniesList } from "./RecentCompaniesList";
// import { RecentRequestsList } from "./RecentRequestsList";
// import { DashboardCard, ShowAll } from "./DashboardCard";
// import { Plus } from "lucide-react";

// export function SuperAdminDashboard() {
//   const t = useTranslations("dashboard");
//   const { data, isLoading } = useDashboard();
//   const router = useRouter();

//   return (
//     <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
//       <div className="flex flex-col gap-6">

//         {/* Header */}
//         <PageHeader 
//           title={t("title")} 
//           subtitle={t("subtitle")}
//           actions={[
//             {
//               label: t("newCompany"),
//               icon: Plus,
//               variant: "solid",
//               onClick: () => router.push("/companies/add"),
//             }
//           ]}
//         />

//         {/* Main grid */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

//           {/* Left column */}
//           <div className="xl:col-span-2 flex flex-col gap-6">
//             {data && <DashboardStatsRow stats={data.stats} />}

//             <DashboardCard title={t("monthlyCashFlow")} action={<CashFlowLegend />}>
//               {data && <CashFlowChart data={data.cashFlow} />}
//             </DashboardCard>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <DashboardCard title={t("subscriberGrowth")} action={<ChurnLegend />}>
//                 {data && <ChurnChart data={data.churn} />}
//               </DashboardCard>

//               <DashboardCard title={t("packageDistribution")}>
//                 {data && <PackageDistributionCard data={data.packageDistribution} />}
//               </DashboardCard>
//             </div>
//           </div>

//           {/* Right column */}
//           <div className="flex flex-col gap-5">
//             <DashboardCard
//               title={t("recentCompanies")}
//               action={<ShowAll href="/companies" />}
//             >
//               {data && <RecentCompaniesList companies={data.recentCompanies} />}
//             </DashboardCard>

//             <DashboardCard
//               title={t("recentRequests")}
//               action={<ShowAll href="/company-requests" />}
//             >
//               {data && <RecentRequestsList requests={data.recentRequests} />}
//             </DashboardCard>
//           </div>
//         </div>
//       </div>
//     </PageContainer>
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Building2, Briefcase, Users, FileText } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardRole } from "../api/dashboard.api";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { Text } from "@/components/atoms/Text";
import type { SuperAdminDashboardData } from "../types/dashboard.types";
import { cn } from "@/lib/utils";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Props {
  role:  DashboardRole;
  token: string;
}

const paymentsChartConfig = {
  amount: { label: "Payments", color: "var(--color-chart-revenue)" },
};

function PaymentsChart({ data }: { data: { month: string; amount: number }[] }) {
  return (
    <ChartContainer config={paymentsChartConfig} className="h-[200px] w-full">
      <BarChart data={data} barGap={3} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-primary)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-primary)" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="amount" fill="var(--color-chart-revenue)" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
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

function SuperAdminStatsRow({ data }: { data: SuperAdminDashboardData }) {
  const t = useTranslations("dashboard");
  const stats = [
    {
      icon: Users,
      label: t("clients") || "Clients",
      value: String(data.clientsCount),
    },
    {
      icon: Building2,
      label: t("companies") || "Companies",
      value: String(data.companiesCount),
    },
    {
      icon: Users,
      label: t("employees") || "Employees",
      value: String(data.employeesCount),
    },
    {
      icon: Briefcase,
      label: t("projects") || "Projects",
      value: String(data.projectsCount),
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

export function SuperAdminDashboard({ role, token }: Props) {
  const t      = useTranslations("dashboard");
  const router = useRouter();
  const { data, isLoading } = useDashboard(role, token);
  const superAdminData = data?.superAdminData;

  const hasPayments = !!(superAdminData?.monthlyPayments && superAdminData.monthlyPayments.length > 0);
  const paymentsData = hasPayments && superAdminData?.monthlyPayments ? superAdminData.monthlyPayments : getDummyMonths();

  const hasInvoices = !!(superAdminData?.monthlyInvoices && superAdminData.monthlyInvoices.length > 0);
  const invoicesData = hasInvoices && superAdminData?.monthlyInvoices ? superAdminData.monthlyInvoices : getDummyMonths();

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{
            label:   t("newCompany"),
            icon:    Plus,
            variant: "solid",
            onClick: () => router.push("/companies?add=true"),
          }]}
        />

        {superAdminData && <SuperAdminStatsRow data={superAdminData} />}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <DashboardCard title={t("monthlyInvoices") || "Monthly Invoices"}>
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

            <DashboardCard title={t("monthlyPayments") || "Monthly Payments"}>
              <div className="relative">
                <PaymentsChart data={paymentsData} />
                {!hasPayments && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {t("noPayments")}
                    </span>
                  </div>
                )}
              </div>
            </DashboardCard>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <DashboardCard
              title={t("recentCompanies")}
              action={<ShowAll href="/companies" />}
            >
              {superAdminData && superAdminData.latestCompanies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {superAdminData.latestCompanies.map((c: any) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
                        <Building2 size={14} className="ds-text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text size="sm" weight="bold" tag="p" className="truncate">
                          {c.name}
                        </Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[10px] truncate">
                          {c.domain || c.email}
                        </Text>
                      </div>
                      <Text size="sm" color="gray-200" tag="span" className="text-[10px] shrink-0">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                      </Text>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">{t("noCompaniesFound") || "No companies found"}</Text>
              )}
            </DashboardCard>

            <DashboardCard
              title={t("recentProjects") || "Recent Projects"}
              action={<ShowAll href="/projects" />}
            >
              {superAdminData && superAdminData.latestProjects.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {superAdminData.latestProjects.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
                        <Briefcase size={14} className="ds-text-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text size="sm" weight="bold" tag="p" className="truncate">
                          {p.title}
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
                <Text size="sm" color="gray-200" className="text-center py-6">{t("noProjectsFound") || "No projects found"}</Text>
              )}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}