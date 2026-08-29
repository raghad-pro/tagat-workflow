"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { ArrowLeftRight, ChevronRight, FileSpreadsheet, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import {
  useAiSuggest,
  useAnalyzeSheet,
  useSheetMapping,
  useUpdateMapping,
} from "../../hooks/useDataImport";
import type {
  DataImportFile,
  DataImportSheet,
  Id,
} from "../../types/data-import.types";
import {
  availableEntities,
  mappingColumns,
  mappingHeaders,
  num,
  sheetHeaders,
  sheetName,
  sheetsOf,
  str,
  targetKey,
  targetLabel,
  targetsFor,
} from "../../utils/shape";
import { SELECT_CLASS, WizardCard, WizardEmpty } from "./WizardCard";

/**
 * Step 3 — which column feeds which field.
 *
 * Mapping hangs off the sheet, not the file: one workbook can carry clients on
 * the first tab and projects on the second. `analyze` fills the mapping in
 * deterministically, `ai-suggest` offers a second opinion, and neither is
 * binding — nothing is saved until `PUT .../mapping` is called with the entity
 * and the full column list.
 */
export function StepMapping({
  files,
  onNext,
}: {
  files: DataImportFile[];
  onNext: () => void;
}) {
  const t = useTranslations("dataImport");
  const sheets = useMemo(
    () =>
      files.flatMap((file) =>
        sheetsOf(file).map((sheet) => ({ sheet, file }))
      ),
    [files]
  );

  return (
    <WizardCard
      title={t("mapping.title")}
      description={t("mapping.description")}
      actions={
        <Button
          size="lg"
          disabled={sheets.length === 0}
          ricon={<ChevronRight size={16} className="rtl:rotate-180" />}
          onClick={onNext}
        >
          {t("mapping.next")}
        </Button>
      }
    >
      {sheets.length === 0 ? (
        <WizardEmpty icon={ArrowLeftRight} message={t("mapping.empty")} />
      ) : (
        <div className="flex flex-col gap-4">
          {sheets.map(({ sheet, file }) => (
            <SheetMappingCard
              key={String(sheet.id)}
              sheet={sheet}
              fileLabel={str(file, ["original_name", "name", "filename"], "")}
            />
          ))}
        </div>
      )}
    </WizardCard>
  );
}

// ─── One sheet ────────────────────────────────────────────────────────────────

function SheetMappingCard({
  sheet,
  fileLabel,
}: {
  sheet: DataImportSheet;
  fileLabel: string;
}) {
  const t = useTranslations("dataImport");
  const sheetId: Id = sheet.id;

  const { data: mapping, isLoading } = useSheetMapping(sheetId);
  const analyze = useAnalyzeSheet();
  const aiSuggest = useAiSuggest();
  const save = useUpdateMapping();

  const headers = useMemo(() => {
    const fromSheet = sheetHeaders(sheet);
    return fromSheet.length > 0 ? fromSheet : mappingHeaders(mapping);
  }, [sheet, mapping]);

  const entities = availableEntities(mapping);

  const [entity, setEntity] = useState<string>("");
  /** Column index → target field. An empty string means the column is ignored. */
  const [columns, setColumns] = useState<Record<number, string>>({});

  // Whatever the server last stored is the starting point; re-running analyze or
  // the AI suggestion replaces it through the same effect.
  useEffect(() => {
    if (!mapping) return;
    setEntity(str(mapping, ["entity"], sheet.entity ? String(sheet.entity) : ""));
    const next: Record<number, string> = {};
    for (const column of mappingColumns(mapping)) {
      const index = num(column, ["source_column_index"], -1);
      if (index < 0) continue;
      next[index] = column.ignored ? "" : str(column, ["target_field"], "");
    }
    setColumns(next);
  }, [mapping, sheet.entity]);

  const targets = targetsFor(mapping, entity);
  const required = targets.filter((field) => field.required);
  const mapped = new Set(Object.values(columns).filter(Boolean));
  const missing = required.filter((field) => !mapped.has(targetKey(field)));

  const handleSave = () => {
    if (!entity) {
      toast.error(t("mapping.chooseEntityFirst"));
      return;
    }
    save.mutate(
      {
        sheetId,
        payload: {
          entity,
          columns: headers.map((_, index) => ({
            source_column_index: index,
            target_field: columns[index] || null,
            ignored: !columns[index],
          })),
        },
      },
      { onSuccess: () => toast.success(t("mapping.saved")) }
    );
  };

  return (
    <div className="rounded-xl border border-[var(--color-border-form)] p-4">
      {/* ── Sheet header ── */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
            <FileSpreadsheet size={15} className="text-[var(--color-btn-brand)]" />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold ds-text-main">
              {sheetName(sheet)}
            </span>
            {fileLabel && (
              <span className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                {fileLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            licon={<Wand2 size={14} />}
            loading={analyze.isPending}
            onClick={() => analyze.mutate({ sheetId })}
          >
            {t("mapping.analyze")}
          </Button>
          {/* Optional route — a suggestion the user still confirms and saves. */}
          <Button
            variant="ghost"
            size="sm"
            licon={<Sparkles size={14} />}
            loading={aiSuggest.isPending}
            onClick={() =>
              aiSuggest.mutate(sheetId, {
                onSuccess: () => toast.success(t("mapping.aiDone")),
              })
            }
          >
            {t("mapping.aiSuggest")}
          </Button>
        </div>
      </div>

      {/* ── Entity ── */}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-col gap-1.5">
          <span className="text-[12px] font-semibold ds-text-main">
            {t("mapping.entity")}
          </span>
          <select
            className={SELECT_CLASS}
            value={entity}
            onChange={(event) => {
              // Targets differ per entity, so a change invalidates the columns.
              setEntity(event.target.value);
              setColumns({});
            }}
          >
            <option value="">{t("mapping.chooseEntity")}</option>
            {entities.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <span
          className={cn(
            "pb-2 text-[12px]",
            missing.length > 0
              ? "font-semibold text-red-500"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {missing.length > 0
            ? t("mapping.missingRequired", { count: missing.length })
            : entity
              ? t("mapping.allMapped")
              : t("mapping.chooseEntityFirst")}
        </span>
      </div>

      {/* ── Columns ── */}
      {isLoading ? (
        <p className="text-[12px] text-slate-400 dark:text-slate-500">
          {t("mapping.loading")}
        </p>
      ) : headers.length === 0 ? (
        <p className="text-[12px] text-slate-400 dark:text-slate-500">
          {t("mapping.noColumns")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {headers.map((header, index) => {
            const value = columns[index] ?? "";
            const field = targets.find((target) => targetKey(target) === value);
            const isMissing = Boolean(field?.required) && !value;

            return (
              <div key={`${header}-${index}`} className="flex flex-col gap-1.5">
                <span className="truncate text-[12px] font-semibold ds-text-main">
                  {header || t("parse.unnamedColumn", { index: index + 1 })}
                </span>
                <select
                  className={cn(SELECT_CLASS, isMissing && "border-red-400")}
                  value={value}
                  disabled={!entity}
                  onChange={(event) =>
                    setColumns((current) => ({
                      ...current,
                      [index]: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("mapping.notMapped")}</option>
                  {targets.map((target) => (
                    <option key={targetKey(target)} value={targetKey(target)}>
                      {targetLabel(target)}
                      {target.required ? " *" : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex justify-start">
        <Button
          size="md"
          disabled={!entity || missing.length > 0}
          loading={save.isPending}
          onClick={handleSave}
        >
          {t("mapping.save")}
        </Button>
      </div>
    </div>
  );
}
