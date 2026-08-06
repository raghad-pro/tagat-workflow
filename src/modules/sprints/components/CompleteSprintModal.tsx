"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, Inbox } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import {
  boardStatusOf,
  isSprintCompleted,
  type CompleteSprintMoveTo,
  type CompleteSprintPayload,
  type Sprint,
} from "../types/sprints.types";

interface CompleteSprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: Sprint | null;
  /** Candidate destinations — every other sprint of the project that is not closed. */
  otherSprints: Sprint[];
  onConfirm: (payload: CompleteSprintPayload) => void;
  isLoading?: boolean;
}

export default function CompleteSprintModal({
  isOpen,
  onClose,
  sprint,
  otherSprints,
  onConfirm,
  isLoading,
}: CompleteSprintModalProps) {
  const t = useTranslations("sprint");
  const [moveTo, setMoveTo] = useState<CompleteSprintMoveTo>("backlog");
  const [nextSprintId, setNextSprintId] = useState<string>("");

  const openSprints = otherSprints.filter((s) => !isSprintCompleted(s));

  useEffect(() => {
    if (!isOpen) return;
    setMoveTo("backlog");
    setNextSprintId(openSprints[0] ? String(openSprints[0].id) : "");
    // Keyed on the opening and the sprint being closed — deliberately not on
    // `openSprints`, which is rebuilt on every render and would keep resetting
    // the user's choice while the dialog is open.
  }, [isOpen, sprint?.id]);

  if (!isOpen || !sprint) return null;

  const tasks = sprint.tasks ?? [];
  const unfinished = tasks.filter((task) => boardStatusOf(task) !== "completed");
  const canUseNextSprint = openSprints.length > 0;

  const handleConfirm = () => {
    if (moveTo === "next_sprint") {
      if (!nextSprintId) return;
      onConfirm({ move_to: "next_sprint", next_sprint_id: Number(nextSprintId) });
      return;
    }
    onConfirm({ move_to: "backlog" });
  };

  const options: {
    value: CompleteSprintMoveTo;
    icon: typeof Inbox;
    disabled: boolean;
    hint: string;
  }[] = [
    {
      value: "backlog",
      icon: Inbox,
      disabled: false,
      hint: t("complete.toBacklogHint"),
    },
    {
      value: "next_sprint",
      icon: ArrowRight,
      disabled: !canUseNextSprint,
      hint: canUseNextSprint ? t("complete.toSprintHint") : t("complete.noOtherSprint"),
    },
  ];

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("complete.title", { name: sprint.name })}
      mode="edit"
      size="md"
      isLoading={isLoading}
      saveLabel={t("complete.confirm")}
      onSubmit={handleConfirm}
    >
      <div className="flex flex-col gap-4">
        {unfinished.length > 0 ? (
          <div className="flex items-start gap-3 rounded-xl border ds-border-form p-3 bg-[var(--color-status-pending-bg)]">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-[var(--color-status-pending)]"
            />
            <Text size="sm" className="ds-text-gray">
              {t("complete.unfinished", { count: unfinished.length })}
            </Text>
          </div>
        ) : (
          <Text size="sm" className="ds-text-gray-200">
            {t("complete.allDone")}
          </Text>
        )}

        <div className="flex flex-col gap-2">
          {options.map((option) => {
            const Icon = option.icon;
            const isSelected = moveTo === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => setMoveTo(option.value)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-start transition-colors",
                  isSelected
                    ? "border-[var(--color-bg-primary)] bg-[var(--color-bg-primary-200)]/50"
                    : "ds-border-form hover:bg-[var(--color-bg)]",
                  option.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon
                  size={17}
                  className={cn(
                    "mt-0.5 shrink-0",
                    isSelected ? "text-[var(--color-text-brand)]" : "ds-text-gray-200"
                  )}
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold ds-text-primary">
                    {t(`complete.${option.value === "backlog" ? "toBacklog" : "toSprint"}`)}
                  </p>
                  <p className="text-[11px] ds-text-gray-200 mt-0.5">{option.hint}</p>
                </div>
              </button>
            );
          })}
        </div>

        {moveTo === "next_sprint" && canUseNextSprint && (
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold ds-text-primary">
              {t("complete.pickSprint")}
            </span>
            <select
              value={nextSprintId}
              onChange={(event) => setNextSprintId(event.target.value)}
              className="h-10 rounded-xl border ds-border-form ds-bg-form px-3 text-[13px] ds-text-primary outline-none"
            >
              {openSprints.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </ActionModal>
  );
}
