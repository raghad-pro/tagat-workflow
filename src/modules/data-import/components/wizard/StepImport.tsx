"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useCommitImport, useSessionPreview } from "../../hooks/useDataImport";
import {
  previewDuplicate,
  previewInvalid,
  previewTotal,
  previewValid,
  num,
} from "../../utils/shape";
import { WizardCard, WizardTile } from "./WizardCard";

/**
 * Step 5 — the totals, then the confirmation.
 *
 * The figures are the session's own preview summary, so what is confirmed here
 * is what the server staged. `POST .../commit` is idempotent, which is why a
 * failed request can simply be retried without risking a double import — but it
 * does create real records, and there is no rollback route.
 */
export function StepImport({
  sessionId,
  onDone,
}: {
  sessionId: string;
  onDone: () => void;
}) {
  const t = useTranslations("dataImport");
  const { data: summary, isLoading } = useSessionPreview(sessionId);
  const commit = useCommitImport(sessionId);

  const ready = previewValid(summary);
  const invalid = previewInvalid(summary);
  const duplicate = previewDuplicate(summary);
  const sheets = num(summary, ["sheets_count", "sheets"], Array.isArray(summary?.sheets) ? summary!.sheets!.length : 0);
  const nothingToImport = !isLoading && ready === 0;

  return (
    <WizardCard
      title={t("run.title")}
      description={t("run.description")}
      actions={
        <>
          <Button
            size="lg"
            loading={commit.isPending}
            disabled={nothingToImport}
            licon={<ArrowUp size={16} />}
            onClick={() => commit.mutate(undefined, { onSuccess: onDone })}
            className={cn(
              "!bg-red-500 !text-white hover:!bg-red-600",
              "shadow-[0_4px_14px_-4px_rgba(239,68,68,0.6)]",
              (nothingToImport || commit.isPending) && "!bg-red-300 dark:!bg-red-500/40"
            )}
          >
            {t("run.start")}
          </Button>
          {nothingToImport && (
            <span className="text-[12px] text-slate-400 dark:text-slate-500">
              {t("run.nothingToImport")}
            </span>
          )}
        </>
      }
    >
      {/* ── The whole import, in four figures ── */}
      <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
        <WizardTile value={duplicate} label={t("run.tiles.duplicate")} tone="amber" />
        <WizardTile value={invalid} label={t("run.tiles.invalid")} tone="red" />
        <WizardTile value={ready} label={t("run.tiles.ready")} tone="green" />
        <WizardTile value={sheets} label={t("run.tiles.sheets")} tone="slate" />
      </div>

      {/* ── The warning that this is not reversible ── */}
      <div className="mx-auto mt-5 flex max-w-3xl items-start gap-2.5 rounded-xl bg-amber-500/[0.10] px-4 py-3.5">
        <AlertTriangle
          size={17}
          className="mt-[1px] shrink-0 text-amber-600 dark:text-amber-400"
        />
        <p className="text-[13.5px] leading-relaxed text-amber-700 dark:text-amber-400">
          {t("run.warning")}
        </p>
      </div>

      {previewTotal(summary) > 0 && (
        <p className="mx-auto mt-3 max-w-3xl text-center text-[12px] text-slate-400 dark:text-slate-500">
          {t("run.stagedRows", { rows: previewTotal(summary) })}
        </p>
      )}
    </WizardCard>
  );
}
