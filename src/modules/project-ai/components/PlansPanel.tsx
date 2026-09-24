"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Layers, WandSparkles } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { useAiDocuments, useAiPlans, useGenerateAiPlan } from "../hooks/useProjectAi";
import type { AiScope, Id } from "../types/project-ai.types";
import { formatDate, planSprints, planStatus, planTasks } from "../utils/shape";
import { PlanReview, type Member } from "./PlanReview";
import { Empty, Panel, PanelState, StatusPill } from "./ui";

/**
 * AI plan suggestions — generate, pick one, review it.
 *
 * Generation reads the project's requirement documents and writes a
 * suggestion only; nothing reaches the real sprints and tasks until a plan is
 * approved in `PlanReview`.
 */
export function PlansPanel({ scope, members }: { scope: AiScope | undefined; members: Member[] }) {
  const t = useTranslations("projectAi.plans");
  const { can } = usePermission();
  const canGenerate = can("project_ai.create");

  const { data: plans = [], isLoading, isError, error, refetch } = useAiPlans(scope);
  const { data: documents, isSuccess: documentsLoaded } = useAiDocuments(scope);
  const generate = useGenerateAiPlan(scope);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Open the newest plan by default, and keep the choice while it still exists.
  useEffect(() => {
    if (plans.length === 0) return;
    if (selectedId && plans.some((plan) => String(plan.id) === selectedId)) return;
    setSelectedId(String(plans[0].id));
  }, [plans, selectedId]);

  const noDocuments = documentsLoaded && (documents?.length ?? 0) === 0;
  const hasApproved = plans.some((plan) => planStatus(plan) === "approved");

  const handleGenerate = () =>
    generate.mutate(undefined, {
      onSuccess: (plan) => {
        toast.success(t("generated"));
        if (plan?.id !== undefined) setSelectedId(String(plan.id));
      },
    });

  return (
    <div className="flex flex-col gap-6">
      <Panel
        title={t("title")}
        description={t("description")}
        actions={
          canGenerate && (
            <Button
              size="md"
              licon={<WandSparkles size={16} />}
              loading={generate.isPending}
              disabled={!scope || noDocuments}
              title={noDocuments ? t("needsDocuments") : undefined}
              onClick={handleGenerate}
            >
              {generate.isPending ? t("generating") : t("generate")}
            </Button>
          )
        }
      >
        {noDocuments && canGenerate && (
          <p className="px-5 pt-4 text-[13px] text-amber-600 dark:text-amber-400 sm:px-6">
            {t("needsDocuments")}
          </p>
        )}

        {isLoading || isError ? (
          <PanelState isLoading={isLoading} error={error} onRetry={refetch} />
        ) : plans.length === 0 ? (
          <Empty icon={Layers} title={t("emptyTitle")} description={t("emptyDescription")} />
        ) : (
          <ul className="flex gap-2 overflow-x-auto px-5 py-4 sm:px-6">
            {plans.map((plan) => {
              const id = String(plan.id);
              const active = id === selectedId;
              return (
                <li key={id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(id)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-w-[190px] cursor-pointer flex-col items-start gap-1.5 rounded-xl border px-3.5 py-3 text-start transition-colors",
                      active
                        ? "border-[var(--color-btn-brand)] bg-[var(--color-btn-brand)]/[0.06]"
                        : "border-[var(--color-border-form)] hover:border-[var(--color-btn-brand)]/50"
                    )}
                  >
                    <span className="flex w-full items-center justify-between gap-2">
                      <span className="text-[14px] font-bold ds-text-main">
                        {t("planName", { number: id })}
                      </span>
                      <StatusPill value={planStatus(plan)} />
                    </span>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">
                      {t("counts", {
                        sprints: planSprints(plan).length,
                        tasks: planTasks(plan).length,
                      })}
                    </span>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">
                      {formatDate(plan.created_at)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {selectedId && (
        <PlanReview
          key={selectedId}
          scope={scope}
          planId={selectedId as Id}
          members={members}
          otherPlanApproved={hasApproved}
        />
      )}
    </div>
  );
}
