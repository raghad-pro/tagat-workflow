"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { PageCard } from "@/components/molecules/Pagecard";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useImportHistory } from "../hooks/useDataImport";
import type { DataImportSession } from "../types/data-import.types";
import { formatDate, str } from "../utils/shape";
import { SELECT_CLASS } from "./wizard/WizardCard";
import { SessionStatusBadge } from "./SessionStatusBadge";

/** Session statuses the filter offers. The server may use others; those still
 *  show in the list, they just have no dedicated filter entry. */
const SESSION_STATUSES = ["draft", "ready", "committed", "failed"];

/** How the run ended, as opposed to where the session stands. */
const EXECUTION_STATUSES = ["notRun", "imported", "partial", "failed"] as const;
type ExecutionStatus = (typeof EXECUTION_STATUSES)[number];

const EXECUTION_STYLE: Record<ExecutionStatus, { bg: string; color: string }> = {
  notRun: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
  imported: { bg: "rgba(16,185,129,0.14)", color: "#059669" },
  partial: { bg: "rgba(245,158,11,0.14)", color: "#d97706" },
  failed: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
};

const INPUT_CLASS = cn(
  "h-9 w-[110px] rounded-lg px-2.5 text-[13px] ds-text-main",
  "border border-[var(--color-border-form)] bg-transparent outline-none",
  "transition-colors focus:border-[var(--color-btn-brand)]",
  "placeholder:text-slate-400 dark:placeholder:text-slate-500"
);

/**
 * How a session's run ended, read off whatever the history row carries.
 *
 * The list endpoint's shape is not documented, so this reads the obvious keys
 * and falls back to the session status — which every row does have.
 */
function executionOf(session: DataImportSession): ExecutionStatus {
  const status = str(session, ["status"]).toLowerCase();
  const failed = Number(session.failed_count ?? session.failed ?? 0);
  const skipped = Number(session.skipped_count ?? session.skipped ?? 0);

  if (failed > 0 || status === "failed") return "failed";
  if (status !== "committed" && status !== "completed") return "notRun";
  return skipped > 0 ? "partial" : "imported";
}

/**
 * Import history — every session, including the ones that failed.
 *
 * Reads `GET {prefix}/dataImports/history`. The four filters are applied here
 * because the route's query parameters are not documented; the moment they are,
 * they move into the request and this becomes a thin list.
 */
export default function ImportHistoryPage() {
  const t = useTranslations("dataImport");
  const isAr = useLocale() === "ar";
  const router = useRouter();

  const { data: sessions = [], isLoading, isError, error, refetch } = useImportHistory();

  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [sessionStatus, setSessionStatus] = useState("");
  const [execution, setExecution] = useState("");

  const hasFilters = Boolean(month || year || sessionStatus || execution);

  const clear = () => {
    setMonth("");
    setYear("");
    setSessionStatus("");
    setExecution("");
  };

  const filtered = useMemo(() => {
    return sessions.filter((session) => {
      const date = new Date(str(session, ["created_at"]));
      const valid = !Number.isNaN(date.getTime());
      if (month && (!valid || date.getMonth() + 1 !== Number(month))) return false;
      if (year && (!valid || date.getFullYear() !== Number(year))) return false;
      if (sessionStatus && str(session, ["status"]) !== sessionStatus) return false;
      if (execution && executionOf(session) !== execution) return false;
      return true;
    });
  }, [sessions, month, year, sessionStatus, execution]);

  return (
    <PageContainer
      isLoading={isLoading}
      skeletonVariant="dashboard"
      isError={isError}
      error={error}
      onRetry={refetch}
    >
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-[800] leading-none tracking-tight ds-text-main sm:text-[30px] md:text-[34px]">
            {t("historyPage.title")}
          </h1>
          <p className="mt-1 text-[14px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            {t("historyPage.subtitle")}
          </p>
        </div>

        <Button
          variant="ghost"
          size="md"
          className="self-start whitespace-nowrap rounded-full sm:self-auto"
          licon={<ChevronLeft size={16} className={isAr ? "rotate-180" : undefined} />}
          onClick={() => router.push("/data-import")}
        >
          {t("result.allImports")}
        </Button>
      </div>

      <PageCard>
        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center gap-2.5 px-5 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            disabled={!hasFilters}
            className="rounded-lg"
            onClick={clear}
          >
            {t("historyPage.filters.clear")}
          </Button>

          <input
            type="number"
            min={1}
            max={12}
            inputMode="numeric"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            placeholder={t("historyPage.filters.month")}
            className={INPUT_CLASS}
          />
          <input
            type="number"
            min={2000}
            max={2100}
            inputMode="numeric"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder={t("historyPage.filters.year")}
            className={INPUT_CLASS}
          />

          <select
            value={sessionStatus}
            onChange={(event) => setSessionStatus(event.target.value)}
            className={cn(SELECT_CLASS, "w-auto min-w-[170px]")}
          >
            <option value="">{t("historyPage.filters.anySession")}</option>
            {SESSION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={execution}
            onChange={(event) => setExecution(event.target.value)}
            className={cn(SELECT_CLASS, "w-auto min-w-[185px]")}
          >
            <option value="">{t("historyPage.filters.anyExecution")}</option>
            {EXECUTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(`historyPage.execution.${status}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </div>

        {/* ── Results ── */}
        {filtered.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 pb-8 text-center">
            <Clock
              size={40}
              strokeWidth={1.25}
              className="text-slate-200 dark:text-slate-700"
            />
            <p className="text-[13px] text-slate-400 dark:text-slate-500">
              {sessions.length === 0 ? t("historyPage.emptyAll") : t("historyPage.empty")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col pb-2">
            {filtered.map((session) => {
              const status = executionOf(session);

              return (
                <li
                  key={String(session.id)}
                  style={{ borderTop: "1px solid var(--color-border-form)" }}
                >
                  <Link
                    href={`/data-import/${session.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-200 hover:bg-[var(--color-btn-brand)]/[0.06] sm:px-6"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-[14px] font-semibold ds-text-main">
                        {t("sessionName", { number: String(session.id) })}
                      </span>
                      <span className="text-[12px] text-slate-400 dark:text-slate-500">
                        {formatDate(str(session, ["created_at"]) || undefined)}
                        {session.company?.name ? ` · ${session.company.name}` : ""}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold whitespace-nowrap"
                        style={{
                          background: EXECUTION_STYLE[status].bg,
                          color: EXECUTION_STYLE[status].color,
                        }}
                      >
                        {t(`historyPage.execution.${status}` as Parameters<typeof t>[0])}
                      </span>
                      <span className="hidden sm:inline-flex">
                        <SessionStatusBadge status={str(session, ["status"], "draft")} />
                      </span>
                      <ChevronRight
                        size={16}
                        aria-hidden
                        className={cn(
                          "shrink-0 text-slate-300 dark:text-slate-600",
                          isAr && "rotate-180"
                        )}
                      />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </PageCard>
    </PageContainer>
  );
}
