"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { CalendarRange, CircleCheck, Info, ListChecks, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ActionModal } from "@/components/molecules/ActionModal";
import { usePermission } from "@/hooks/usePermission";
import { cn } from "@/lib/utils";
import { useAiPlan, useApproveAiPlan, useReviewAiPlan } from "../hooks/useProjectAi";
import {
  PRIORITIES,
  type AiScope,
  type Id,
  type ReviewPlanPayload,
  type SprintReview,
  type SprintSuggestion,
  type TaskReview,
  type TaskSuggestion,
} from "../types/project-ai.types";
import {
  bool,
  errorMessage,
  errorStatus,
  isPlanApproved,
  isPlanFailed,
  planSource,
  planSprints,
  planStatus,
  planSummary,
  planTasks,
  str,
  taskAssignee,
  taskSprintId,
  toDateInput,
} from "../utils/shape";
import { FIELD_CLASS, Panel, PanelState, StatusPill } from "./ui";

export interface Member {
  id: string;
  name: string;
}

/** Unsaved edits, keyed by suggestion id. Only touched fields are present. */
type Edits = Record<string, Record<string, string | boolean>>;

/**
 * Review one plan suggestion, then approve it.
 *
 * Everything here edits the *suggestion*: `PATCH …/review` saves the changes,
 * and only `POST …/approve` turns the included sprints and tasks into real
 * rows. Approval acts on what the server holds, so it waits until every edit
 * has been saved.
 */
