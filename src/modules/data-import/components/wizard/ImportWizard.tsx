"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { Button } from "@/components/atoms/Button";
import {
  useCommitResult,
  useImportFiles,
  useImportSession,
} from "../../hooks/useDataImport";
import { WIZARD_STEPS, type WizardStep } from "../../types/data-import.types";
import { sheetsOf } from "../../utils/shape";
import { StepImport } from "./StepImport";
import { StepMapping } from "./StepMapping";
import { StepParse } from "./StepParse";
import { StepPreview } from "./StepPreview";
import { StepResult } from "./StepResult";
import { StepUpload } from "./StepUpload";
import { WizardStepper } from "./WizardStepper";

/**
 * The six-step import, for one session.
 *
 * The server holds no cursor for "which step am I on", so how far the session
 * has got is derived from what it actually has: files unlock parse, sheets
 * unlock mapping, a commit result unlocks the result. `view` is the step on
 * screen, and it never rewinds that derived progress — stepping back to fix a
 * mapping leaves everything ahead of it still reachable.
 */
export function ImportWizard({ sessionId }: { sessionId: string }) {
  const t = useTranslations("dataImport");
  const router = useRouter();
  const isAr = useLocale() === "ar";

  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useImportSession(sessionId);
  const { data: files = [] } = useImportFiles(sessionId);
  const { data: commitResult } = useCommitResult(sessionId);

  const sheets = useMemo(() => files.flatMap(sheetsOf), [files]);

  const reached: WizardStep = useMemo(() => {
    if (commitResult && Object.keys(commitResult).length > 0) return "result";
    if (sheets.some((sheet) => sheet.entity)) return "import";
    if (sheets.length > 0) return "mapping";
    if (files.length > 0) return "parse";
    return "upload";
  }, [files.length, sheets, commitResult]);

  const [view, setView] = useState<WizardStep>("upload");
  const [visited, setVisited] = useState<WizardStep>("upload");

  // Land on the furthest step the session has reached, once — after that the
  // user's own navigation wins.
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (landed || isLoading) return;
    setView(reached);
    setVisited(reached);
    setLanded(true);
  }, [landed, isLoading, reached]);

  const furthest =
    WIZARD_STEPS.indexOf(visited) > WIZARD_STEPS.indexOf(reached) ? visited : reached;

  const goTo = (step: WizardStep) => {
    setView(step);
    if (WIZARD_STEPS.indexOf(step) > WIZARD_STEPS.indexOf(visited)) setVisited(step);
  };

  if (isLoading) {
    return (
      <PageContainer isLoading skeletonVariant="dashboard">
        {null}
      </PageContainer>
    );
  }

  if (isError || !session) {
    return (
      <PageContainer isLoading={false} isError={isError} error={error} onRetry={refetch}>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--color-border-form)] px-6 py-14 text-center">
          <p className="text-[15px] font-bold ds-text-main">{t("notFound.title")}</p>
          <p className="max-w-sm text-[13px] text-slate-400 dark:text-slate-500">
            {t("notFound.description")}
          </p>
          <Button size="md" onClick={() => router.push("/data-import")}>
            {t("result.backToList")}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer isLoading={false}>
      {/* ── Header ── */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/data-import")}
          aria-label={t("backToList")}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-[var(--color-btn-brand)]/10 hover:text-[var(--color-btn-brand)] dark:text-slate-400"
        >
          <ArrowLeft size={18} className={isAr ? "rotate-180" : undefined} />
        </button>
        <h1 className="text-[24px] font-[800] leading-none tracking-tight ds-text-main sm:text-[30px] md:text-[34px]">
          {t("sessionName", { number: String(session.id) })}
        </h1>
      </div>

      <WizardStepper current={view} reached={furthest} onSelect={setView} />

      {view === "upload" && (
        <StepUpload sessionId={sessionId} files={files} onNext={() => goTo("parse")} />
      )}
      {view === "parse" && (
        <StepParse sessionId={sessionId} files={files} onNext={() => goTo("mapping")} />
      )}
      {view === "mapping" && (
        <StepMapping files={files} onNext={() => goTo("preview")} />
      )}
      {view === "preview" && (
        <StepPreview files={files} onNext={() => goTo("import")} />
      )}
      {view === "import" && (
        <StepImport sessionId={sessionId} onDone={() => goTo("result")} />
      )}
      {view === "result" && <StepResult sessionId={sessionId} />}
    </PageContainer>
  );
}
