"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { KPI_CARD, readableInk } from "../tones";
import type { TasksKpis } from "../types/kpis.types";

interface TaskStatusDonutChartProps {
  tasks?: TasksKpis;
}

interface StatusSlice {
  /** Stable identifier — colour lookups key off this, never the label. */
  key: string;
  name: string;
  value: number;
  color: string;
}

const TASK_COLORS: Record<string, string> = {
  Backlog: "#94A3B8",
  "To Do": "#64748B",
  "In Progress": "#0088FF",
  "In Review": "#9810FA",
  Completed: "#00D084",
  Pending: "#FFE600",
};

export function TaskStatusDonutChart({ tasks }: TaskStatusDonutChartProps) {
  const t = useTranslations("kpis.taskStatus");
  const byStatus = tasks?.by_status || {};
  const total = (tasks?.total?.value as number) || 0;

  const rawData: StatusSlice[] = [
    { key: "Backlog", name: t("backlog"), value: byStatus.backlog || 0, color: TASK_COLORS.Backlog },
    { key: "To Do", name: t("todo"), value: byStatus.todo || 0, color: TASK_COLORS["To Do"] },
    { key: "In Progress", name: t("inProgress"), value: byStatus.in_progress || 0, color: TASK_COLORS["In Progress"] },
    { key: "In Review", name: t("inReview"), value: byStatus.in_review || 0, color: TASK_COLORS["In Review"] },
    { key: "Completed", name: t("completed"), value: byStatus.completed || 0, color: TASK_COLORS.Completed },
    { key: "Pending", name: t("pending"), value: byStatus.pending || 0, color: TASK_COLORS.Pending },
  ].filter((d) => total === 0 || d.value > 0);

  // Fallback if 0
  const chartData = rawData.length > 0 ? rawData : [
    { key: "In Progress", name: t("inProgress"), value: 1, color: TASK_COLORS["In Progress"] },
    { key: "Completed", name: t("completed"), value: 2, color: TASK_COLORS.Completed },
    { key: "Backlog", name: t("backlog"), value: 1, color: TASK_COLORS.Backlog },
  ];

  // Custom label on the donut slice
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    fill,
  }: any) => {
    if (!percent || percent < 0.08) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={readableInk(String(fill))}
        textAnchor="middle"
        dominantBaseline="central"
        className="select-none text-[12px] font-extrabold tracking-tight"
        style={{ fontWeight: 800 }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className={cn(KPI_CARD, "flex flex-col gap-4 p-6")}>
      {/* Title */}
      <h3 className="text-[18px] font-bold ds-text-primary">
        {t("heading")}
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[260px]">
        {/* Donut Chart */}
        <div className="w-full sm:w-[60%] h-[240px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                stroke="var(--color-bg-form)"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as StatusSlice;
                    return (
                      <div
                        className="flex items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-lg"
                        style={{ backgroundColor: d.color, color: readableInk(d.color) }}
                      >
                        <span>{d.name}: {d.value}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend on the right */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 sm:w-[40%] sm:ps-4">
          {chartData.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-[13px]">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-medium ds-text-gray-100">
                {item.name}
              </span>
              <span className="ms-auto font-bold text-xs text-muted-foreground">
                ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
