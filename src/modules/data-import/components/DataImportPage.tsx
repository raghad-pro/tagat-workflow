"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, History, ListOrdered, Trash2, UploadCloud, Plus } from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { PageCard, PageCardSection } from "@/components/molecules/Pagecard";
import { Button } from "@/components/atoms/Button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { companyApi } from "@/modules/companies/api/companies.api";
import { cn } from "@/lib/utils";
import {
  useCreateImportSession,
  useDeleteImportSession,
  useImportSessions,
} from "../hooks/useDataImport";
import { ENTITIES, type DataImportSession } from "../types/data-import.types";
import { fileName, formatDate, sheetsOf, str } from "../utils/shape";
import { SELECT_CLASS } from "./wizard/WizardCard";
import { SessionStatusBadge } from "./SessionStatusBadge";

/**
 * Data import — the landing screen.
 *
 * Sessions come from `GET {prefix}/dataImports`. "New import" creates one and
 * hands it to the six-step wizard at `/data-import/[id]`; a super admin has to
 * name the company it imports into, since the route cannot infer one.
 */
export default function DataImportPage() {
  const t = useTranslations("dataImport");
  const isAr = useLocale() === "ar";
  const router = useRouter();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: sessions = [], isLoading, isError, error, refetch } = useImportSessions();
  const createSession = useCreateImportSession();
  const deleteSession = useDeleteImportSession();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");

  // The picker is a super admin's alone, and so is the endpoint behind it —
  // `/super_admin/companies` answers 403 to anyone else, so it stays disabled
  // rather than firing a request that can only fail.
  const { data: companiesResponse } = useQuery({
    queryKey: ["companies", "data-import-picker"],
    queryFn: () => companyApi.getAll({ page: 1, per_page: 100 } as never),
    enabled: isSuperAdmin,
  });
  const companies = companiesResponse?.data?.data ?? [];

  const handleNewImport = () => {
    createSession.mutate(isSuperAdmin && companyId ? companyId : undefined, {
      onSuccess: (session) => {
        if (session?.id !== undefined) router.push(`/data-import/${session.id}`);
      },
    });
  };

  return (
    <PageContainer
      isLoading={isLoading}
      skeletonVariant="dashboard"
      isError={isError}
      error={error}
      onRetry={refetch}
    >
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-[800] leading-none tracking-tight ds-text-main sm:text-[30px] md:text-[34px]">
            {t("title")}
          </h1>
          <p className="mt-1 text-[14px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <Button
          variant="ghost"
          size="md"
          className="self-start whitespace-nowrap sm:self-auto"
          ricon={<History size={16} />}
          onClick={() => router.push("/data-import/history")}
        >
          {t("history")}
        </Button>
      </div>

      {/* ── Start a new import ── */}
      <PageCard className="mb-6">
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-[16px] font-bold ds-text-main">{t("start.title")}</h2>
            <p className="max-w-xl text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
              {t("start.formats")}
            </p>
            <p className="max-w-xl text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
              {t("start.draftNote")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            {/* The create route needs `target_company_id` from a super admin —
                a company admin's own company is implied by the token. */}
            {isSuperAdmin && (
              <select
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className={cn(SELECT_CLASS, "h-10 w-auto min-w-[190px]")}
              >
                <option value="">{t("start.chooseCompany")}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name || `#${company.id}`}
                  </option>
                ))}
              </select>
            )}

            <Button
              size="md"
              className="whitespace-nowrap"
              ricon={<Plus size={16} />}
              loading={createSession.isPending}
              disabled={isSuperAdmin && !companyId}
              onClick={handleNewImport}
            >
              {t("newImport")}
            </Button>
          </div>
        </div>
      </PageCard>

      {/* ── Sessions ── */}
      <PageCard>
        <PageCardSection className="px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-bold ds-text-main">{t("sessions.title")}</h2>
            <div className="flex items-center gap-2 text-[12px] text-slate-400 dark:text-slate-500">
              <span>{t("sessions.count", { count: sessions.length })}</span>
              <ListOrdered size={15} />
            </div>
          </div>
        </PageCardSection>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-btn-brand)]/10">
              <UploadCloud size={22} className="text-[var(--color-btn-brand)]" />
            </div>
            <p className="text-[15px] font-bold ds-text-main">{t("sessions.emptyTitle")}</p>
            <p className="max-w-sm text-[13px] text-slate-400 dark:text-slate-500">
              {t("sessions.emptyDescription")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((session, index) => (
              <SessionRow
                key={String(session.id)}
                session={session}
                isAr={isAr}
                isFirst={index === 0}
                isOpen={expandedId === String(session.id)}
                onToggle={() =>
                  setExpandedId((current) =>
                    current === String(session.id) ? null : String(session.id)
                  )
                }
                onDelete={() => deleteSession.mutate(session.id)}
                isDeleting={deleteSession.isPending}
              />
            ))}
          </ul>
        )}
      </PageCard>
    </PageContainer>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SessionRow({
  session,
  isAr,
  isFirst,
  isOpen,
  onToggle,
  onDelete,
  isDeleting,
}: {
  session: DataImportSession;
  isAr: boolean;
  isFirst: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("dataImport");
  const files = Array.isArray(session.files) ? session.files : [];
  const sheets = files.flatMap(sheetsOf);

  /** Which of the five stages this session already has a sheet for. */
  const entities = new Set(
    sheets.map((sheet) => String(sheet.entity ?? "")).filter(Boolean)
  );

  return (
    <li className={cn(!isFirst && "border-t border-[var(--color-border-form)]")}>
      <div className="flex items-center gap-3 px-5 transition-colors duration-200 hover:bg-[var(--color-btn-brand)]/[0.06] sm:px-6">
        {/* The chevron is its own control: the row itself opens the wizard. */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label={t("sessionName", { number: String(session.id) })}
          className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-[var(--color-btn-brand)]"
        >
          <motion.span
            aria-hidden
            className="flex items-center"
            animate={{ rotate: isOpen ? 90 : isAr ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <ChevronRight size={16} />
          </motion.span>
        </button>

        <Link
          href={`/data-import/${session.id}`}
          className="flex min-w-0 flex-1 flex-col gap-1 py-4"
        >
          <span className="truncate text-[14px] font-semibold ds-text-main">
            {t("sessionName", { number: String(session.id) })}
          </span>

          {/* The pipeline, in dependency order; a stage lights up once a sheet
              has been mapped to it. */}
          <span className="flex flex-wrap items-center gap-1 text-[12px]">
            {ENTITIES.map((entity, index) => (
              <span
                key={entity}
                className={cn(
                  "flex items-center gap-1",
                  entities.has(entity)
                    ? "text-[var(--color-btn-brand)]"
                    : "text-slate-400 dark:text-slate-500"
                )}
              >
                {index > 0 && (
                  <ChevronRight
                    size={11}
                    aria-hidden
                    className={cn("shrink-0 opacity-60", isAr && "rotate-180")}
                  />
                )}
                <span>{t(`stages.${entity}` as Parameters<typeof t>[0])}</span>
              </span>
            ))}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-[12px] text-slate-400 dark:text-slate-500 sm:inline">
            {formatDate(session.created_at)}
          </span>
          <SessionStatusBadge status={str(session, ["status"], "draft")} />
        </div>
      </div>

      {/* ── The session's files, unfolding in place ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2, ease: "easeOut" },
            }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-4 sm:px-6">
              {files.length === 0 ? (
                <p className="text-[12px] text-slate-400 dark:text-slate-500">
                  {t("noFile")}
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {files.map((file) => (
                    <li
                      key={String(file.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border-form)] px-3 py-2.5"
                    >
                      <span className="truncate text-[13px] font-semibold ds-text-main">
                        {fileName(file)}
                      </span>
                      <span className="text-[12px] text-slate-400 dark:text-slate-500">
                        {t("sessions.sheetCount", { count: sheetsOf(file).length })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-5 sm:px-6">
              <span className="text-[12px] text-slate-400 dark:text-slate-500">
                {formatDate(session.created_at)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  licon={<Trash2 size={14} />}
                  loading={isDeleting}
                  onClick={onDelete}
                >
                  {t("sessions.delete")}
                </Button>
                <Link href={`/data-import/${session.id}`}>
                  <Button size="sm">{t("sessions.open")}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
