"use client";

import React from "react";
import { FolderKanban, CheckSquare, Clock, CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
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
      <div className="flex items-center gap-2">
        <FolderKanban className="w-5 h-5 text-[#25C6DA]" />
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">
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
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-[#9810FA]" />
                <h4 className="text-sm font-bold text-foreground">Projects Status Distribution</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#9810FA]/15 text-[#9810FA]">
                {projects.completion_rate}% Completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex">
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
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-muted-foreground block text-[11px]">Pending</span>
                <strong className="text-amber-500 text-sm font-bold">{projects.pending}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-muted-foreground block text-[11px]">In Progress</span>
                <strong className="text-sky-500 text-sm font-bold">{projects.in_progress}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-muted-foreground block text-[11px]">Completed</span>
                <strong className="text-emerald-500 text-sm font-bold">{projects.completed}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Status Breakdown Card */}
        {tasks && (
          <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#4CAF50]" />
                <h4 className="text-sm font-bold text-foreground">Tasks Pipeline Breakdown</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#4CAF50]/15 text-[#4CAF50]">
                {tasks.completion_rate}% Resolved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px]">Backlog</span>
                <strong className="text-foreground text-sm font-bold">{tasks.by_status?.backlog || 0}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50 border border-border/40">
                <span className="text-muted-foreground block text-[11px]">To Do</span>
                <strong className="text-foreground text-sm font-bold">{tasks.by_status?.todo || 0}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
                <span className="text-muted-foreground block text-[11px]">In Progress</span>
                <strong className="text-sky-500 text-sm font-bold">{tasks.by_status?.in_progress || 0}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <span className="text-muted-foreground block text-[11px]">In Review</span>
                <strong className="text-purple-500 text-sm font-bold">{tasks.by_status?.in_review || 0}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-muted-foreground block text-[11px]">Completed</span>
                <strong className="text-emerald-500 text-sm font-bold">{tasks.by_status?.completed || 0}</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-muted-foreground block text-[11px]">Pending</span>
                <strong className="text-amber-500 text-sm font-bold">{tasks.by_status?.pending || 0}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
