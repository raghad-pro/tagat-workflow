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
import { PageHeader } from "@/components/molecules/Pageheader";
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
        {/* ── Background Glow Overlay ── */}
        <div
          className="pointer-events-none fixed top-0 right-0 w-[820px] h-[688px] rounded-full blur-[96px] -z-10"
          style={{ backgroundColor: "rgba(81, 209, 225, 0.12)" }}
        />

        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#25C6DA]/15 text-[#25C6DA] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h1 className="text-[28px] sm:text-[31px] font-bold tracking-tight text-foreground leading-[40px]">
                KPI & Performance Dashboard
              </h1>
            </div>
            <p className="text-[14px] sm:text-[16px] text-muted-foreground mt-1">
              Executive business metrics, financial health, and operational key performance indicators
            </p>
          </div>

          {/* ── Date Filters & Actions ── */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-card border border-border/60 rounded-xl px-3 py-1.5 shadow-sm">
              <Calendar className="w-4 h-4 text-[#25C6DA]" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-popover text-foreground">
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-card border border-border/60 rounded-xl px-3 py-1.5 shadow-sm">
              <select
                value={selectedMonth ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonth(val ? Number(val) : undefined);
                }}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-card border border-border/60 text-foreground text-xs font-bold hover:bg-muted transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Refresh KPI Metrics"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-[#25C6DA]", isRefetching && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/40">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "all"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Overview & All KPIs</span>
          </button>

          <button
            onClick={() => setActiveTab("financial")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "financial"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financial & Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab("operations")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "operations"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Projects & Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab("people")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "people"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Users className="w-4 h-4" />
            <span>People & Meetings</span>
          </button>

          <button
            onClick={() => setActiveTab("trends")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              activeTab === "trends"
                ? "bg-[#25C6DA] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
