"use client";

import { useTranslations } from "next-intl";
import { FolderKanban, CheckSquare, Clock, DollarSign } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardRole } from "../api/dashboard.api";
import { dashboardApi } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard } from "./DashboardCard";
import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { SplitBarData } from "../types/dashboard.types";

// ─── SplitBar sub-component ───────────────────────────────────────────────────
function SplitBar({ paid, unpaid, paidLabel, unpaidLabel, paidTag, unpaidTag }: SplitBarData) {
  const total = paid + unpaid;
  const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <Text size="xl" weight="bold" tag="p" className="ds-text-success">{paid}</Text>
          <Text size="sm" color="gray-200" tag="p">{paidLabel}</Text>
        </div>
        <div className="text-right">
          <Text size="xl" weight="bold" tag="p" className="ds-text-priority-high">{unpaid}</Text>
          <Text size="sm" color="gray-200" tag="p">{unpaidLabel}</Text>
        </div>
      </div>

      <div className="w-full h-2.5 rounded-full overflow-hidden flex ds-bg">
        <div className="h-full ds-bg-success" style={{ width: `${paidPct}%` }} />
        <div className="h-full ds-bg-priority-high" style={{ width: `${100 - paidPct}%` }} />
      </div>

      <div className="flex justify-between gap-2">
        <span className="text-[10px] font-bold px-2 py-1 rounded ds-bg-plan-basic ds-text-plan-basic">{paidTag}</span>
        <span className="text-[10px] font-bold px-2 py-1 rounded ds-bg-priority-high ds-text-priority-high">{unpaidTag}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props { role: DashboardRole; token: string }

export function EmployeeDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "employee"],
    queryFn:  () => dashboardApi.getEmployeeDashboard(token),
    enabled:  !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const emp = data?.employeeData;

  // ─── Stat cards derived from real API data ────────────────────────────────
  const statCards = [
    {
      icon: DollarSign,
      label: "Pending Timesheets",
      value: String(emp?.employeeStats.pendingTimesheets ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: FolderKanban,
      label: "My Tasks",
      value: String(emp?.employeeStats.totalTasks ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: CheckSquare,
      label: "Completed",
      value: String(emp?.employeeStats.completedTasks ?? "—"),
      trend: undefined,
      trendColor: undefined,
    },
    {
      icon: Clock,
      label: "Working Hours",
      value: emp?.employeeStats.workingHours ?? "—",
      trend: undefined,
      trendColor: undefined,
    },
  ];

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <PageHeader
          title={t("title")}
          subtitle="Overview of your current tasks and timesheets."
        />

        {/* 4 stat cards — real data */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ icon: Icon, label, value, trend, trendColor }) => (
            <div key={label} className="rounded-2xl p-4 flex gap-3 ds-bg-form ds-border-form ds-shadow-sm">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ds-bg-primary-200">
                <Icon size={16} className="ds-text-brand" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <Text size="sm" color="gray-200" className="text-[11px] leading-tight">{label}</Text>
                <Text size="xl" weight="bold" className="leading-tight">{value}</Text>
                {trend && (
                  <span className="text-[11px] font-semibold" style={{ color: trendColor ?? "var(--color-chart-new)" }}>
                    {trend}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="xl:col-span-2 flex flex-col gap-6">

            {/* Timesheet breakdown — replaces Revenue vs Expenses (no invoice data for employee) */}
            {emp?.salary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardCard title="Timesheet Breakdown">
                  <SplitBar {...emp.salary} />
                </DashboardCard>

                {/* Task distribution donut summary */}
                <DashboardCard title="Task Overview">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="gray-200" tag="span">Total Tasks</Text>
                      <Text size="sm" weight="bold" tag="span">{emp.employeeStats.totalTasks}</Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="gray-200" tag="span">Completed</Text>
                      <Text size="sm" weight="bold" tag="span" className="ds-text-success">
                        {emp.employeeStats.completedTasks}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text size="sm" color="gray-200" tag="span">In Progress / Pending</Text>
                      <Text size="sm" weight="bold" tag="span" className="ds-text-priority-medium">
                        {emp.employeeStats.totalTasks - emp.employeeStats.completedTasks}
                      </Text>
                    </div>

                    {/* Progress bar */}
                    {emp.employeeStats.totalTasks > 0 && (
                      <div className="w-full h-2.5 rounded-full overflow-hidden flex ds-bg mt-1">
                        <div
                          className="h-full ds-bg-success"
                          style={{
                            width: `${Math.round((emp.employeeStats.completedTasks / emp.employeeStats.totalTasks) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                    <Text size="sm" color="gray-200" className="text-[10px]">
                      {emp.employeeStats.totalTasks > 0
                        ? `${Math.round((emp.employeeStats.completedTasks / emp.employeeStats.totalTasks) * 100)}% completion rate`
                        : "No tasks this month"}
                    </Text>
                  </div>
                </DashboardCard>
              </div>
            )}
          </div>

          {/* ── Right column – Latest tasks from API ─────────────────────────── */}
          <div>
            <DashboardCard
              title="Latest Tasks"
              action={
                <span className="text-xs font-semibold ds-text-gray-200">
                  {emp?.employeeStats.totalTasks ?? 0} tasks
                </span>
              }
              className="h-full"
            >
              {emp?.tasks && emp.tasks.length > 0 ? (
                <div className="flex flex-col">
                  {emp.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 py-3 border-b ds-border-form last:border-0"
                    >
                      <div className="min-w-0">
                        <Text size="sm" weight="bold" tag="p">{task.name}</Text>
                        <Text size="sm" color="gray-200" tag="p" className="text-[10px] mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          Task Duration: {task.duration}
                        </Text>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
                          task.status === "Completed"
                            ? "ds-bg-plan-basic ds-text-plan-basic"
                            : "ds-bg-priority-medium ds-text-priority-medium"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            task.status === "Completed" ? "ds-bg-success" : "ds-bg-priority-medium"
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