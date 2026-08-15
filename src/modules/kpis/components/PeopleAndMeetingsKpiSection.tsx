"use client";

import React from "react";
import { Users, UsersRound, Video, Radio, Clock, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { KpiMetricCard } from "./KpiMetricCard";
import type { UsersKpis, ClientsKpis, MeetingsKpis } from "../types/kpis.types";

interface PeopleAndMeetingsKpiSectionProps {
  users?: UsersKpis;
  clients?: ClientsKpis;
  meetings?: MeetingsKpis;
}

export function PeopleAndMeetingsKpiSection({ users, clients, meetings }: PeopleAndMeetingsKpiSectionProps) {
  if (!users && !clients && !meetings) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-[#25C6DA]" />
        <h2 className="text-[20px] font-bold text-foreground tracking-tight">
          People & Collaboration KPIs
        </h2>
      </div>

      {/* Primary 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        {users && (
          <KpiMetricCard
            label="Total Platform Users"
            metric={users.total}
            subLabel={`${users.active || 0} active • ${users.inactive || 0} inactive`}
            icon={Users}
            iconBg="#E6F6FE"
            iconColor="#03A9F4"
          />
        )}

        {/* Total Employees */}
        {users && (
          <KpiMetricCard
            label="Active Employees"
            metric={users.employees}
            subLabel={users.new_employees ? `+${users.new_employees} joined this period` : "Team strength"}
            icon={UserPlus}
            iconBg="#FAF5FF"
            iconColor="#9810FA"
          />
        )}

        {/* Total Clients */}
        {clients && (
          <KpiMetricCard
            label="Total Clients"
            metric={clients.total}
            subLabel={`${clients.with_projects || 0} active with projects`}
            icon={UsersRound}
            iconBg="#EDF7EE"
            iconColor="#4CAF50"
          />
        )}

        {/* Total Meetings */}
        {meetings && (
          <KpiMetricCard
            label="Total Meetings"
            metric={meetings.total}
            subLabel={`${meetings.total_duration_minutes || 0} mins total • Peak: ${meetings.peak_participants || 0}`}
            icon={Video}
            iconBg="#FFFDEB"
            iconColor="#E8D636"
          />
        )}
      </div>

      {/* Meetings Breakdown Detail Card */}
      {meetings && (
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#25C6DA]" />
              <h4 className="text-sm font-bold text-foreground">Meetings & Video Rooms Overview</h4>
            </div>
            <span className="text-xs text-muted-foreground">
              Avg Peak: <strong className="text-foreground">{meetings.average_peak_participants}</strong> attendees
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Waiting</span>
              <strong className="text-amber-500 text-sm font-bold">{meetings.waiting}</strong>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Live</span>
              <strong className="text-emerald-500 text-sm font-bold">{meetings.live}</strong>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Ended</span>
              <strong className="text-sky-500 text-sm font-bold">{meetings.ended}</strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
              <span className="text-muted-foreground font-medium">Cancelled</span>
              <strong className="text-rose-500 text-sm font-bold">{meetings.cancelled}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
