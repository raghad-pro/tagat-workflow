"use client";

import React from "react";
import { FolderKanban, CheckSquare, Clock } from "lucide-react";
import { KpiMetricCard } from "./KpiMetricCard";
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

      {/* Detailed Operations Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projects Status Breakdown Card */}
        {projects && (
          <div className="bg-white dark:bg-card rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[6px] bg-[#FAF5FF] flex items-center justify-center text-[#9810FA]">
                  <FolderKanban className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[15px] font-bold text-[#000000] dark:text-white">Projects Status Distribution</h4>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FAF5FF] text-[#9810FA]">
                {projects.completion_rate}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#F3F4F6] dark:bg-muted rounded-full h-2.5 overflow-hidden flex">
              <div
                className="bg-[#4CAF50] transition-all"
                style={{ width: `${((projects.completed || 0) / (projects.total?.value || 1)) * 100}%` }}
                title={`Completed: ${projects.completed}`}
              />
              <div
                className="bg-[#03A9F4] transition-all"
                style={{ width: `${((projects.in_progress || 0) / (projects.total?.value || 1)) * 100}%` }}
                title={`In Progress: ${projects.in_progress}`}
              />
              <div
                className="bg-[#E8D636] transition-all"
                style={{ width: `${((projects.pending || 0) / (projects.total?.value || 1)) * 100}%` }}
                title={`Pending: ${projects.pending}`}
              />
            </div>

            {/* Breakdown Badges */}
            <div className="grid grid-cols-3 gap-3 pt-1 text-center text-xs">
              <div className="p-3 rounded-[8px] bg-[#FFFDEB] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">Pending</span>
                <strong className="text-[#D97706] text-[18px] font-bold">{projects.pending}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#E6F6FE] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">In Progress</span>
                <strong className="text-[#03A9F4] text-[18px] font-bold">{projects.in_progress}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#EDF7EE] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">Completed</span>
                <strong className="text-[#4CAF50] text-[18px] font-bold">{projects.completed}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Status Breakdown Card */}
        {tasks && (
          <div className="bg-white dark:bg-card rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-[6px] bg-[#EDF7EE] flex items-center justify-center text-[#4CAF50]">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-[15px] font-bold text-[#000000] dark:text-white">Tasks Pipeline Breakdown</h4>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EDF7EE] text-[#4CAF50]">
                {tasks.completion_rate}% Resolved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-[8px] bg-[#F8FAFC] dark:bg-muted/40 flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">Backlog</span>
                <strong className="text-[#000000] dark:text-white text-[16px] font-bold">{tasks.by_status?.backlog || 0}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#F8FAFC] dark:bg-muted/40 flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">To Do</span>
                <strong className="text-[#000000] dark:text-white text-[16px] font-bold">{tasks.by_status?.todo || 0}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#E6F6FE] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">In Progress</span>
                <strong className="text-[#03A9F4] text-[16px] font-bold">{tasks.by_status?.in_progress || 0}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#FAF5FF] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">In Review</span>
                <strong className="text-[#9810FA] text-[16px] font-bold">{tasks.by_status?.in_review || 0}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#EDF7EE] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">Completed</span>
                <strong className="text-[#4CAF50] text-[16px] font-bold">{tasks.by_status?.completed || 0}</strong>
              </div>
              <div className="p-3 rounded-[8px] bg-[#FFFDEB] flex flex-col gap-0.5">
                <span className="text-[#707070] text-[11px] font-medium">Pending</span>
                <strong className="text-[#D97706] text-[16px] font-bold">{tasks.by_status?.pending || 0}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
