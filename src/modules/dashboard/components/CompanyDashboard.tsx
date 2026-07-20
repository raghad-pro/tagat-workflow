"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DollarSign, Briefcase, Users, AlertTriangle, CheckCircle2, ListTodo } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRole } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { CompanyDashboardData } from "../types/dashboard.types";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface Props {
  role: DashboardRole;
  token: string;
}

function CompanyStatsRow({ data }: { data: CompanyDashboardData }) {
  const stats = [
    {
      icon: DollarSign,
      title: "monthly revenue",
      value: `$${Number(data.walletBalance ?? 0).toLocaleString()}`,
      iconBg: "bg-[#E9F9FB]",
      iconColor: "text-[#12c2e9]",
    },
    {
      icon: Users,
      title: "active projects",
      value: String(data.projectsCount ?? 0),
      iconBg: "bg-[#E9F9FB]",
      iconColor: "text-[#12c2e9]",
    },
    {
      icon: Users,
      title: "team productivity",
      value: String(data.employeesCount ?? 0),
      iconBg: "bg-[#E9F9FB]",
      iconColor: "text-[#12c2e9]",
    },
    {
      icon: AlertTriangle,
      title: "pending approvals",
      value: String(data.clientsCount ?? 0),
      iconBg: "bg-[#E9F9FB]",
      iconColor: "text-[#12c2e9]",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div key={i} className="rounded-lg p-6 flex items-center gap-4 ds-bg-form shadow-sm ds-border-form h-[140px]">
            <div className={cn("w-[46px] h-[46px] rounded-xl flex items-center justify-center shrink-0", stat.iconBg)}>
              <Icon size={22} className={stat.iconColor} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[12px] font-[800] ds-text-main lowercase leading-tight">{stat.title}</span>
              <span className="text-[28px] font-[800] ds-text-main leading-none mt-1">{stat.value}</span>
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

  const chartConfig = {
    amount: { label: "Amount", color: "#25C6DA" },
  };

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6 lg:gap-8 pb-8">

        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-[30px] md:text-[34px] font-[800] tracking-tight leading-none ds-text-main">
            Dashboard
          </h1>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1">
            Platform performance overview
          </p>
        </div>

        {/* Stats Row */}
        {companyData && <CompanyStatsRow data={companyData} />}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Chart */}
          <div className="lg:col-span-2">
            <DashboardCard title="Monthly Invoices" className="h-full p-6 relative">
              <ChartContainer config={chartConfig} className="h-[300px] w-full mt-4">
                <BarChart data={invoicesData} barGap={0} barCategoryGap="25%">
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="month" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    dy={10}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: "#6b7280" }} 
                    tickFormatter={(val) => val === 0 ? "0" : val.toString()}
                    width={50}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 600, color: '#374151' }}
                  />
                  <Bar dataKey="amount" fill="#25C6DA" radius={[4, 4, 0, 0]} name="Amount" />
                </BarChart>
              </ChartContainer>
              {!hasInvoices && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-10">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {t("noInvoices")}
                  </span>
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Recent Tasks styled as Pending Approvals */}
          <div>
            <DashboardCard 
              title="Recent Tasks" 
              className="h-full"
              action={<ShowAll href="/tasks" />}
            >
              {companyData && companyData.latestTasks.length > 0 ? (
                <div className="flex flex-col divide-y divide-gray-50 mt-2">
                  {companyData.latestTasks.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between py-3.5 group cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="flex flex-col min-w-0 pr-4">
                        <Text size="sm" weight="bold" className="text-[13px] text-gray-800 dark:text-gray-200 truncate">{t.title}</Text>
                        <Text size="sm" className="text-gray-400 dark:text-gray-500 text-[11px] mt-1 truncate uppercase">{t.status}</Text>
                      </div>
                      <ListTodo size={18} className="text-cyan-400 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" className="text-center py-6 text-gray-200">
                  No tasks found
                </Text>
              )}
            </DashboardCard>
          </div>
          
        </div>

        {/* Recent Projects styled as Top Performing Projects table */}
        <DashboardCard title="Recent Projects" className="p-0 overflow-hidden" action={<ShowAll href="/projects" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] dark:bg-black/20 border-b border-gray-100 dark:border-gray-800">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Project Name</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Budget</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[150px]">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companyData && companyData.latestProjects.length > 0 ? (
                  companyData.latestProjects.map((project: any) => (
                    <tr key={project.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Text size="sm" weight="medium" className="text-gray-800 dark:text-gray-200">{project.title || project.name}</Text>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Text size="sm" className="text-gray-600 dark:text-gray-400">{project.budget ? `$${Number(project.budget).toLocaleString()}` : "-"}</Text>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded bg-opacity-20 uppercase tracking-wide",
                          project.status === "completed" ? "bg-green-100 text-green-700" : 
                          project.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-cyan-100 text-cyan-700"
                        )}>
                          {project.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Text size="sm" weight="bold" className="text-gray-700 dark:text-gray-300 w-9">
                            {project.completion_percentage || 0}%
                          </Text>
                          <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#0ea5e9]" 
                              style={{ width: `${project.completion_percentage || 0}%` }} 
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      <Text size="sm" className="text-gray-200">No projects found</Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

      </div>
    </PageContainer>
  );
}