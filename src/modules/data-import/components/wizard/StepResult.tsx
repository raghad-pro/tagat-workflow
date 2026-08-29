"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { History, List, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import {
  useAuditRows,
  useCommitResult,
  useRollbackEligibility,
} from "../../hooks/useDataImport";
import {
  commitCreated,
  commitEntities,
  commitFailed,
  commitReused,
  commitSkippedDuplicate,
  commitSkippedInvalid,
  formatDate,
  num,
  str,
} from "../../utils/shape";
import { WizardCard, WizardTile } from "./WizardCard";

/**
 * Step 6 — what the run did.
 *
 * The figures are read back from `GET .../commit`, so reopening a finished
 * session shows the same numbers it finished with. The audit trail and the
 * rollback analysis are separate routes; rollback is read-only — the API has
 * no undo, it only reports whether one would be possible.
 */
export function StepResult({ sessionId }: { sessionId: string }) {
  const t = useTranslations("dataImport");
  const router = useRouter();

  const { data: result, isLoading } = useCommitResult(sessionId);
  const [showAudit, setShowAudit] = useState(false);
  const { data: auditRows = [] } = useAuditRows(sessionId, showAudit);
  const { data: rollback } = useRollbackEligibility(sessionId);

  const entities = commitEntities(result);
  const hasRun = Boolean(result && Object.keys(result).length > 0);

  // Totals come from the per-entity rows when the server sends them, and from
  // the top level when it only sends one set.
  const sum = (pick: (source: unknown) => number) =>
    entities.length > 0
      ? entities.reduce((total, entity) => total + pick(entity), 0)
      : pick(result);

  const created = sum(commitCreated);
  const reused = sum(commitReused);
  const failed = sum(commitFailed);
  const skippedDuplicate = sum(commitSkippedDuplicate);
  const skippedInvalid = sum(commitSkippedInvalid);
  const notRun = hasRun ? 0 : num(result, ["pending_rows", "staged_rows"], 0);

  const canRollback = rollback?.eligible ?? rollback?.can_rollback;

  return (
    <WizardCard
      title={t("result.title")}
      description={
        isLoading
          ? t("result.loading")
          : hasRun
            ? t("result.description")
            : t("result.notRunYet")
      }
      actionsAlign="center"
      actions={
        <>
          <Button
            variant="ghost"
            size="md"
            licon={<List size={16} />}
            onClick={() => router.push("/data-import")}
          >
            {t("result.allImports")}
          </Button>
          <Button
            variant="ghost"
            size="md"
            licon={<History size={16} />}
            onClick={() => router.push("/data-import/history")}
          >
            {t("history")}
          </Button>
          <Button
            variant="ghost"
            size="md"
            licon={<Search size={16} />}
            onClick={() => setShowAudit((current) => !current)}
          >
            {t("result.auditTrail")}
          </Button>
        </>
      }
    >
      <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
        <WizardTile value={notRun} label={t("result.tiles.notRun")} tone="slate" />
        <WizardTile value={failed} label={t("result.tiles.failed")} tone="red" />
        <WizardTile
          value={skippedDuplicate}
          label={t("result.tiles.skippedDuplicate")}
          tone="amber"
        />
        <WizardTile
          value={skippedInvalid}
          label={t("result.tiles.skippedInvalid")}
          tone="red"
        />
        <WizardTile value={reused} label={t("result.tiles.reused")} tone="blue" />
        <WizardTile value={created} label={t("result.tiles.created")} tone="green" />
      </div>

      {/* ── Per entity ── */}
      {entities.length > 0 && (
        <div className="mx-auto mt-6 max-w-4xl overflow-x-auto rounded-xl border border-[var(--color-border-form)]">
          <table className="w-full min-w-[520px] border-collapse">
            <thead>
              <tr>
                {["stage", "created", "reused", "skippedDuplicate", "skippedInvalid", "failed"].map(
                  (column, index) => (
                    <th
                      key={column}
                      className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 ${
                        index === 0 ? "text-start" : "text-end"
                      }`}
                    >
                      {t(`result.tiles.${column}` as Parameters<typeof t>[0])}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {entities.map((entity, index) => (
                <tr
                  key={str(entity, ["entity"], String(index))}
                  style={{ borderTop: "1px solid var(--color-border-form)" }}
                >
                  <td className="px-4 py-2.5 text-[13px] font-semibold ds-text-main">
                    {str(entity, ["entity"], "—")}
                  </td>
                  <td className="px-4 py-2.5 text-end text-[13px] font-semibold text-emerald-500">
                    {commitCreated(entity).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-end text-[13px] text-blue-500">
                    {commitReused(entity).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-end text-[13px] text-amber-500">
                    {commitSkippedDuplicate(entity).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-end text-[13px] text-red-500">
                    {commitSkippedInvalid(entity).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-end text-[13px] text-red-500">
                    {commitFailed(entity).toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Rollback analysis — read-only; there is no undo route ── */}
      {hasRun && rollback && (
        <div
          className={cn(
            "mx-auto mt-4 flex max-w-4xl items-start gap-2.5 rounded-xl px-4 py-3",
            canRollback
              ? "bg-[var(--color-btn-brand)]/[0.08] text-[var(--color-btn-brand)]"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
          )}
        >
          <ShieldAlert size={16} className="mt-[1px] shrink-0" />
          <p className="text-[12.5px] leading-relaxed">
            {canRollback ? t("result.rollbackPossible") : t("result.rollbackBlocked")}
            {rollback.reason ? ` — ${rollback.reason}` : ""}
          </p>
        </div>
      )}

      {/* ── Audit trail ── */}
      {showAudit && (
        <div className="mx-auto mt-4 max-w-4xl overflow-x-auto rounded-xl border border-[var(--color-border-form)]">
          {auditRows.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12px] text-slate-400 dark:text-slate-500">
              {t("result.auditEmpty")}
            </p>
          ) : (
            <table className="w-full min-w-[560px] border-collapse">
              <thead>
                <tr>
                  {["auditRow", "auditEntity", "auditStatus", "auditMessage", "auditAt"].map(
                    (column, index) => (
                      <th
                        key={column}
                        className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500 ${
                          index === 0 ? "text-start" : "text-start"
                        }`}
                      >
                        {t(`result.${column}` as Parameters<typeof t>[0])}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {auditRows.slice(0, 50).map((row, index) => (
                  <tr
                    key={String(row.id ?? index)}
                    style={{ borderTop: "1px solid var(--color-border-form)" }}
                  >
                    <td className="px-4 py-2.5 text-[13px] ds-text-main">
                      {num(row, ["row_number", "line"], index + 1)}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] ds-text-main">
                      {str(row, ["entity"], "—")}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] ds-text-main">
                      {str(row, ["status", "action"], "—")}
                    </td>
                    <td className="max-w-[280px] truncate px-4 py-2.5 text-[13px] text-slate-500 dark:text-slate-400">
                      {str(row, ["message"], "—")}
                    </td>
                    <td className="px-4 py-2.5 text-[13px] text-slate-400 dark:text-slate-500">
                      {formatDate(str(row, ["created_at"]) || undefined)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {hasRun && skippedDuplicate + skippedInvalid > 0 && (
        <p className="mx-auto mt-4 max-w-4xl text-center text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t("result.skippedNote")}
        </p>
      )}
    </WizardCard>
  );
}
