"use client";

import React from "react";
import { FolderKanban, CheckSquare, Clock } from "lucide-react";
import { KpiMetricCard } from "./KpiMetricCard";
import { ProjectStatusDonutChart } from "./ProjectStatusDonutChart";
import { TaskStatusDonutChart } from "./TaskStatusDonutChart";
import type { ProjectsKpis, TasksKpis, TimesheetsKpis } from "../types/kpis.types";

interface OperationsKpiSectionProps {
  projects?: ProjectsKpis;
  tasks?: TasksKpis;
  timesheets?: TimesheetsKpis;
}

export function OperationsKpiSection({ projects, tasks, timesheets }: OperationsKpiSectionProps) {
  if (!projects && !tasks && !timesheets) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-[#FAF5FF] flex items-center justify-center text-[#9810FA]">
          <FolderKanban className="w-5 h-5" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#000000] dark:text-white tracking-tight leading-[32px]">
          Operations & Project Delivery KPIs
        </h2>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Projects Card */}
        {projects && (
          <KpiMetricCard
            label="Total Projects"
            metric={projects.total}
            subLabel={`${projects.completion_rate || 0}% Completion Rate`}
            icon={FolderKanban}
            iconBg="#FAF5FF"
            iconColor="#9810FA"
          />
        )}

        {/* Tasks Card */}
        {tasks && (
          <KpiMetricCard
            label="Total Tasks"
            metric={tasks.total}
            subLabel={`${tasks.completion_rate || 0}% Done (${tasks.completed?.value || 0} tasks)`}
            icon={CheckSquare}
            iconBg="#EDF7EE"
            iconColor="#4CAF50"
          />
        )}

        {/* Timesheets Card */}
        {timesheets && (
          <KpiMetricCard
            label="Tracked Hours"
            metric={timesheets.hours}
            suffix=" hrs"
            subLabel={`${timesheets.approved_hours || 0} approved • ${timesheets.pending_hours || 0} pending`}
            icon={Clock}
            iconBg="#FFFDEB"
            iconColor="#E8D636"
          />
        )}
      </div>

      {/* Interactive Donut Charts Grid matching user screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectStatusDonutChart projects={projects} />
        <TaskStatusDonutChart tasks={tasks} />
      </div>
    </div>
  );
}
