/**
 * Data import — the v3 API's shapes.
 *
 * The published collection documents every route, its method and its request
 * body, but carries no saved response examples. So the read side is typed
 * permissively: every field is optional, alternative spellings are tolerated
 * through the readers in `utils/shape.ts`, and no screen assumes a key it has
 * not been shown. Tighten these once a real payload is in hand.
 *
 * The pipeline the routes describe:
 *   session → files → parse → sheets → mapping → preview → commit → audit
 */

/** Ids come back as numbers, but a serializer may hand them over as strings. */
export type Id = number | string;

/** The five things an import can create. The server is the authority — a sheet's
 *  entity is whatever `available_targets` offers — but these are the ones the
 *  pipeline is built around, and what the stage chain shows. */
export const ENTITIES = ["currency", "client", "employee", "project", "task"] as const;
export type Entity = (typeof ENTITIES)[number];

/** CSV separators the delimiter route accepts. */
export const DELIMITERS = ["comma", "semicolon", "tab", "pipe"] as const;
export type CsvDelimiter = (typeof DELIMITERS)[number];

// ─── Session ──────────────────────────────────────────────────────────────────

export interface DataImportSession {
  id: Id;
  /** draft · ready · committing · committed · failed — server vocabulary. */
  status?: string;
  created_at?: string;
  updated_at?: string;
  committed_at?: string | null;
  company_id?: Id;
  company?: { id?: Id; name?: string } | null;
  files_count?: number;
  sheets_count?: number;
  files?: DataImportFile[];
  [key: string]: unknown;
}

export interface DataImportFile {
  id: Id;
  /** One of these carries the file name, depending on the serializer. */
  original_name?: string;
  name?: string;
  filename?: string;
  size?: number;
  size_bytes?: number;
  extension?: string;
  mime_type?: string;
  /** uploaded · parsing · parsed · failed */
  status?: string;
  delimiter?: CsvDelimiter;
  error?: string | null;
  error_message?: string | null;
  sheets?: DataImportSheet[];
  [key: string]: unknown;
}

/**
 * One tab of a workbook, or the single sheet a CSV parses into.
 *
 * Mapping, preview and validation all hang off the sheet rather than the file —
 * an .xlsx can carry clients on one tab and projects on the next.
 */
export interface DataImportSheet {
  id: Id;
  name?: string;
  title?: string;
  sheet_name?: string;
  /** What this sheet holds, once analysed or chosen. */
  entity?: string | null;
  headers?: string[];
  columns?: Array<string | { index?: number; name?: string; header?: string }>;
  rows_count?: number;
  total_rows?: number;
  /** pending · analyzed · mapped · previewed */
  status?: string;
  mapping_status?: string;
  [key: string]: unknown;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

export interface MappingColumn {
  source_column_index: number;
  /** The header text, when the server sends it alongside the index. */
  source_column?: string;
  header?: string;
  target_field?: string | null;
  ignored?: boolean;
  /** How sure the deterministic analyse (or the AI suggestion) is. */
  confidence?: number;
  [key: string]: unknown;
}

export interface TargetField {
  field?: string;
  key?: string;
  name?: string;
  label?: string;
  required?: boolean;
  type?: string;
  [key: string]: unknown;
}

export interface SheetMapping {
  entity?: string | null;
  columns?: MappingColumn[];
  /** Either a map of entity → fields, or the fields for the current entity. */
  available_targets?: Record<string, TargetField[]> | TargetField[];
  available_entities?: string[];
  entities?: string[];
  [key: string]: unknown;
}

/** What `PUT .../mapping` takes. */
export interface UpdateMappingPayload {
  entity: string;
  columns: Array<{
    source_column_index: number;
    target_field: string | null;
    ignored: boolean;
  }>;
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export interface PreviewCounts {
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
  duplicate_rows?: number;
  skipped_rows?: number;
  ready_rows?: number;
  [key: string]: unknown;
}

export interface SheetPreview extends PreviewCounts {
  entity?: string | null;
  columns?: string[];
  fields?: string[];
  issues?: Array<{ row?: number; column?: string; field?: string; message?: string }>;
  [key: string]: unknown;
}

export interface PreviewRow {
  id?: Id;
  row_number?: number;
  line?: number;
  /** The mapped values, keyed by target field. */
  data?: Record<string, unknown>;
  values?: Record<string, unknown>;
  mapped?: Record<string, unknown>;
  /** valid · invalid · duplicate */
  status?: string;
  errors?: string[] | Record<string, string[]>;
  [key: string]: unknown;
}

export interface SessionPreviewSummary extends PreviewCounts {
  sheets?: Array<SheetPreview & { id?: Id; name?: string; sheet_id?: Id }>;
  sheets_count?: number;
  files_count?: number;
  [key: string]: unknown;
}

// ─── Commit & audit ───────────────────────────────────────────────────────────

export interface CommitEntityResult {
  entity?: string;
  created?: number;
  reused?: number;
  updated?: number;
  skipped?: number;
  skipped_duplicate?: number;
  skipped_invalid?: number;
  failed?: number;
  [key: string]: unknown;
}

export interface CommitResult extends CommitEntityResult {
  status?: string;
  committed_at?: string | null;
  entities?: CommitEntityResult[];
  results?: CommitEntityResult[];
  [key: string]: unknown;
}

export interface RollbackEligibility {
  eligible?: boolean;
  can_rollback?: boolean;
  reason?: string;
  reasons?: string[];
  blockers?: Array<{ entity?: string; reason?: string; count?: number }>;
  [key: string]: unknown;
}

export interface AuditRow {
  id?: Id;
  entity?: string;
  action?: string;
  row_number?: number;
  status?: string;
  message?: string;
  record_id?: Id;
  created_at?: string;
  [key: string]: unknown;
}

// ─── UI-only ──────────────────────────────────────────────────────────────────

export type WizardStep =
  | "upload"
  | "parse"
  | "mapping"
  | "preview"
  | "import"
  | "result";

export const WIZARD_STEPS: WizardStep[] = [
  "upload",
  "parse",
  "mapping",
  "preview",
  "import",
  "result",
];

export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Rows the preview table shows at once. */
export const PREVIEW_ROWS_SHOWN = 5;
