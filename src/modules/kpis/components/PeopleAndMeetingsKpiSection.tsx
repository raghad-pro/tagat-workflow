"use client";

import React from "react";
import { Users, UsersRound, Video, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { KpiMetricCard } from "./KpiMetricCard";
import type { UsersKpis, ClientsKpis, MeetingsKpis } from "../types/kpis.types";

interface PeopleAndMeetingsKpiSectionProps {
  users?: UsersKpis;
  clients?: ClientsKpis;
  meetings?: MeetingsKpis;
}

export function PeopleAndMeetingsKpiSection({ users, clients, meetings }: PeopleAndMeetingsKpiSectionProps) {
  const t = useTranslations("kpis.people");
  const tm = useTranslations("meetings.status");

  if (!users && !clients && !meetings) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[8px] bg-[#E6F6FE] flex items-center justify-center text-[#03A9F4]">
          <Users className="w-5 h-5" />
        </div>
        <h2 className="text-[20px] sm:text-[22px] font-bold text-[#000000] dark:text-white tracking-tight leading-[32px]">
          {t("heading")}
        </h2>
      </div>

      {/* Primary 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        {users && (
          <KpiMetricCard
            label={t("totalUsers")}
            metric={users.total}
            subLabel={t("activeInactive", { active: users.active || 0, inactive: users.inactive || 0 })}
            icon={Users}
            iconBg="#E6F6FE"
            iconColor="#03A9F4"
          />
        )}

        {/* Total Employees */}
        {users && (
          <KpiMetricCard
            label={t("activeEmployees")}
            metric={users.employees}
            subLabel={users.new_employees ? t("joinedThisPeriod", { count: users.new_employees }) : t("teamStrength")}
            icon={UserPlus}
            iconBg="#FAF5FF"
            iconColor="#9810FA"
          />
        )}

        {/* Total Clients */}
        {clients && (
          <KpiMetricCard
            label={t("totalClients")}
            metric={clients.total}
            subLabel={t("activeWithProjects", { count: clients.with_projects || 0 })}
            icon={UsersRound}
            iconBg="#EDF7EE"
            iconColor="#4CAF50"
          />
        )}

        {/* Total Meetings */}
        {meetings && (
          <KpiMetricCard
            label={t("totalMeetings")}
            metric={meetings.total}
            subLabel={t("meetingsSub", { minutes: meetings.total_duration_minutes || 0, peak: meetings.peak_participants || 0 })}
            icon={Video}
            iconBg="rgba(37, 198, 218, 0.12)"
            iconColor="#25C6DA"
          />
        )}
      </div>

      {/* Meetings Breakdown Detail Card */}
      {meetings && (
        <div className="ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[6px] bg-[#E6F6FE] flex items-center justify-center text-[#25C6DA]">
                <Video className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-[15px] font-bold text-[#000000] dark:text-white">{t("meetingsOverview")}</h4>
            </div>
            <span className="text-xs text-[#707070] dark:text-gray-400">
              {t("avgPeak")} <strong className="text-[#000000] dark:text-white">{meetings.average_peak_participants}</strong> {t("attendees")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3.5 rounded-[8px] bg-[#FFFDEB] flex items-center justify-between">
              <span className="text-[#707070] font-medium text-[12px]">{tm("waiting")}</span>
              <strong className="text-[#D97706] text-[18px] font-bold">{meetings.waiting}</strong>
            </div>

            <div className="p-3.5 rounded-[8px] bg-[#EDF7EE] flex items-center justify-between">
              <span className="text-[#707070] font-medium text-[12px]">{tm("live")}</span>
              <strong className="text-[#4CAF50] text-[18px] font-bold">{meetings.live}</strong>
            </div>

            <div className="p-3.5 rounded-[8px] bg-[#FEECEB] flex items-center justify-between">
              <span className="text-[#707070] font-medium text-[12px]">{tm("ended")}</span>
              <strong className="text-[#F44336] text-[18px] font-bold">{meetings.ended}</strong>
            </div>

            <div className="p-3.5 rounded-[8px] bg-[#F3F4F6] flex items-center justify-between">
              <span className="text-[#707070] font-medium text-[12px]">{tm("cancelled")}</span>
              <strong className="text-[#64748B] text-[18px] font-bold">{meetings.cancelled}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
