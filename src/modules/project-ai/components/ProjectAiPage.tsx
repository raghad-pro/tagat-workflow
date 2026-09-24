"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, FileText, FolderKanban, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { Pagination } from "@/components/molecules/Pagination";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useAuth } from "@/providers/AuthProvider";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import type { Project } from "@/modules/projects/types/projects.types";
import { cn } from "@/lib/utils";
import { str } from "../utils/shape";
import { Empty, PanelState } from "./ui";

const PAGE_SIZE = 9;

const STEPS = [
  { key: "documents", icon: FileText },
  { key: "plans", icon: Layers },
  { key: "alerts", icon: ShieldAlert },
] as const;

/**
 * Project AI — the landing screen.
 *
 * Every AI route hangs off a project, so this is a project picker with the
 * three-step flow spelled out above it; the work happens at
 * `/project-ai/[projectId]`.
 */
export default function ProjectAiPage() {
  const t = useTranslations("projectAi");
  const isAr = useLocale() === "ar";
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useProjects({
    search,
    page,
    per_page: PAGE_SIZE,
  });
  const projects: Project[] = data?.data ?? [];

  return (
    <div className="p-0 sm:p-4">
      {/* ── Header ── */}
      <div className="mb-6 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-btn-brand)]/10">
          <Sparkles size={20} className="text-[var(--color-btn-brand)]" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] font-[800] leading-none tracking-tight ds-text-main sm:text-[30px] md:text-[34px]">
            {t("title")}
          </h1>
          <p className="mt-1 text-[14px] font-medium tracking-wide text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* ── How it works ── */}
      <ol className="mb-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ key, icon: Icon }, index) => (
          <li
            key={key}
            className="flex gap-3 rounded-2xl px-4 py-4 ds-bg-form shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)]"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-btn-brand)]/10">
              <Icon size={17} className="text-[var(--color-btn-brand)]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-bold ds-text-main">
                {index + 1}. {t(`steps.${key}.title`)}
              </span>
              <span className="text-[12px] leading-relaxed text-slate-400 dark:text-slate-500">
                {t(`steps.${key}.description`)}
              </span>
            </div>
          </li>
        ))}
      </ol>

      {/* ── Projects ── */}
      <div className="flex flex-col rounded-2xl ds-bg-form shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)]">
        <div className="border-b p-4 sm:p-6" style={{ borderColor: "var(--color-border-form)" }}>
          <h2 className="mb-3 text-[16px] font-bold ds-text-main">{t("chooseProject")}</h2>
          <SearchFilterBar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder={t("searchPlaceholder")}
          />
        </div>

        {isLoading || isError ? (
          <PanelState isLoading={isLoading} error={error} onRetry={refetch} />
        ) : projects.length === 0 ? (
          <Empty icon={FolderKanban} title={t("noProjects")} />
        ) : (
          <ul className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {projects.map((project) => {
              const company = str(project.company, ["name"]) ||
                (typeof project.company === "string" ? project.company : "");
              const client = str(project.client, ["name"]) ||
                (typeof project.client === "string" ? project.client : "");
              return (
                <li key={project.id}>
                  <Link
                    href={`/project-ai/${project.id}`}
                    className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--color-border-form)] px-4 py-4 transition-colors hover:border-[var(--color-btn-brand)] hover:bg-[var(--color-btn-brand)]/[0.04]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-[15px] font-bold ds-text-main">
                        {project.title ?? project.name ?? `#${project.id}`}
                      </span>
                      {project.status && <StatusBadge status={project.status} withDot />}
                    </div>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">
                      {[isSuperAdmin ? company : "", client].filter(Boolean).join(" · ") || "—"}
                    </span>
                    <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--color-btn-brand)]">
                      {t("open")}
                      <ChevronRight
                        size={15}
                        className={cn(
                          "transition-transform",
                          isAr ? "rotate-180 group-hover:-translate-x-0.5" : "group-hover:translate-x-0.5"
                        )}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {(data?.total ?? 0) > PAGE_SIZE && (
          <div className="flex justify-end border-t p-4" style={{ borderColor: "var(--color-border-form)" }}>
            <Pagination
              currentPage={page}
              data={Array(data?.total ?? 0).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
