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
  useFieldOptions,
  useSheetMapping,
  useUpdateMapping,
} from "../../hooks/useDataImport";
import {
  FIELD_VALUE_MODES,
  type DataImportFile,
  type DataImportSheet,
  type FieldValue,
  type FieldValueMode,
  type Id,
  type TargetField,
} from "../../types/data-import.types";
import {
  availableEntities,
  isRelationTarget,
  mappingColumns,
  mappingHeaders,
  num,
  optionLabel,
  optionValue,
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
  /** Target field → one value for the whole sheet. Absent means "from the column". */
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});

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

    const values: Record<string, FieldValue> = {};
    for (const [field, stored] of Object.entries(mapping.field_values ?? {})) {
      const value = str(stored, ["value"]);
      if (!value) continue;
      values[field] = { mode: (stored.mode as FieldValueMode) ?? "fixed", value };
    }
    setFieldValues(values);
  }, [mapping, sheet.entity]);

  const targets = targetsFor(mapping, entity);
  const required = targets.filter((field) => field.required);
  const mapped = new Set(Object.values(columns).filter(Boolean));
  // A required field is covered by a column — or by a value for every row.
  const missing = required.filter(
    (field) => !mapped.has(targetKey(field)) && fieldValues[targetKey(field)]?.mode !== "fixed"
  );

  // Field options depend on the entity the server has on record, and it answers
  // 409 until there is one — so the value pickers appear only once the entity
  // chosen here is the one that has been saved.
  const savedEntity = str(mapping, ["entity"]);
  const entityConfirmed = Boolean(entity) && entity === savedEntity;
  const relationTargets = targets.filter(isRelationTarget);

  const handleSave = () => {
    if (!entity) {
      toast.error(t("mapping.chooseEntityFirst"));
      return;
    }
    const field_values = Object.fromEntries(
      Object.entries(fieldValues).filter(([, fv]) => fv.value !== "")
    );
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
          ...(Object.keys(field_values).length > 0 && { field_values }),
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
              // Targets differ per entity, so a change invalidates the columns
              // and the sheet-wide values alike.
              setEntity(event.target.value);
              setColumns({});
              setFieldValues({});
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

      {/* ── Sheet-wide values ── */}
      {entity && relationTargets.length > 0 && (
        <div className="mt-4 rounded-lg bg-[var(--color-btn-brand)]/[0.05] p-3.5">
          <p className="text-[12px] font-semibold ds-text-main">
            {t("mapping.fieldValues.title")}
          </p>
          <p className="mt-0.5 text-[11.5px] text-slate-400 dark:text-slate-500">
            {entityConfirmed
              ? t("mapping.fieldValues.description")
              : t("mapping.fieldValues.saveFirst")}
          </p>

          {entityConfirmed && (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {relationTargets.map((field) => (
                <FieldValuePicker
                  key={targetKey(field)}
                  sheetId={sheetId}
                  field={field}
                  fromColumn={mapped.has(targetKey(field))}
                  value={fieldValues[targetKey(field)]}
                  onChange={(next) =>
                    setFieldValues((current) => {
                      const key = targetKey(field);
                      if (!next) {
                        const { [key]: _dropped, ...rest } = current;
                        return rest;
                      }
                      return { ...current, [key]: next };
                    })
                  }
                />
              ))}
            </div>
          )}
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

// ─── One sheet-wide value ─────────────────────────────────────────────────────

/**
 * A relation field's value for the whole sheet.
 *
 * `field-options` lists what the field may point at. When the field also has a
 * column, the value can only be a fallback for blank cells; without one it has
 * to apply to every row, since there is nowhere else for the value to come from.
 */
function FieldValuePicker({
  sheetId,
  field,
  fromColumn,
  value,
  onChange,
}: {
  sheetId: Id;
  field: TargetField;
  fromColumn: boolean;
  value: FieldValue | undefined;
  onChange: (next: FieldValue | undefined) => void;
}) {
  const t = useTranslations("dataImport");
  const key = targetKey(field);
  const { data: options = [], isLoading, isError } = useFieldOptions(sheetId, key);

  const mode: FieldValueMode = value?.mode ?? (fromColumn ? "default" : "fixed");

  return (
    <div className="flex flex-col gap-1.5">
      <span className="truncate text-[12px] font-semibold ds-text-main">
        {targetLabel(field)}
        {field.required ? " *" : ""}
      </span>
      <div className="flex gap-2">
        <select
          className={cn(SELECT_CLASS, "w-[42%] shrink-0")}
          value={mode}
          disabled={!value}
          onChange={(event) =>
            value && onChange({ ...value, mode: event.target.value as FieldValueMode })
          }
        >
          {FIELD_VALUE_MODES.map((option) => (
            <option key={option} value={option}>
              {t(`mapping.fieldValues.mode.${option}` as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
        <select
          className={SELECT_CLASS}
          value={value ? String(value.value) : ""}
          disabled={isLoading || isError}
          onChange={(event) =>
            onChange(event.target.value ? { mode, value: event.target.value } : undefined)
          }
        >
          <option value="">
            {isLoading
              ? t("mapping.fieldValues.loading")
              : isError
                ? t("mapping.fieldValues.unavailable")
                : fromColumn
                  ? t("mapping.fieldValues.fromColumn")
                  : t("mapping.fieldValues.none")}
          </option>
          {options.map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>
              {optionLabel(option)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
