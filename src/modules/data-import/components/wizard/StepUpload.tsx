"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { ArrowUp, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useUploadFiles } from "../../hooks/useDataImport";
import {
  MAX_FILES,
  MAX_FILE_BYTES,
  type DataImportFile,
} from "../../types/data-import.types";
import { fileName, fileSize, formatBytes } from "../../utils/shape";
import { WizardCard } from "./WizardCard";

const ACCEPTED = [".csv", ".xlsx"];

/**
 * Step 1 — the files themselves.
 *
 * `POST {prefix}/dataImports/{id}/files` takes `files[]` as multipart and does
 * not parse; the parse call that follows is fired by the upload hook, because a
 * file with no sheets is not something the next step can show.
 */
export function StepUpload({
  sessionId,
  files,
  onNext,
}: {
  sessionId: string;
  files: DataImportFile[];
  onNext: () => void;
}) {
  const t = useTranslations("dataImport");
  const upload = useUploadFiles(sessionId);

  const inputRef = useRef<HTMLInputElement>(null);
  const [queued, setQueued] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const totalCount = files.length + queued.length;

  const accept = (incoming: FileList | null) => {
    if (!incoming) return;
    const accepted: File[] = [];

    for (const file of Array.from(incoming)) {
      const name = file.name.toLowerCase();
      if (!ACCEPTED.some((extension) => name.endsWith(extension))) {
        toast.error(t("upload.errors.type", { name: file.name }));
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(t("upload.errors.size", { name: file.name }));
        continue;
      }
      if (totalCount + accepted.length >= MAX_FILES) {
        toast.error(t("upload.errors.max", { max: MAX_FILES }));
        break;
      }
      accepted.push(file);
    }

    if (accepted.length) setQueued((current) => [...current, ...accepted]);
  };

  const handleUpload = () => {
    if (queued.length === 0) {
      onNext();
      return;
    }
    upload.mutate(queued, {
      onSuccess: () => {
        setQueued([]);
        onNext();
      },
    });
  };

  return (
    <WizardCard
      title={t("upload.title")}
      description={t("upload.hint", { max: MAX_FILES })}
      actions={
        <>
          <Button
            size="lg"
            disabled={totalCount === 0}
            loading={upload.isPending}
            ricon={<ArrowUp size={16} />}
            onClick={handleUpload}
          >
            {queued.length > 0 ? t("upload.cta") : t("upload.next")}
          </Button>
          <span className="text-[12px] text-slate-400 dark:text-slate-500">
            {t("upload.counter", { count: totalCount, max: MAX_FILES })}
          </span>
        </>
      }
    >
      {/* ── Dropzone ── */}
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          accept(event.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl px-6 py-12 text-center",
          "border-2 border-dashed transition-colors duration-200",
          isDragging
            ? "border-[var(--color-btn-brand)] bg-[var(--color-btn-brand)]/[0.06]"
            : "border-slate-200 dark:border-white/10"
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-btn-brand)]/10">
          <UploadCloud size={26} className="text-[var(--color-btn-brand)]" />
        </span>

        <p className="text-[15px] font-bold ds-text-main">
          {t("upload.drop")}{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer text-[var(--color-btn-brand)] underline-offset-4 hover:underline"
          >
            {t("upload.browse")}
          </button>
        </p>
        <p className="max-w-md text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t("upload.dropHint")}
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(event) => {
            accept(event.target.files);
            // Clearing lets the same file be picked again after a removal.
            event.target.value = "";
          }}
        />
      </div>

      {/* ── What is attached ── */}
      {totalCount > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {files.map((file) => (
            <FileRow
              key={String(file.id)}
              name={fileName(file)}
              size={fileSize(file)}
              note={t("upload.uploaded")}
            />
          ))}
          {queued.map((file, index) => (
            <FileRow
              key={`${file.name}-${index}`}
              name={file.name}
              size={file.size}
              note={t("upload.queued")}
              onRemove={() =>
                setQueued((current) => current.filter((_, i) => i !== index))
              }
            />
          ))}
        </ul>
      )}
    </WizardCard>
  );
}

function FileRow({
  name,
  size,
  note,
  onRemove,
}: {
  name: string;
  size: number;
  note: string;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--color-border-form)] px-3 py-2.5">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
        <FileSpreadsheet size={16} className="text-[var(--color-btn-brand)]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-semibold ds-text-main">{name}</span>
        <span className="text-[12px] text-slate-400 dark:text-slate-500">
          {formatBytes(size)} · {note}
        </span>
      </div>
      {/* Only a queued file can be taken back here; an uploaded one belongs to
          the session and is removed with the session itself. */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={name}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <X size={15} />
        </button>
      )}
    </li>
  );
}
