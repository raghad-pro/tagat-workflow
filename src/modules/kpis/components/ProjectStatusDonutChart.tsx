"use client";

import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from "recharts";
import type { ProjectsKpis } from "../types/kpis.types";

interface ProjectStatusDonutChartProps {
  projects?: ProjectsKpis;
}

interface StatusSlice {
  /** Stable identifier — colour lookups key off this, never the label. */
  key: string;
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  Pending: "#0088FF",
  "In progress": "#00D084",
  Completed: "#FFE600",
};

export function ProjectStatusDonutChart({ projects }: ProjectStatusDonutChartProps) {
  const t = useTranslations("kpis.projectStatus");
  const pending = projects?.pending ?? 0;
  const inProgress = projects?.in_progress ?? 0;
  const completed = projects?.completed ?? 0;
  const total = (projects?.total?.value as number) || (pending + inProgress + completed);

  // If no data exists, provide sample or zero data
  const data: StatusSlice[] = [
    { key: "Pending", name: t("pending"), value: pending, color: COLORS.Pending },
    { key: "In progress", name: t("inProgress"), value: inProgress, color: COLORS["In progress"] },
    { key: "Completed", name: t("completed"), value: completed, color: COLORS.Completed },
  ].filter((d) => total === 0 || d.value > 0);

  // Fallback for visual demonstration if total is 0
  const chartData = data.length > 0 ? data : [
    { key: "In progress", name: t("inProgress"), value: 1, color: COLORS["In progress"] },
    { key: "Completed", name: t("completed"), value: 1, color: COLORS.Completed },
  ];

  const totalCount = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // Custom label on the donut slice (e.g. "50.0%")
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    if (!percent || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#000000"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[13px] font-extrabold tracking-tight select-none"
        style={{ fontWeight: 800, textShadow: "0 0 2px rgba(255,255,255,0.8)" }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
      {/* Title */}
      <h3 className="text-[18px] font-bold text-[#000000] dark:text-white">
        {t("heading")}
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[260px]">
        {/* Donut Chart */}
        <div className="w-full sm:w-[65%] h-[240px] relative flex items-center justify-center">
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
                stroke="#FFFFFF"
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
                        className="px-3.5 py-1.5 rounded-[8px] text-white font-bold text-xs shadow-lg flex items-center justify-center"
                        style={{
                          backgroundColor: d.key === "Completed" ? "#FFA500" : d.color,
                        }}
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

        {/* Legend on the right matching the user image */}
        <div className="flex flex-col gap-3.5 sm:w-[35%] sm:ps-4 justify-center">
          <div className="flex items-center gap-2.5 text-[14px]">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS.Pending }}
            />
            <span className="text-[#424242] dark:text-gray-200 font-medium">{t("pending")}</span>
            {pending > 0 && (
              <span className="ms-auto font-bold text-xs text-muted-foreground">
                ({pending})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[14px]">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS["In progress"] }}
            />
            <span className="text-[#424242] dark:text-gray-200 font-medium">{t("inProgress")}</span>
            {inProgress > 0 && (
              <span className="ms-auto font-bold text-xs text-muted-foreground">
                ({inProgress})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[14px]">
            <span
              className="w-3.5 h-3.5 rounded-full shrink-0"
              style={{ backgroundColor: COLORS.Completed }}
            />
            <span className="text-[#424242] dark:text-gray-200 font-medium">{t("completed")}</span>
            {completed > 0 && (
              <span className="ms-auto font-bold text-xs text-muted-foreground">
                ({completed})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
