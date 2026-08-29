"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronRight, FileSpreadsheet, FileText, RotateCw } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useFileDetail, useParseFile, useSetDelimiter } from "../../hooks/useDataImport";
import {
  DELIMITERS,
  type CsvDelimiter,
  type DataImportFile,
} from "../../types/data-import.types";
import {
  fileError,
  fileName,
  fileSize,
  fileStatus,
  formatBytes,
  isCsv,
  sheetHeaders,
  sheetName,
  sheetRows,
  sheetsOf,
  str,
} from "../../utils/shape";
import { SELECT_CLASS, WizardCard, WizardEmpty, WizardStat } from "./WizardCard";

/**
 * Step 2 — what the server made of each file.
 *
 * Parsing is explicit and synchronous (`POST .../parse`), and it is what turns
 * a file into sheets. A CSV read with the wrong separator lands as one wide
 * column, so the delimiter can be corrected here — that call re-parses the file
 * and rebuilds its sheets.
 */
export function StepParse({
  sessionId,
  files,
  onNext,
}: {
  sessionId: string;
  files: DataImportFile[];
  onNext: () => void;
}) {
  const t = useTranslations("dataImport");
  const parseFile = useParseFile(sessionId);
  const setDelimiter = useSetDelimiter(sessionId);

  const sheets = files.flatMap(sheetsOf);
  const totalRows = sheets.reduce((sum, sheet) => sum + sheetRows(sheet), 0);
  const unparsed = files.filter((file) => sheetsOf(file).length === 0).length;

  return (
    <WizardCard
      title={t("parse.title")}
      description={t("parse.description")}
      actions={
        <>
          <Button
            size="lg"
            disabled={sheets.length === 0}
            ricon={<ChevronRight size={16} className="rtl:rotate-180" />}
            onClick={onNext}
          >
            {t("parse.next")}
          </Button>
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {unparsed > 0
              ? t("parse.unparsed", { count: unparsed })
              : t("parse.summary", { files: sheets.length, rows: totalRows })}
          </span>
        </>
      }
    >
      {files.length === 0 ? (
        <WizardEmpty icon={FileText} message={t("parse.empty")} />
      ) : (
        <div className="flex flex-col gap-3">
          {files.map((file) => {
            const sheetList = sheetsOf(file);
            const error = fileError(file);

            return (
              <div
                key={String(file.id)}
                className="rounded-xl border border-[var(--color-border-form)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
                      <FileSpreadsheet size={16} className="text-[var(--color-btn-brand)]" />
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-[13px] font-semibold ds-text-main">
                        {fileName(file)}
                      </span>
                      <span className="text-[12px] text-slate-400 dark:text-slate-500">
                        {formatBytes(fileSize(file))} · {fileStatus(file)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-5">
                    <WizardStat label={t("parse.sheets")} value={sheetList.length} />
                    <WizardStat
                      label={t("parse.rows")}
                      value={sheetList
                        .reduce((sum, sheet) => sum + sheetRows(sheet), 0)
                        .toLocaleString("en-US")}
                    />

                    {/* CSV only — the route rejects a workbook. */}
                    {isCsv(file) && (
                      <div className="flex min-w-[150px] flex-col gap-1">
                        <span className="text-[12px] text-slate-400 dark:text-slate-500">
                          {t("parse.delimiter")}
                        </span>
                        <select
                          className={SELECT_CLASS}
                          value={str(file, ["delimiter"], "comma")}
                          disabled={setDelimiter.isPending}
                          onChange={(event) =>
                            setDelimiter.mutate({
                              fileId: file.id,
                              delimiter: event.target.value as CsvDelimiter,
                            })
                          }
                        >
                          {DELIMITERS.map((delimiter) => (
                            <option key={delimiter} value={delimiter}>
                              {t(`parse.delimiters.${delimiter}` as Parameters<typeof t>[0])}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      licon={<RotateCw size={14} />}
                      loading={parseFile.isPending}
                      onClick={() => parseFile.mutate(file.id)}
                    >
                      {t("parse.reparse")}
                    </Button>
                  </div>
                </div>

                {/* ── The sheets this file produced ── */}
                {sheetList.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {sheetList.map((sheet) => {
                      const headers = sheetHeaders(sheet);
                      return (
                        <div
                          key={String(sheet.id)}
                          className="rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-white/[0.03]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold ds-text-main">
                              {sheetName(sheet)}
                            </span>
                            <span className="text-[12px] text-slate-400 dark:text-slate-500">
                              {t("parse.sheetMeta", {
                                rows: sheetRows(sheet),
                                columns: headers.length,
                              })}
                            </span>
                          </div>

                          {headers.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {headers.map((header, index) => (
                                <span
                                  key={`${header}-${index}`}
                                  className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-white/[0.06] dark:text-slate-400"
                                >
                                  {header || t("parse.unnamedColumn", { index: index + 1 })}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(sheetList.length === 0 || error) && (
                  <FailureNote file={file} listError={error} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </WizardCard>
  );
}

// ─── Why a file produced nothing ──────────────────────────────────────────────

/**
 * The reason, taken from the file's own record rather than guessed.
 *
 * The list route may only carry a status; `GET dataImportFiles/{id}` is asked
 * as well, because "failed" on its own tells the user nothing they can act on.
 */
function FailureNote({
  file,
  listError,
}: {
  file: DataImportFile;
  listError: string;
}) {
  const t = useTranslations("dataImport");
  // Only for a file that actually went wrong — a healthy file costs no request.
  const { data: detail } = useFileDetail(file.id, !listError);
  const reason = listError || (detail ? fileError(detail) : "");
  const status = fileStatus(detail ?? file);

  return (
    <p
      className={cn(
        "mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-[12px] leading-relaxed",
        reason || status === "failed"
          ? "bg-red-500/10 text-red-500"
          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
      )}
    >
      <AlertTriangle size={14} className="mt-[1px] shrink-0" />
      <span>
        {reason || t("parse.noSheets")}
        {!reason && status === "failed" && ` (${t("parse.serverFailed")})`}
      </span>
    </p>
  );
}
