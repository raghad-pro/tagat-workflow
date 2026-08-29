/**
 * Readers that tolerate the response shape.
 *
 * The v3 collection documents the routes but ships no response examples, so
 * each screen reads through these instead of naming a key directly. When the
 * real payload is known this file is where the guesswork gets deleted — not
 * every component.
 */
import type {
  CommitEntityResult,
  CommitResult,
  DataImportFile,
  DataImportSheet,
  MappingColumn,
  PreviewRow,
  SheetMapping,
  TargetField,
} from "../types/data-import.types";

/** The first key that actually holds a value. */
function pick<T>(source: unknown, keys: string[]): T | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

export function num(source: unknown, keys: string[], fallback = 0): number {
  const value = pick<unknown>(source, keys);
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : fallback;
}

export function str(source: unknown, keys: string[], fallback = ""): string {
  const value = pick<unknown>(source, keys);
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

/**
 * The payload out of whatever envelope it arrived in.
 *
 * Laravel resources answer `{ data: … }`, some controllers answer the object
 * bare, and a paginated list nests it twice.
 */
export function unwrap<T = unknown>(body: unknown): T {
  const data = (body as { data?: unknown } | null)?.data;
  return (data === undefined ? body : data) as T;
}

export function unwrapList<T = unknown>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  const first = (body as { data?: unknown } | null)?.data;
  if (Array.isArray(first)) return first as T[];
  const second = (first as { data?: unknown } | null)?.data;
  if (Array.isArray(second)) return second as T[];
  return [];
}

// ─── Files & sheets ───────────────────────────────────────────────────────────

export const fileName = (file: DataImportFile) =>
  str(file, ["original_name", "name", "filename"], "—");

export const fileSize = (file: DataImportFile) => num(file, ["size", "size_bytes"]);

export const fileStatus = (file: DataImportFile) => str(file, ["status"], "uploaded");

/**
 * Why a file failed, wherever the server put it.
 *
 * A parse failure is the one error the user has to be able to read — it is the
 * difference between "re-parse it" and "this file is not a workbook" — so this
 * looks past the obvious keys into a list, a validation bag, or `meta`.
 */
export function fileError(file: DataImportFile): string {
  const direct = str(file, [
    "error",
    "error_message",
    "parse_error",
    "failure_reason",
    "message",
    "last_error",
  ]);
  if (direct) return direct;

  const errors = (file as { errors?: unknown }).errors;
  if (Array.isArray(errors) && errors.length > 0) return String(errors[0]);
  if (errors && typeof errors === "object") {
    const first = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (first) return String(first);
  }

  const meta = (file as { meta?: unknown }).meta;
  if (meta && typeof meta === "object") {
    const nested = str(meta, ["error", "message", "parse_error"]);
    if (nested) return nested;
  }

  return "";
}

export const isCsv = (file: DataImportFile) => {
  const name = fileName(file).toLowerCase();
  const extension = str(file, ["extension"]).toLowerCase();
  return extension === "csv" || name.endsWith(".csv");
};

export const sheetsOf = (file: DataImportFile): DataImportSheet[] =>
  Array.isArray(file.sheets) ? file.sheets : [];

export const sheetName = (sheet: DataImportSheet) =>
  str(sheet, ["name", "title", "sheet_name"], "Sheet");

export const sheetRows = (sheet: DataImportSheet) =>
  num(sheet, ["rows_count", "total_rows"]);

/** The sheet's column headers, whether they came as strings or as objects. */
export function sheetHeaders(sheet: DataImportSheet | undefined): string[] {
  if (!sheet) return [];
  if (Array.isArray(sheet.headers)) return sheet.headers.map((h) => String(h ?? ""));
  if (Array.isArray(sheet.columns)) {
    return sheet.columns.map((column, index) =>
      typeof column === "string"
        ? column
        : str(column, ["name", "header"], `Column ${index + 1}`)
    );
  }
  return [];
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

export const mappingColumns = (mapping: SheetMapping | undefined): MappingColumn[] =>
  Array.isArray(mapping?.columns) ? mapping!.columns : [];

/** Headers as the mapping response knows them, for when the sheet has none. */
export function mappingHeaders(mapping: SheetMapping | undefined): string[] {
  const columns = mappingColumns(mapping);
  if (columns.length === 0) return [];
  const headers: string[] = [];
  for (const column of columns) {
    const index = num(column, ["source_column_index"], headers.length);
    headers[index] = str(column, ["source_column", "header"], `Column ${index + 1}`);
  }
  return [...headers].map((header, index) => header ?? `Column ${index + 1}`);
}

/** The entities this sheet may be mapped to. */
export function availableEntities(mapping: SheetMapping | undefined): string[] {
  if (!mapping) return [];
  if (Array.isArray(mapping.available_entities)) return mapping.available_entities;
  if (Array.isArray(mapping.entities)) return mapping.entities;
  const targets = mapping.available_targets;
  if (targets && !Array.isArray(targets)) return Object.keys(targets);
  return [];
}

/** The fields an entity accepts. */
export function targetsFor(
  mapping: SheetMapping | undefined,
  entity: string | null | undefined
): TargetField[] {
  const targets = mapping?.available_targets;
  if (!targets) return [];
  if (Array.isArray(targets)) return targets;
  if (entity && Array.isArray(targets[entity])) return targets[entity];
  return [];
}

export const targetKey = (field: TargetField) => str(field, ["field", "key", "name"]);

export const targetLabel = (field: TargetField) =>
  str(field, ["label", "name", "field", "key"]);

// ─── Preview ──────────────────────────────────────────────────────────────────

export const previewTotal = (source: unknown) => num(source, ["total_rows", "total", "rows"]);
export const previewValid = (source: unknown) =>
  num(source, ["valid_rows", "ready_rows", "valid", "importable_rows"]);
export const previewInvalid = (source: unknown) =>
  num(source, ["invalid_rows", "invalid", "errors_count"]);
export const previewDuplicate = (source: unknown) =>
  num(source, ["duplicate_rows", "duplicates", "skipped_duplicate"]);

/** A preview row's mapped values, keyed by target field. */
export function rowValues(row: PreviewRow): Record<string, unknown> {
  const values = row.data ?? row.values ?? row.mapped;
  return values && typeof values === "object" ? (values as Record<string, unknown>) : {};
}

export function rowErrors(row: PreviewRow): string[] {
  const errors = row.errors;
  if (Array.isArray(errors)) return errors.map(String);
  if (errors && typeof errors === "object") {
    return Object.values(errors).flatMap((value) =>
      Array.isArray(value) ? value.map(String) : [String(value)]
    );
  }
  return [];
}

// ─── Commit ───────────────────────────────────────────────────────────────────

/** Per-entity results, whichever key the server groups them under. */
export function commitEntities(result: CommitResult | undefined): CommitEntityResult[] {
  if (!result) return [];
  if (Array.isArray(result.entities)) return result.entities;
  if (Array.isArray(result.results)) return result.results;
  return [];
}

export const commitCreated = (source: unknown) => num(source, ["created", "created_count"]);
export const commitReused = (source: unknown) =>
  num(source, ["reused", "matched", "existing"]);
export const commitFailed = (source: unknown) => num(source, ["failed", "failed_count"]);
export const commitSkippedDuplicate = (source: unknown) =>
  num(source, ["skipped_duplicate", "duplicates", "duplicate"]);
export const commitSkippedInvalid = (source: unknown) =>
  num(source, ["skipped_invalid", "invalid", "skipped"]);

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** dd/MM/yyyy in both locales — these dates are stamps, not prose. */
export function formatDate(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}
