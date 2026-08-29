"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS, type WizardStep } from "../../types/data-import.types";

interface WizardStepperProps {
  /** The step on screen. */
  current: WizardStep;
  /** The furthest step the session has reached — everything up to it is open. */
  reached: WizardStep;
  onSelect: (step: WizardStep) => void;
}

/**
 * The six steps as one track.
 *
 * A step behind the session's progress can be revisited — going back to fix a
 * mapping is normal — but nothing ahead of it is reachable, since each step
 * feeds the next one.
 */
export function WizardStepper({ current, reached, onSelect }: WizardStepperProps) {
  const t = useTranslations("dataImport");
  const reachedIndex = WIZARD_STEPS.indexOf(reached);
  const currentIndex = WIZARD_STEPS.indexOf(current);

  return (
    <div
      className={cn(
        // Sized to its six pills rather than the page, the way the design has
        // it — it only stretches when the viewport is narrower than the track.
        "mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5",
        "bg-slate-50 dark:bg-white/[0.04]",
        "no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      )}
    >
      {WIZARD_STEPS.map((step, index) => {
        const isCurrent = index === currentIndex;
        const isOpen = index <= reachedIndex;
        const isDone = index < reachedIndex;

        return (
          <button
            key={step}
            type="button"
            disabled={!isOpen}
            onClick={() => onSelect(step)}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5",
              "text-[13px] font-bold transition-colors duration-200",
              isCurrent
                ? "bg-[var(--color-btn-brand)] text-white shadow-[0_4px_14px_-4px_var(--color-btn-brand)]"
                : isOpen
                  ? "cursor-pointer text-slate-500 hover:bg-[var(--color-btn-brand)]/10 hover:text-[var(--color-btn-brand)] dark:text-slate-400"
                  : "cursor-not-allowed text-slate-400 dark:text-slate-600"
            )}
          >
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                isCurrent
                  ? "bg-white/25 text-white"
                  : isDone
                    ? "bg-[var(--color-btn-brand)]/15 text-[var(--color-btn-brand)]"
                    : "bg-slate-200 text-slate-500 dark:bg-white/10 dark:text-slate-400"
              )}
            >
              {index + 1}
            </span>
            <span className="whitespace-nowrap">
              {t(`wizard.steps.${step}` as Parameters<typeof t>[0])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