export function PlanReview({
  scope,
  planId,
  members,
  otherPlanApproved,
}: {
  scope: AiScope | undefined;
  planId: Id;
  members: Member[];
  otherPlanApproved: boolean;
}) {
  const t = useTranslations("projectAi.review");
  const { can } = usePermission();

  const { data: plan, isLoading, isError, error, refetch } = useAiPlan(scope, planId);
  const review = useReviewAiPlan(scope);
  const approve = useApproveAiPlan(scope);

  const [sprintEdits, setSprintEdits] = useState<Edits>({});
  const [taskEdits, setTaskEdits] = useState<Edits>({});
  const [approveOpen, setApproveOpen] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [approveError, setApproveError] = useState("");

  const sprints = useMemo(() => planSprints(plan), [plan]);
  const tasks = useMemo(() => planTasks(plan), [plan]);

  const approved = isPlanApproved(plan);
  const editable = !!plan && !approved && !isPlanFailed(plan) && can("project_ai.manage");
  const canApprove = !!plan && !approved && !isPlanFailed(plan) && can("project_ai.approve");

  // ── Reading a field: the unsaved edit, else what the server sent ──
  const sprintValue = (sprint: SprintSuggestion, field: string, fallback: string | boolean) =>
    sprintEdits[String(sprint.id)]?.[field] ?? fallback;
  const taskValue = (task: TaskSuggestion, field: string, fallback: string | boolean) =>
    taskEdits[String(task.id)]?.[field] ?? fallback;

  const original = {
    sprint: (sprint: SprintSuggestion): Record<string, string | boolean> => ({
      is_included: bool(sprint, ["is_included", "included"], true),
      title: str(sprint, ["title", "name"]),
      goal: str(sprint, ["goal"]),
      start_date: toDateInput(str(sprint, ["start_date"])),
      end_date: toDateInput(str(sprint, ["end_date"])),
    }),
    task: (task: TaskSuggestion): Record<string, string | boolean> => ({
      is_included: bool(task, ["is_included", "included"], true),
      title: str(task, ["title", "name"]),
      description: str(task, ["description"]),
      story_points: str(task, ["story_points", "points"]),
      priority: str(task, ["priority"]).toLowerCase(),
      sprint_suggestion_id: taskSprintId(task),
      assigned_to: taskAssignee(task),
    }),
  };

  /** Records an edit, and forgets it again once it matches the server. */
  const edit =
    (setter: typeof setSprintEdits, base: Record<string, string | boolean>, id: Id) =>
    (field: string, value: string | boolean) =>
      setter((current) => {
        const next = { ...(current[String(id)] ?? {}) };
        if (base[field] === value) delete next[field];
        else next[field] = value;
        const copy = { ...current };
        if (Object.keys(next).length === 0) delete copy[String(id)];
        else copy[String(id)] = next;
        return copy;
      });

  const dirtyCount = Object.keys(sprintEdits).length + Object.keys(taskEdits).length;
  const dirty = dirtyCount > 0;

  const included = {
    sprints: sprints.filter((s) => sprintValue(s, "is_included", original.sprint(s).is_included))
      .length,
    tasks: tasks.filter((task) => taskValue(task, "is_included", original.task(task).is_included))
      .length,
  };

  // ── Save ──
  const buildPayload = (): ReviewPlanPayload => {
    const sprintRows: SprintReview[] = Object.entries(sprintEdits).map(([id, fields]) => {
      const row: SprintReview = { id: Number(id) };
      for (const [field, value] of Object.entries(fields)) {
        if (field === "is_included") row.is_included = Boolean(value);
        else if (field === "title") row.title = String(value);
        else if (field === "goal") row.goal = value === "" ? null : String(value);
        else if (field === "start_date") row.start_date = value === "" ? null : String(value);
        else if (field === "end_date") row.end_date = value === "" ? null : String(value);
      }
      return row;
    });

    const taskRows: TaskReview[] = Object.entries(taskEdits).map(([id, fields]) => {
      const row: TaskReview = { id: Number(id) };
      for (const [field, value] of Object.entries(fields)) {
        if (field === "is_included") row.is_included = Boolean(value);
        else if (field === "title") row.title = String(value);
        else if (field === "description") row.description = value === "" ? null : String(value);
        else if (field === "story_points")
          row.story_points = value === "" ? null : Number(value);
        else if (field === "priority")
          row.priority = value === "" ? null : (value as TaskReview["priority"]);
        else if (field === "sprint_suggestion_id") row.sprint_suggestion_id = Number(value);
        else if (field === "assigned_to") {
          // Clearing an assignee is its own flag; `assigned_to: null` alone
          // reads as "leave it".
          if (value === "") row.unassign = true;
          else row.assigned_to = Number(value);
        }
      }
      return row;
    });

    return {
      ...(sprintRows.length > 0 && { sprints: sprintRows }),
      ...(taskRows.length > 0 && { tasks: taskRows }),
    };
  };

  const handleSave = () =>
    review.mutate(
      { planId, payload: buildPayload() },
      {
        onSuccess: () => {
          toast.success(t("saved"));
          setSprintEdits({});
          setTaskEdits({});
        },
      }
    );

  const discard = () => {
    setSprintEdits({});
    setTaskEdits({});
  };

  // ── Approve ──
  const openApprove = () => {
    setApproveError("");
    setNeedsConfirm(otherPlanApproved);
    setConfirmed(false);
    setApproveOpen(true);
  };

  const handleApprove = () => {
    if (needsConfirm && !confirmed) {
      setApproveError(t("approve.confirmRequired"));
      return;
    }
    approve.mutate(
      { planId, confirmAdditional: needsConfirm && confirmed },
      {
        onSuccess: () => {
          toast.success(t("approve.done"));
          setApproveOpen(false);
        },
        onError: (err) => {
          const message = errorMessage(err);
          const status = errorStatus(err);
          // The server asks before a second plan lands on a project that already
          // has one — that is a question to put to the user, not a failure.
          const asksToConfirm =
            (status === 409 || status === 422) &&
            /confirm_additional_plan|additional|already/i.test(
              JSON.stringify((err as { response?: { data?: unknown } })?.response?.data ?? message)
            );
          if (asksToConfirm && !needsConfirm) {
            setNeedsConfirm(true);
            setApproveError(message);
            return;
          }
          setApproveError(message);
        },
      }
    );
  };

  if (isLoading || isError || !plan) {
    return (
      <Panel title={t("title")}>
        <PanelState isLoading={isLoading} error={error} onRetry={refetch} />
      </Panel>
    );
  }

  const sprintIds = new Set(sprints.map((s) => String(s.id)));
  const tasksOf = (sprintId: string) =>
    tasks.filter(
      (task) =>
        String(taskValue(task, "sprint_suggestion_id", original.task(task).sprint_suggestion_id)) ===
        sprintId
    );
  const loose = tasks.filter(
    (task) =>
      !sprintIds.has(
        String(taskValue(task, "sprint_suggestion_id", original.task(task).sprint_suggestion_id))
      )
  );

  const summary = planSummary(plan);
  const source = planSource(plan);

  return (
    <>
      <Panel
        title={t("heading", { number: String(plan.id) })}
        description={approved ? t("approvedNote") : t("description")}
        actions={
          <>
            <StatusPill value={planStatus(plan)} />
            {source && (
              <span className="text-[12px] text-slate-400 dark:text-slate-500">
                {t("source", { source })}
              </span>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-5 px-5 py-5 sm:px-6">
          {summary && (
            <p className="rounded-xl bg-[var(--color-btn-brand)]/[0.06] px-4 py-3 text-[13px] leading-relaxed ds-text-main">
              {summary}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-[12px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-form)] px-2.5 py-1">
              <CalendarRange size={13} />
              {t("includedSprints", { included: included.sprints, total: sprints.length })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-form)] px-2.5 py-1">
              <ListChecks size={13} />
              {t("includedTasks", { included: included.tasks, total: tasks.length })}
            </span>
          </div>

          {sprints.length === 0 && tasks.length === 0 && (
            <p className="text-[13px] text-slate-400 dark:text-slate-500">{t("empty")}</p>
          )}

          {sprints.map((sprint) => {
            const base = original.sprint(sprint);
            const set = edit(setSprintEdits, base, sprint.id);
            const isIncluded = Boolean(sprintValue(sprint, "is_included", base.is_included));
            const sprintTasks = tasksOf(String(sprint.id));

            return (
              <div
                key={String(sprint.id)}
                className={cn(
                  "rounded-xl border border-[var(--color-border-form)]",
                  !isIncluded && "opacity-60"
                )}
              >
                <div className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <IncludeToggle
                      checked={isIncluded}
                      disabled={!editable}
                      label={t("include")}
                      onChange={(value) => set("is_included", value)}
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <input
                        className={cn(FIELD_CLASS, "h-10 text-[14px] font-bold")}
                        value={String(sprintValue(sprint, "title", base.title))}
                        disabled={!editable}
                        maxLength={255}
                        aria-label={t("fields.sprintTitle")}
                        onChange={(e) => set("title", e.target.value)}
                      />
                      <textarea
                        className={cn(FIELD_CLASS, "h-auto min-h-[60px] py-2")}
                        value={String(sprintValue(sprint, "goal", base.goal))}
                        disabled={!editable}
                        maxLength={2000}
                        placeholder={t("fields.goal")}
                        aria-label={t("fields.goal")}
                        onChange={(e) => set("goal", e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                        <label className="flex flex-col gap-1 text-[12px] text-slate-400">
                          {t("fields.start")}
                          <input
                            type="date"
                            className={FIELD_CLASS}
                            value={String(sprintValue(sprint, "start_date", base.start_date))}
                            disabled={!editable}
                            onChange={(e) => set("start_date", e.target.value)}
                          />
                        </label>
                        <label className="flex flex-col gap-1 text-[12px] text-slate-400">
                          {t("fields.end")}
                          <input
                            type="date"
                            className={FIELD_CLASS}
                            value={String(sprintValue(sprint, "end_date", base.end_date))}
                            min={String(sprintValue(sprint, "start_date", base.start_date)) || undefined}
                            disabled={!editable}
                            onChange={(e) => set("end_date", e.target.value)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <TaskList
                  tasks={sprintTasks}
                  sprints={sprints}
                  members={members}
                  editable={editable}
                  value={taskValue}
                  original={original.task}
                  onEdit={(task) => edit(setTaskEdits, original.task(task), task.id)}
                />
              </div>
            );
          })}

          {loose.length > 0 && (
            <div className="rounded-xl border border-dashed border-[var(--color-border-form)]">
              <p className="px-4 pt-4 text-[13px] font-bold ds-text-main">{t("unscheduled")}</p>
              <TaskList
                tasks={loose}
                sprints={sprints}
                members={members}
                editable={editable}
                value={taskValue}
                original={original.task}
                onEdit={(task) => edit(setTaskEdits, original.task(task), task.id)}
              />
            </div>
          )}
        </div>

        {(editable || canApprove) && (
          <div
            className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-5 py-4 ds-bg-form sm:px-6"
            style={{ borderTop: "1px solid var(--color-border-form)" }}
          >
            <span className="flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
              <Info size={13} />
              {dirty ? t("unsaved", { count: dirtyCount }) : t("aiNeverDecides")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {editable && dirty && (
                <Button variant="ghost" size="md" licon={<RotateCcw size={15} />} onClick={discard}>
                  {t("discard")}
                </Button>
              )}
              {editable && (
                <Button
                  variant="outline"
                  size="md"
                  licon={<Save size={15} />}
                  disabled={!dirty}
                  loading={review.isPending}
                  onClick={handleSave}
                >
                  {t("save")}
                </Button>
              )}
              {canApprove && (
                <Button
                  size="md"
                  licon={<CircleCheck size={15} />}
                  disabled={dirty || included.tasks + included.sprints === 0}
                  title={dirty ? t("saveFirst") : undefined}
                  onClick={openApprove}
                >
                  {t("approve.button")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Panel>

      <ActionModal
        isOpen={approveOpen}
        onClose={() => setApproveOpen(false)}
        title={t("approve.title")}
        mode="edit"
        size="sm"
        onSubmit={handleApprove}
        isLoading={approve.isPending}
        saveLabel={t("approve.confirm")}
      >
        <div className="flex flex-col gap-4 text-[14px] ds-text-main">
          <p className="leading-relaxed">
            {t("approve.body", { sprints: included.sprints, tasks: included.tasks })}
          </p>
          {needsConfirm && (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-400/50 bg-amber-50 px-3 py-3 text-[13px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[var(--color-btn-brand)]"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setApproveError("");
                }}
              />
              {t("approve.additional")}
            </label>
          )}
          {approveError && <p className="text-[13px] text-red-500">{approveError}</p>}
        </div>
      </ActionModal>
    </>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

function TaskList({
  tasks,
  sprints,
  members,
  editable,
  value,
  original,
  onEdit,
}: {
  tasks: TaskSuggestion[];
  sprints: SprintSuggestion[];
  members: Member[];
  editable: boolean;
  value: (task: TaskSuggestion, field: string, fallback: string | boolean) => string | boolean;
  original: (task: TaskSuggestion) => Record<string, string | boolean>;
  onEdit: (task: TaskSuggestion) => (field: string, value: string | boolean) => void;
}) {
  const t = useTranslations("projectAi.review");
  const tAi = useTranslations("projectAi");
  const [openId, setOpenId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <p
        className="px-4 py-3 text-[12px] text-slate-400 dark:text-slate-500"
        style={{ borderTop: "1px solid var(--color-border-form)" }}
      >
        {t("noTasks")}
      </p>
    );
  }

  return (
    <ul style={{ borderTop: "1px solid var(--color-border-form)" }}>
      {tasks.map((task, index) => {
        const base = original(task);
        const set = onEdit(task);
        const id = String(task.id);
        const isIncluded = Boolean(value(task, "is_included", base.is_included));
        const assignee = String(value(task, "assigned_to", base.assigned_to));
        // Keep a suggested assignee visible even when they are not in the
        // member list we could read.
        const options =
          assignee && !members.some((m) => m.id === assignee)
            ? [...members, { id: assignee, name: `#${assignee}` }]
            : members;

        return (
          <li
            key={id}
            className={cn(
              "flex flex-col gap-2 px-4 py-3",
              index > 0 && "border-t border-[var(--color-border-form)]",
              !isIncluded && "opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <IncludeToggle
                checked={isIncluded}
                disabled={!editable}
                label={t("include")}
                onChange={(v) => set("is_included", v)}
              />
              <input
                className={cn(FIELD_CLASS, "min-w-0 flex-1 font-semibold")}
                value={String(value(task, "title", base.title))}
                disabled={!editable}
                maxLength={255}
                aria-label={t("fields.taskTitle")}
                onChange={(e) => set("title", e.target.value)}
              />
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === id ? null : id))}
                aria-expanded={openId === id}
                className="shrink-0 cursor-pointer text-[12px] font-semibold text-[var(--color-btn-brand)] hover:underline"
              >
                {openId === id ? t("less") : t("more")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 ps-7 sm:grid-cols-4">
              <select
                className={FIELD_CLASS}
                value={String(value(task, "priority", base.priority))}
                disabled={!editable}
                aria-label={t("fields.priority")}
                onChange={(e) => set("priority", e.target.value)}
              >
                <option value="">{t("fields.priority")}</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {tAi(`priority.${p}`)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={13}
                className={FIELD_CLASS}
                value={String(value(task, "story_points", base.story_points))}
                disabled={!editable}
                placeholder={t("fields.points")}
                aria-label={t("fields.points")}
                onChange={(e) => {
                  const raw = e.target.value;
                  const n = Number(raw);
                  set("story_points", raw === "" ? "" : String(Math.min(13, Math.max(1, n || 1))));
                }}
              />
              <select
                className={FIELD_CLASS}
                value={assignee}
                disabled={!editable}
                aria-label={t("fields.assignee")}
                onChange={(e) => set("assigned_to", e.target.value)}
              >
                <option value="">{t("fields.unassigned")}</option>
                {options.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {sprints.length > 0 && (
                <select
                  className={FIELD_CLASS}
                  value={String(value(task, "sprint_suggestion_id", base.sprint_suggestion_id))}
                  disabled={!editable}
                  aria-label={t("fields.sprint")}
                  onChange={(e) => set("sprint_suggestion_id", e.target.value)}
                >
                  {!base.sprint_suggestion_id && <option value="">{t("unscheduled")}</option>}
                  {sprints.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>
                      {str(s, ["title", "name"], `#${s.id}`)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {openId === id && (
              <textarea
                className={cn(FIELD_CLASS, "ms-7 h-auto min-h-[80px] w-auto py-2")}
                value={String(value(task, "description", base.description))}
                disabled={!editable}
                maxLength={5000}
                placeholder={t("fields.description")}
                aria-label={t("fields.description")}
                onChange={(e) => set("description", e.target.value)}
              />
            )}

          </li>
        );
      })}
    </ul>
  );
}

function IncludeToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      className="mt-0.5 size-4 shrink-0 cursor-pointer accent-[var(--color-btn-brand)] disabled:cursor-default"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      title={label}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}
