"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, ChevronRight, Copy, Eye, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useBuildPreview, usePreviewRows, useSheetPreview } from "../../hooks/useDataImport";
import {
  PREVIEW_ROWS_SHOWN,
  type DataImportFile,
  type DataImportSheet,
} from "../../types/data-import.types";
import {
  previewDuplicate,
  previewInvalid,
  previewTotal,
  previewValid,
  rowErrors,
  rowValues,
  sheetName,
  sheetsOf,
  str,
} from "../../utils/shape";
import { WizardCard, WizardEmpty } from "./WizardCard";

/**
 * Step 4 — the rows as they will be sent.
 *
 * `POST .../preview` stages and validates a sheet without creating anything;
 * the summary and the rows are then read back. Building is explicit because it
 * is the expensive call — the whole file is validated server-side, not the
 * handful of rows shown here.
 */
export function StepPreview({
  files,
  onNext,
}: {
  files: DataImportFile[];
  onNext: () => void;
}) {
  const t = useTranslations("dataImport");
  const build = useBuildPreview();
  const [hasBuilt, setHasBuilt] = useState(false);

  const sheets = useMemo(() => files.flatMap(sheetsOf), [files]);
  const mapped = sheets.filter((sheet) => sheet.entity);

  return (
    <WizardCard
      title={t("preview.title")}
      description={t("preview.description")}
      actions={
        <>
          <Button
            size="lg"
            disabled={mapped.length === 0}
            loading={build.isPending}
            ricon={<ChevronRight size={16} className="rtl:rotate-180" />}
            onClick={() => {
              if (!hasBuilt) {
                build.mutate(
                  mapped.map((sheet) => sheet.id),
                  { onSuccess: () => setHasBuilt(true) }
                );
                return;
              }
              onNext();
            }}
          >
            {hasBuilt ? t("preview.next") : t("preview.build")}
          </Button>
          {mapped.length === 0 && (
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {t("preview.needsMapping")}
            </span>
          )}
        </>
      }
    >
      {mapped.length === 0 ? (
        <WizardEmpty icon={Eye} message={t("preview.empty")} />
      ) : (
        <div className="flex flex-col gap-4">
          {mapped.map((sheet) => (
            <SheetPreviewCard key={String(sheet.id)} sheet={sheet} enabled={hasBuilt} />
          ))}
        </div>
      )}
    </WizardCard>
  );
}

// ─── One sheet ────────────────────────────────────────────────────────────────

function SheetPreviewCard({
  sheet,
  enabled,
}: {
  sheet: DataImportSheet;
  enabled: boolean;
}) {
  const t = useTranslations("dataImport");
  const { data: preview, isLoading } = useSheetPreview(sheet.id, enabled);
  const { data: rows = [] } = usePreviewRows(sheet.id, enabled);

  const shown = rows.slice(0, PREVIEW_ROWS_SHOWN);
  // The row shape is the server's; its keys are the target fields it mapped.
  const fields = useMemo(() => {
    const fromPreview = preview?.fields ?? preview?.columns;
    if (Array.isArray(fromPreview) && fromPreview.length > 0) return fromPreview.map(String);
    const first = shown[0] ? rowValues(shown[0]) : {};
    return Object.keys(first);
  }, [preview, shown]);

  const valid = previewValid(preview);
  const invalid = previewInvalid(preview);
  const duplicate = previewDuplicate(preview);

  return (
    <div className="rounded-xl border border-[var(--color-border-form)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
            <FileSpreadsheet size={15} className="text-[var(--color-btn-brand)]" />
          </span>
          <span className="truncate text-[13px] font-semibold ds-text-main">
            {sheetName(sheet)}
          </span>
          {sheet.entity && (
            <span className="rounded-full bg-[var(--color-btn-brand)]/10 px-2.5 py-[3px] text-[11px] font-bold text-[var(--color-btn-brand)]">
              {String(sheet.entity)}
            </span>
          )}
        </div>

        {enabled && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-[3px] text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={12} />
              {t("preview.rowsReady", { count: valid })}
            </span>
            {invalid > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-[3px] text-[11px] font-bold text-red-500">
                <AlertTriangle size={12} />
                {t("preview.rowsWithIssues", { count: invalid })}
              </span>
            )}
            {duplicate > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-[3px] text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Copy size={12} />
                {t("preview.rowsDuplicate", { count: duplicate })}
              </span>
            )}
          </div>
        )}
      </div>

      {!enabled ? (
        <p className="px-4 pb-4 text-[12px] text-slate-400 dark:text-slate-500">
          {t("preview.notBuilt")}
        </p>
      ) : isLoading ? (
        <p className="px-4 pb-4 text-[12px] text-slate-400 dark:text-slate-500">
          {t("preview.loading")}
        </p>
      ) : shown.length === 0 ? (
        <p className="px-4 pb-4 text-[12px] text-slate-400 dark:text-slate-500">
          {t("preview.noRows")}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-start">
              <thead>
                <tr style={{ borderTop: "1px solid var(--color-border-form)" }}>
                  {fields.map((field) => (
                    <th
                      key={field}
                      className="whitespace-nowrap px-4 py-2.5 text-start text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500"
                    >
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, index) => {
                  const values = rowValues(row);
                  const errors = rowErrors(row);
                  const status = str(row, ["status"], "valid");
                  const isDuplicate = status === "duplicate";
                  const isInvalid = status === "invalid" || errors.length > 0;

                  return (
                    <tr
                      key={index}
                      title={errors.join(" · ") || undefined}
                      className={cn(
                        isInvalid
                          ? "bg-red-500/[0.06]"
                          : isDuplicate
                            ? "bg-amber-500/[0.07]"
                            : undefined
                      )}
                      style={{ borderTop: "1px solid var(--color-border-form)" }}
                    >
                      {fields.map((field) => (
                        <td
                          key={field}
                          className={cn(
                            "max-w-[220px] truncate px-4 py-2.5 text-[13px]",
                            isInvalid ? "font-semibold text-red-500" : "ds-text-main"
                          )}
                        >
                          {values[field] === undefined || values[field] === null || values[field] === ""
                            ? "—"
                            : String(values[field])}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p
            className="px-4 py-2.5 text-[12px] text-slate-400 dark:text-slate-500"
            style={{ borderTop: "1px solid var(--color-border-form)" }}
          >
            {t("preview.showing", {
              shown: shown.length,
              total: previewTotal(preview).toLocaleString("en-US"),
            })}
          </p>
        </>
      )}
    </div>
  );
}
