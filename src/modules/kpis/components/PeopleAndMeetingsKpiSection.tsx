"use client";

import React from "react";
import { Users, UsersRound, Video, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { KpiMetricCard } from "./KpiMetricCard";
import { KpiSectionHeading } from "./KpiSectionHeading";
import { KPI_CARD, toneEdge, toneInk, toneWash, type KpiTone } from "../tones";
import type { UsersKpis, ClientsKpis, MeetingsKpis } from "../types/kpis.types";

interface PeopleAndMeetingsKpiSectionProps {
  users?: UsersKpis;
  clients?: ClientsKpis;
  meetings?: MeetingsKpis;
}

/** The four meeting states, in the order a meeting passes through them. */
const MEETING_STATES: { key: "waiting" | "live" | "ended" | "cancelled"; tone: KpiTone }[] = [
  { key: "waiting", tone: "amber" },
  { key: "live", tone: "green" },
  { key: "ended", tone: "red" },
  { key: "cancelled", tone: "slate" },
];

export function PeopleAndMeetingsKpiSection({
  users,
  clients,
  meetings,
}: PeopleAndMeetingsKpiSectionProps) {
  const t = useTranslations("kpis.people");
  const tm = useTranslations("meetings.status");

  if (!users && !clients && !meetings) return null;

  return (
    <div className="flex flex-col gap-4">
      <KpiSectionHeading icon={Users} title={t("heading")} tone="brand" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {users && (
          <KpiMetricCard
            label={t("totalUsers")}
            metric={users.total}
            subLabel={t("activeInactive", {
              active: users.active || 0,
              inactive: users.inactive || 0,
            })}
            icon={Users}
            tone="sky"
          />
        )}

        {users && (
          <KpiMetricCard
            label={t("activeEmployees")}
            metric={users.employees}
            subLabel={
              users.new_employees
                ? t("joinedThisPeriod", { count: users.new_employees })
                : t("teamStrength")
            }
            icon={UserPlus}
            tone="violet"
          />
        )}

        {clients && (
          <KpiMetricCard
            label={t("totalClients")}
            metric={clients.total}
            subLabel={t("activeWithProjects", { count: clients.with_projects || 0 })}
            icon={UsersRound}
            tone="green"
          />
        )}

        {meetings && (
          <KpiMetricCard
            label={t("totalMeetings")}
            metric={meetings.total}
            subLabel={t("meetingsSub", {
              minutes: meetings.total_duration_minutes || 0,
              peak: meetings.peak_participants || 0,
            })}
            icon={Video}
            tone="brand"
          />
        )}
      </div>

      {meetings && (
        <div className={cn(KPI_CARD, "flex flex-col gap-4 p-6")}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  color: toneInk("brand"),
                  backgroundColor: toneWash("brand"),
                  border: `1px solid ${toneEdge("brand")}`,
                }}
              >
                <Video className="h-3.5 w-3.5" />
              </div>
              <h4 className="text-[15px] font-bold ds-text-primary">{t("meetingsOverview")}</h4>
            </div>

            <span className="text-xs ds-text-gray-200">
              {t("avgPeak")}{" "}
              <strong className="ds-text-primary">{meetings.average_peak_participants}</strong>{" "}
              {t("attendees")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MEETING_STATES.map(({ key, tone }) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-xl p-3.5"
                style={{
                  backgroundColor: toneWash(tone, 12),
                  border: `1px solid ${toneEdge(tone, 20)}`,
                }}
              >
                <span className="text-[12px] font-medium ds-text-gray-100">{tm(key)}</span>
                <strong className="text-[18px] font-bold" style={{ color: toneInk(tone) }}>
                  {meetings[key]}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
