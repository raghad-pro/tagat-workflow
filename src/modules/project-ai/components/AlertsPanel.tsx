"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Bot, CheckCheck, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Pagination } from "@/components/molecules/Pagination";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  useAcknowledgeAiAlert,
  useAiAlerts,
  useExplainAiAlert,
  useRefreshAiAlerts,
} from "../hooks/useProjectAi";
import { ALERT_STATUSES, type AiScope } from "../types/project-ai.types";
import {
  alertExplanation,
  alertMessage,
  alertSeverity,
  alertStatus,
  alertTitle,
  formatDate,
  str,
} from "../utils/shape";
import { Empty, Panel, PanelState, StatusPill } from "./ui";

const PER_PAGE = 10;

/**
 * Risk alerts — raised by deterministic checks, never by the model.
 *
 * "Refresh" re-runs those checks; "Explain" is the one optional AI call, and
 * degrades to a plain answer when the server has no Gemini key.
 */
export function AlertsPanel({ scope }: { scope: AiScope | undefined }) {
  const t = useTranslations("projectAi.alerts");
  const { can } = usePermission();
  const canManage = can("project_ai.manage");
  const canExplain = can("project_ai.create");

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  /** Explanations fetched this visit, by alert id — the list may not carry them yet. */
  const [explained, setExplained] = useState<Record<string, string>>({});
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [ackId, setAckId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useAiAlerts(scope, {
    ...(status && { status }),
    page,
    per_page: PER_PAGE,
  });
  const alerts = data?.items ?? [];

  const refresh = useRefreshAiAlerts(scope);
  const acknowledge = useAcknowledgeAiAlert(scope);
  const explain = useExplainAiAlert(scope);

  const handleExplain = (id: string) => {
    setExplainingId(id);
    explain.mutate(id, {
      onSuccess: (result) => {
        const text = alertExplanation(result);
        const outcome = str(result, ["ai_outcome", "outcome"]);
        setExplained((current) => ({
          ...current,
          [id]: text || t("noExplanation", { outcome: outcome || "—" }),
        }));
      },
      onSettled: () => setExplainingId(null),
    });
  };

  return (
    <Panel
      title={t("title")}
      description={t("description")}
      actions={
        canManage && (
          <Button
            variant="outline"
            size="md"
            licon={<RefreshCw size={15} className={cn(refresh.isPending && "animate-spin")} />}
            disabled={!scope || refresh.isPending}
            onClick={() =>
              refresh.mutate(undefined, { onSuccess: () => toast.success(t("refreshed")) })
            }
          >
            {t("refresh")}
          </Button>
        )
      }
    >
      {/* ── Status filter ── */}
      <div className="flex flex-wrap gap-1.5 px-5 pt-4 sm:px-6" role="tablist">
        {["", ...ALERT_STATUSES].map((value) => (
          <button
            key={value || "all"}
            type="button"
            role="tab"
            aria-selected={status === value}
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-[12px] font-semibold transition-colors",
              status === value
                ? "bg-[var(--color-btn-brand)] text-white"
                : "bg-slate-100 text-slate-500 hover:text-[var(--color-btn-brand)] dark:bg-slate-800/60 dark:text-slate-400"
            )}
          >
            {value ? t(`filter.${value}`) : t("filter.all")}
          </button>
        ))}
      </div>

      {isLoading || isError ? (
        <PanelState isLoading={isLoading} error={error} onRetry={refetch} />
      ) : alerts.length === 0 ? (
        <Empty icon={ShieldAlert} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className={cn("flex flex-col gap-3 px-5 py-5 sm:px-6", isFetching && "opacity-70")}>
          {alerts.map((alert) => {
            const id = String(alert.id);
            const state = alertStatus(alert);
            const message = alertMessage(alert);
            const explanation = explained[id] || alertExplanation(alert);

            return (
              <li
                key={id}
                className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-form)] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusPill value={alertSeverity(alert)} kind="severity" />
                      <span className="text-[14px] font-bold ds-text-main">{alertTitle(alert)}</span>
                    </span>
                    {message && (
                      <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">
                      {formatDate(alert.created_at)}
                    </span>
                    <StatusPill value={state} />
                  </div>
                </div>

                {explanation && (
                  <div className="flex gap-2.5 rounded-xl bg-[var(--color-btn-brand)]/[0.06] px-3.5 py-3">
                    <Bot size={16} className="mt-0.5 shrink-0 text-[var(--color-btn-brand)]" />
                    <p className="whitespace-pre-line text-[13px] leading-relaxed ds-text-main">
                      {explanation}
                    </p>
                  </div>
                )}

                {(canExplain || (canManage && state === "open")) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {canExplain && (
                      <Button
                        variant="ghost"
                        size="sm"
                        licon={<Sparkles size={14} />}
                        loading={explainingId === id}
                        disabled={explain.isPending && explainingId !== id}
                        onClick={() => handleExplain(id)}
                      >
                        {explanation ? t("explainAgain") : t("explain")}
                      </Button>
                    )}
                    {canManage && state === "open" && (
                      <Button
                        variant="outline"
                        size="sm"
                        licon={<CheckCheck size={14} />}
                        loading={acknowledge.isPending && ackId === id}
                        onClick={() => {
                          setAckId(id);
                          acknowledge.mutate(id, {
                            onSuccess: () => toast.success(t("acknowledged")),
                            onSettled: () => setAckId(null),
                          });
                        }}
                      >
                        {t("acknowledge")}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(data?.lastPage ?? 1) > 1 && (
        <div
          className="flex justify-end px-5 py-4 sm:px-6"
          style={{ borderTop: "1px solid var(--color-border-form)" }}
        >
          <Pagination
            currentPage={page}
            data={Array(data?.total ?? 0).fill(0)}
            pageSize={PER_PAGE}
            onPageChange={setPage}
          />
        </div>
      )}
    </Panel>
  );
}
