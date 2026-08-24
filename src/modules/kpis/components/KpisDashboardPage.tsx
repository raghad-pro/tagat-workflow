"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Calendar,
  RotateCw,
  TrendingUp,
  DollarSign,
  FolderKanban,
  Users,
  Layers,
} from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { useKpiDashboard, useKpiFilters, useKpiTrends } from "../hooks/useKpis";
import { FinancialKpiSection } from "./FinancialKpiSection";
import { OperationsKpiSection } from "./OperationsKpiSection";
import { PeopleAndMeetingsKpiSection } from "./PeopleAndMeetingsKpiSection";
import { TrendsChart } from "./TrendsChart";
import { cn } from "@/lib/utils";

type KpiTab = "all" | "financial" | "operations" | "people" | "trends";

export function KpisDashboardPage() {
  const t = useTranslations("common");

  const [activeTab, setActiveTab] = useState<KpiTab>("all");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(8);

  const { data: filtersData } = useKpiFilters();
  const { data: kpiData, isLoading, refetch, isRefetching } = useKpiDashboard({
    year: selectedYear,
    month: selectedMonth,
  });
  const { data: trendsData } = useKpiTrends(selectedYear);

  // Available years from filters API or fallback
  const availableYears = useMemo(() => {
    return filtersData?.years || [2026, 2025, 2024];
  }, [filtersData?.years]);

  // Available months from filters API or standard 12 months
  const availableMonths = useMemo(() => {
    const monthList = filtersData?.months?.[String(selectedYear)];
    if (monthList && monthList.length > 0) return monthList;

    return [
      { value: 1, label: "January" },
      { value: 2, label: "February" },
      { value: 3, label: "March" },
      { value: 4, label: "April" },
      { value: 5, label: "May" },
      { value: 6, label: "June" },
      { value: 7, label: "July" },
      { value: 8, label: "August" },
      { value: 9, label: "September" },
      { value: 10, label: "October" },
      { value: 11, label: "November" },
      { value: 12, label: "December" },
    ];
  }, [filtersData?.months, selectedYear]);

  // Combined trends data (either from dashboard payload or trends endpoint)
  const finalTrends = kpiData?.trends || trendsData;

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-8 pb-12">
        {/* ── Background Glow Overlay matching Meetings page ── */}
        <div
          className="pointer-events-none fixed top-0 right-0 w-[820px] h-[688px] rounded-full blur-[96px] -z-10"
          style={{ backgroundColor: "rgba(81, 209, 225, 0.15)" }}
        />

        {/* ── Page Header (Exact Figma match) ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[31px] font-bold tracking-tight text-[#000000] dark:text-white leading-[47px]">
              KPIs & Performance Dashboard
            </h1>
            <p className="text-[16px] text-[#424242] dark:text-gray-300 font-normal leading-[24px]">
              Executive business metrics, financial health, and operational performance
            </p>
          </div>

          {/* ── Date Filters & Actions ── */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center gap-2 ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] px-4 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              <Calendar className="w-4 h-4 text-[#25C6DA]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-[14px] font-medium text-[#000000] dark:text-white focus:outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-popover text-foreground">
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2 ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] px-4 py-2 shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val ? Number(val) : undefined);
                }}
                className="bg-transparent text-[14px] font-medium text-[#000000] dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-popover text-foreground">All Months (Annual)</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-popover text-foreground">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center gap-2 px-5 py-2.5 h-[40px] rounded-[8px] ds-bg-form border border-slate-100 dark:border-slate-800 text-[#424242] dark:text-gray-200 text-[15px] font-medium hover:bg-gray-50 dark:hover:bg-muted transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.35)] disabled:opacity-50"
              title="Refresh KPI Metrics"
            >
              <RotateCw className={cn("w-4 h-4 text-[#25C6DA]", isRefetching && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "all"
                ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#707070] dark:text-gray-300 hover:text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Overview & All KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab("financial")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "financial"
                ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#707070] dark:text-gray-300 hover:text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            )}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financial & Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab("operations")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "operations"
                ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#707070] dark:text-gray-300 hover:text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            )}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Projects & Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "people"
                ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#707070] dark:text-gray-300 hover:text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            )}
          >
            <Users className="w-4 h-4" />
            <span>People & Meetings</span>
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-[14px] font-semibold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "trends"
                ? "bg-[#25C6DA] text-white shadow-sm font-bold"
                : "ds-bg-form border border-slate-100 dark:border-slate-800 text-[#707070] dark:text-gray-300 hover:text-foreground shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.35)]"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Annual Trends</span>
          </button>
        </div>

        {/* ── Content Sections ── */}
        <div className="flex flex-col gap-8">
          {(activeTab === "all" || activeTab === "trends") && (
            <TrendsChart trends={finalTrends} />
          )}

          {(activeTab === "all" || activeTab === "financial") && (
            <FinancialKpiSection
              financial={kpiData?.financial}
              invoices={kpiData?.invoices}
            />
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
