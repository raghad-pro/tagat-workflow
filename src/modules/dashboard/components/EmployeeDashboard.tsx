"use client";

import { useTranslations } from "next-intl";
import { DollarSign, FileText, CheckSquare, Clock } from "lucide-react";
import type { DashboardRole } from "../api/dashboard.api";
import { dashboardApi } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { WorkingHoursChart } from "./WorkingHoursChart";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";

interface SplitBarProps {
  paid: number;
  unpaid: number;
  paidTitle: string;
  unpaidTitle: string;
  paidLabel: string;
  unpaidLabel: string;
  paidTag: string;
  unpaidTag: string;
}

function SplitBar({ paid, unpaid, paidTitle, unpaidTitle, paidLabel, unpaidLabel, paidTag, unpaidTag }: SplitBarProps) {
  const total = paid + unpaid;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between items-start">
        <div>
          <Text size="xl" weight="bold" tag="p" className="ds-text-success">${paid.toFixed(2)}</Text>
          <Text size="sm" color="gray-200" tag="p" className="text-xs">{paidTitle}</Text>
        </div>
        <div className="text-right">
          <Text size="xl" weight="bold" tag="p" className="ds-text-priority-high">${unpaid.toFixed(2)}</Text>
          <Text size="sm" color="gray-200" tag="p" className="text-xs">{unpaidTitle}</Text>
        </div>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden flex ds-bg">
        <div className="h-full ds-bg-success" style={{ width: `${paidPct}%` }} />
        <div className="h-full ds-bg-priority-high" style={{ width: `${100 - paidPct}%` }} />
      </div>

      <div className="flex justify-between gap-2 mt-1">
        <span className="text-[10px] font-bold px-2 py-1 rounded ds-bg-success/10 ds-text-success">{paidTag}</span>
        <span className="text-[10px] font-bold px-2 py-1 rounded ds-bg-priority-high/10 ds-text-priority-high">{unpaidTag}</span>
      </div>
    </div>
  );
}

interface Props { role: DashboardRole; token: string }

export function EmployeeDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "employee"],
    queryFn:  () => dashboardApi.getDashboard("employee", token),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const emp = data?.employeeData;

  const statCards = [
    {
      icon: DollarSign,
      label: "monthly revenue",
      value: typeof emp?.employeeStats.totalEarned === "number" ? `$${emp.employeeStats.totalEarned.toLocaleString()}` : "—",
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: FileText,
      label: "my tasks",
      value: String(emp?.employeeStats.totalTasks ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: CheckSquare,
      label: "completed",
      value: String(emp?.employeeStats.completedTasks ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: Clock,
      label: "working hours",
      value: emp?.employeeStats.workingHours ?? "—",
      trend: undefined,
      trendColor: undefined,
    },
  ];

  const cashFlow = emp?.cashFlow || [];
  const paidSalary = emp?.salary?.paid || 0;
  const unpaidSalary = emp?.salary?.unpaid || 0;
  const paidBonus = 0;
  const unpaidBonus = 0;

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your current tasks and earnings."
        />

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map(({ icon: Icon, label, value, trend, trendColor }) => (
            <div key={label} className="rounded-2xl p-6 flex gap-4 ds-bg-form ds-shadow-sm border border-[#E2E8F0]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#e6f7fa] text-[#00b5d8]">
                <Icon size={24} />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <Text size="sm" color="gray-200" className="text-xs font-semibold lowercase mb-1">{label}</Text>
                <Text size="xl" weight="bold" className="text-2xl leading-none">{value}</Text>
                {trend && (
                  <span className={cn("text-[11px] font-bold mt-1", trendColor)}>
                    {trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Working Hours Trend */}
            <DashboardCard title="Working Hours Trend" className="min-h-[300px]">
              <div className="h-[250px] w-full mt-4">
                <WorkingHoursChart data={emp?.workingHoursTrend || []} />
              </div>
            </DashboardCard>

            {/* salary breakdown */}
            <DashboardCard title="salary breakdown">
              <SplitBar
                paid={paidSalary}
                unpaid={unpaidSalary}
                paidTitle="Paid Salary"
                unpaidTitle="Unpaid Salary"
                paidLabel="Paid Salary"
                unpaidLabel="Unpaid Salary"
                paidTag="From Approved Timesheets"
                unpaidTag="Pending Timesheets"
              />
            </DashboardCard>

            {/* bonus details */}
            <DashboardCard title="bonus details">
              <SplitBar
                paid={paidBonus}
                unpaid={unpaidBonus}
                paidTitle="Year-End Bonus"
                unpaidTitle="Performance Bonus"
                paidLabel="Year-End Bonus"
                unpaidLabel="Performance Bonus"
                paidTag="Approved Bonuses"
                unpaidTag="Pending Approvals"
              />
            </DashboardCard>

          </div>

          {/* Right column — latest tasks */}
          <div>
            <DashboardCard
              title="latest tasks"
              action={<ShowAll href="/tasks" />}
            >
              {emp?.tasks && emp.tasks.length > 0 ? (
                <div className="flex flex-col gap-3 mt-4">
                  {emp.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 p-4 border border-[#F5F5F5] rounded-xl"
                    >
                      <div className="min-w-0 flex flex-col gap-1">
                        <Text size="sm" weight="bold" tag="p" className="text-[13px]">{task.name}</Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[11px] flex items-center gap-1">
                          <Clock size={11} />
                          Task Duration: {task.duration}
                        </Text>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full",
                          task.status === "Completed"
                            ? "bg-green-50 text-green-600"
                            : "bg-yellow-50 text-yellow-600"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            task.status === "Completed" ? "bg-green-500" : "bg-yellow-500"
                          )}
                        />
                        {task.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <Text size="sm" color="gray-200" className="text-center py-6">
                  No tasks this month
                </Text>
              )}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
