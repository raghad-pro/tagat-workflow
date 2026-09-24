"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { CloudUpload, FileText, FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import {
  useAiDocuments,
  useDeleteAiDocument,
  useUploadAiDocuments,
} from "../hooks/useProjectAi";
import type { AiDocument, AiScope } from "../types/project-ai.types";
import { documentName, documentSize, documentStatus, formatBytes, formatDate } from "../utils/shape";
import { Empty, Panel, PanelState, StatusPill } from "./ui";

/**
 * Requirement documents — what the plan is generated from.
 *
 * They are stored on a private disk: the API exposes no path and no download,
 * so a row can only be listed and removed.
 */
export function DocumentsPanel({ scope }: { scope: AiScope | undefined }) {
  const t = useTranslations("projectAi.documents");
  const { can } = usePermission();
  const canUpload = can("project_ai.create");
  const canDelete = can("project_ai.manage");

  const { data: documents = [], isLoading, isError, error, refetch } = useAiDocuments(scope);
  const upload = useUploadAiDocuments(scope);
  const remove = useDeleteAiDocument(scope);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AiDocument | null>(null);

  const send = (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length === 0 || !scope) return;
    upload.mutate(files, {
      onSuccess: (count) => {
        if (count > 0) toast.success(t("uploaded", { count }));
      },
    });
  };

  return (
    <Panel
      title={t("title")}
      description={t("description")}
      actions={
        canUpload && (
          <Button
            size="md"
            licon={<FileUp size={16} />}
            loading={upload.isPending}
            disabled={!scope}
            onClick={() => inputRef.current?.click()}
          >
            {t("upload")}
          </Button>
        )
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          send(event.target.files);
          event.target.value = "";
        }}
      />

      {canUpload && (
        <div className="px-5 pt-5 sm:px-6">
          <button
            type="button"
            disabled={!scope || upload.isPending}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              send(event.dataTransfer.files);
            }}
            className={cn(
              "flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors",
              dragging
                ? "border-[var(--color-btn-brand)] bg-[var(--color-btn-brand)]/[0.06]"
                : "border-[var(--color-border-form)] hover:border-[var(--color-btn-brand)]/60"
            )}
          >
            <CloudUpload size={26} className="text-[var(--color-btn-brand)]" />
            <span className="text-[14px] font-semibold ds-text-main">
              {upload.isPending ? t("uploading") : t("dropzone")}
            </span>
            <span className="text-[12px] text-slate-400 dark:text-slate-500">{t("privacy")}</span>
          </button>
        </div>
      )}

      {isLoading || isError ? (
        <PanelState isLoading={isLoading} error={error} onRetry={refetch} />
      ) : documents.length === 0 ? (
        <Empty icon={FileText} title={t("emptyTitle")} description={t("emptyDescription")} />
      ) : (
        <ul className="flex flex-col gap-2 px-5 py-5 sm:px-6">
          {documents.map((doc) => (
            <li
              key={String(doc.id)}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border-form)] px-3.5 py-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
                <FileText size={17} className="text-[var(--color-btn-brand)]" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[14px] font-semibold ds-text-main">
                  {documentName(doc)}
                </span>
                <span className="text-[12px] text-slate-400 dark:text-slate-500">
                  {formatBytes(documentSize(doc))} · {formatDate(doc.created_at)}
                </span>
              </div>
              <StatusPill value={documentStatus(doc)} />
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  aria-label={t("delete")}
                  licon={<Trash2 size={14} />}
                  onClick={() => setPendingDelete(doc)}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <DeleteConfirmationModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("delete")}
        itemName={pendingDelete ? documentName(pendingDelete) : undefined}
        isLoading={remove.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          remove.mutate(pendingDelete.id, {
            onSuccess: () => {
              toast.success(t("deleted"));
              setPendingDelete(null);
            },
          });
        }}
      />
    </Panel>
  );
}
