"use client";

import React from "react";
import { FolderKanban, CheckSquare, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { KpiMetricCard } from "./KpiMetricCard";
import { KpiSectionHeading } from "./KpiSectionHeading";
import { ProjectStatusDonutChart } from "./ProjectStatusDonutChart";
import { TaskStatusDonutChart } from "./TaskStatusDonutChart";
import type { ProjectsKpis, TasksKpis, TimesheetsKpis } from "../types/kpis.types";

interface OperationsKpiSectionProps {
  projects?: ProjectsKpis;
  tasks?: TasksKpis;
  timesheets?: TimesheetsKpis;
}

export function OperationsKpiSection({ projects, tasks, timesheets }: OperationsKpiSectionProps) {
  const t = useTranslations("kpis.operations");
  const th = useTranslations("kpis.trends");

  if (!projects && !tasks && !timesheets) return null;

  return (
    <div className="flex flex-col gap-4">
      <KpiSectionHeading icon={FolderKanban} title={t("heading")} tone="violet" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects && (
          <KpiMetricCard
            label={t("totalProjects")}
            metric={projects.total}
            subLabel={t("completionRate", { rate: projects.completion_rate || 0 })}
            icon={FolderKanban}
            tone="violet"
          />
        )}

        {tasks && (
          <KpiMetricCard
            label={t("totalTasks")}
            metric={tasks.total}
            subLabel={t("tasksDone", {
              rate: tasks.completion_rate || 0,
              count: tasks.completed?.value || 0,
            })}
            icon={CheckSquare}
            tone="green"
          />
        )}

        {timesheets && (
          <KpiMetricCard
            label={t("trackedHours")}
            metric={timesheets.hours}
            suffix={th("hoursSuffix")}
            subLabel={t("hoursSplit", {
              approved: timesheets.approved_hours || 0,
              pending: timesheets.pending_hours || 0,
            })}
            icon={Clock}
            tone="amber"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ProjectStatusDonutChart projects={projects} />
        <TaskStatusDonutChart tasks={tasks} />
      </div>
    </div>
  );
}
