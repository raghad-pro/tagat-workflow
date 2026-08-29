"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Calendar,
  RotateCw,
  TrendingUp,
  DollarSign,
  FolderKanban,
  Users,
  Layers,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { useKpiDashboard, useKpiFilters, useKpiTrends } from "../hooks/useKpis";
import { FinancialKpiSection } from "./FinancialKpiSection";
import { OperationsKpiSection } from "./OperationsKpiSection";
import { PeopleAndMeetingsKpiSection } from "./PeopleAndMeetingsKpiSection";
import { TrendsChart } from "./TrendsChart";
import { KPI_CARD } from "../tones";
import { cn } from "@/lib/utils";

type KpiTab = "all" | "financial" | "operations" | "people" | "trends";

/** The tab strip, in reading order. `all` shows every section below. */
const TABS: { key: KpiTab; copy: string; icon: LucideIcon }[] = [
  { key: "all", copy: "tabs.overview", icon: Layers },
  { key: "financial", copy: "tabs.financial", icon: DollarSign },
  { key: "operations", copy: "tabs.operations", icon: FolderKanban },
  { key: "people", copy: "tabs.people", icon: Users },
  { key: "trends", copy: "tabs.trends", icon: TrendingUp },
];

/** The control shell the year and month pickers share. */
const CONTROL = cn(KPI_CARD, "flex h-10 items-center gap-2 rounded-xl px-3.5");

export function KpisDashboardPage() {
  const tk = useTranslations("kpis");

  const [activeTab, setActiveTab] = useState<KpiTab>("all");
  // Opening on today rather than a pinned year and month, which quietly became
  // wrong the moment the calendar moved past them.
  const now = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(now.getMonth() + 1);

  const { data: filtersData } = useKpiFilters();
  const {
    data: kpiData,
    isLoading,
    refetch,
    isRefetching,
  } = useKpiDashboard({ year: selectedYear, month: selectedMonth });
  const { data: trendsData } = useKpiTrends(selectedYear);

  // Years the API knows about, falling back to a window around today.
  const availableYears = useMemo(() => {
    if (filtersData?.years?.length) return filtersData.years;
    const thisYear = now.getFullYear();
    return [thisYear, thisYear - 1, thisYear - 2];
  }, [filtersData?.years, now]);

  const availableMonths = useMemo(() => {
    const monthList = filtersData?.months?.[String(selectedYear)];
    if (monthList && monthList.length > 0) return monthList;

    // Labelled from the message files so the fallback list follows the
    // interface language, same as the list the filters API returns.
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: tk(`months.${i + 1}` as never),
    }));
  }, [filtersData?.months, selectedYear, tk]);

  const finalTrends = kpiData?.trends || trendsData;

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-8 pb-12">
        {/* Background glow, matching the meetings page. */}
        <div
          className="pointer-events-none fixed top-0 end-0 -z-10 h-[688px] w-[820px] rounded-full blur-[96px]"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-btn-brand) 14%, transparent)" }}
        />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-[31px] font-bold leading-[47px] tracking-tight ds-text-primary">
              {tk("pageTitle")}
            </h1>
            <p className="text-[16px] font-normal leading-6 ds-text-gray-100">
              {tk("pageSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className={CONTROL}>
              <Calendar className="h-4 w-4" style={{ color: "var(--color-btn-brand)" }} />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                aria-label={tk("pageTitle")}
                className="cursor-pointer bg-transparent text-[14px] font-medium ds-text-primary focus:outline-none"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-popover text-foreground">
                    {tk("year", { year: yr })}
                  </option>
                ))}
              </select>
            </div>

            <div className={CONTROL}>
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val ? Number(val) : undefined);
                }}
                aria-label={tk("allMonths")}
                className="cursor-pointer bg-transparent text-[14px] font-medium ds-text-primary focus:outline-none"
              >
                <option value="" className="bg-popover text-foreground">
                  {tk("allMonths")}
                </option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-popover text-foreground">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className={cn(
                CONTROL,
                "cursor-pointer text-[14px] font-medium ds-text-gray-100 transition-colors",
                "hover:text-[color:var(--color-text-primary)]",
                "disabled:cursor-default disabled:opacity-50"
              )}
              title={tk("refreshTitle")}
            >
              <RotateCw
                className={cn("h-4 w-4", isRefetching && "animate-spin")}
                style={{ color: "var(--color-btn-brand)" }}
              />
              <span className="hidden sm:inline">{tk("refresh")}</span>
            </button>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label={tk("pageTitle")}
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          {TABS.map(({ key, copy, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-4",
                  "text-[14px] font-semibold transition-all duration-200",
                  isActive
                    ? "font-bold text-white"
                    : cn(
                        KPI_CARD,
                        "ds-text-gray-100 hover:-translate-y-px",
                        "hover:text-[color:var(--color-text-primary)]"
                      )
                )}
                // The lit-tab glow is a brand-tinted colour-mix, which Tailwind
                // cannot express as an arbitrary shadow without the commas
                // being parsed as class separators.
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--color-btn-brand)",
                        boxShadow:
                          "0 8px 20px -8px color-mix(in srgb, var(--color-btn-brand) 85%, transparent)",
                      }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
                <span>{tk(copy as never)}</span>
              </button>
            );
          })}
        </div>

        {/* ── Sections ───────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          {(activeTab === "all" || activeTab === "trends") && <TrendsChart trends={finalTrends} />}

          {(activeTab === "all" || activeTab === "financial") && (
            <FinancialKpiSection financial={kpiData?.financial} invoices={kpiData?.invoices} />
          )}

          {(activeTab === "all" || activeTab === "operations") && (
            <OperationsKpiSection
              projects={kpiData?.projects}
              tasks={kpiData?.tasks}
              timesheets={kpiData?.timesheets}
            />
          )}

          {(activeTab === "all" || activeTab === "people") && (
            <PeopleAndMeetingsKpiSection
              users={kpiData?.users}
              clients={kpiData?.clients}
              meetings={kpiData?.meetings}
            />
          )}
        </div>
      </div>
    </PageContainer>
  );
}
