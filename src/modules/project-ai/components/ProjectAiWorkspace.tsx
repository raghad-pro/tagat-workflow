"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, FileText, Layers, ShieldAlert, Sparkles } from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { memberUserIdOf } from "@/modules/projects/types/projects.types";
import { cn } from "@/lib/utils";
import { useProjectAiScope } from "../hooks/useProjectAi";
import { str } from "../utils/shape";
import { AlertsPanel } from "./AlertsPanel";
import { DocumentsPanel } from "./DocumentsPanel";
import { PlansPanel } from "./PlansPanel";
import type { Member } from "./PlanReview";

const TABS = [
  { key: "documents", icon: FileText },
  { key: "plans", icon: Layers },
  { key: "alerts", icon: ShieldAlert },
] as const;
type Tab = (typeof TABS)[number]["key"];

/** A member row's display name, whichever shape the project sent. */
function memberName(member: unknown): string {
  if (typeof member !== "object" || member === null) return String(member ?? "");
  const row = member as {
    name?: string;
    employee_name?: string;
    user?: { name?: string; first_name?: string; last_name?: string };
  };
  return (
    row.name ||
    row.employee_name ||
    row.user?.name ||
    `${row.user?.first_name ?? ""} ${row.user?.last_name ?? ""}`.trim()
  );
}

/**
 * One project's AI workspace — documents, plans and risk alerts as tabs.
 *
 * The tab lives in the URL (`?tab=plans`) so a link can land on it and the
 * back button walks through it.
 */
export function ProjectAiWorkspace({ projectId }: { projectId: string }) {
  const t = useTranslations("projectAi");
  const isAr = useLocale() === "ar";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const requested = searchParams.get("tab");
  const tab: Tab = TABS.some((item) => item.key === requested) ? (requested as Tab) : "documents";

  const { scope, project } = useProjectAiScope(projectId);
  const record = project.data;
  const title = str(record, ["title", "name"], t("projectFallback", { number: projectId }));
  const company = str((record as { company?: unknown } | undefined)?.company, ["name"]);

  const members: Member[] = useMemo(() => {
    const row = record as { employees?: unknown; users?: unknown } | undefined;
    const list = Array.isArray(row?.employees) && row.employees.length > 0
      ? row.employees
      : Array.isArray(row?.users)
        ? row.users
        : [];
    const seen = new Map<string, Member>();
    for (const member of list as unknown[]) {
      const id = memberUserIdOf(member);
      if (id && !seen.has(id)) seen.set(id, { id, name: memberName(member) || `#${id}` });
    }
    return [...seen.values()];
  }, [record]);

  const selectTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <PageContainer
      isLoading={project.isLoading}
      skeletonVariant="dashboard"
      isError={project.isError}
      error={project.error}
      onRetry={project.refetch}
    >
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-3">
        <Link
          href="/project-ai"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-slate-400 transition-colors hover:text-[var(--color-btn-brand)]"
        >
          <ArrowLeft size={15} className={cn(isAr && "rotate-180")} />
          {t("backToProjects")}
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-btn-brand)]/10">
            <Sparkles size={20} className="text-[var(--color-btn-brand)]" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-[22px] font-[800] leading-tight tracking-tight ds-text-main sm:text-[28px]">
              {title}
            </h1>
            <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
              {company ? `${company} · ${t("workspaceSubtitle")}` : t("workspaceSubtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div
        role="tablist"
        className="mb-6 flex gap-1 overflow-x-auto rounded-2xl p-1 ds-bg-form shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] sm:w-fit"
      >
        {TABS.map(({ key, icon: Icon }, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => selectTab(key)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-colors",
              tab === key
                ? "bg-[var(--color-btn-brand)] text-white"
                : "text-slate-500 hover:text-[var(--color-btn-brand)] dark:text-slate-400"
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[11px]",
                tab === key ? "bg-white/25" : "bg-slate-100 dark:bg-slate-800"
              )}
            >
              {index + 1}
            </span>
            <Icon size={15} />
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "documents" && <DocumentsPanel scope={scope} />}
      {tab === "plans" && <PlansPanel scope={scope} members={members} />}
      {tab === "alerts" && <AlertsPanel scope={scope} />}
    </PageContainer>
  );
}
