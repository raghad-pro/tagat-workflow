"use client";

import React, { useEffect } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the user clicks Cancel, the backdrop, or presses Escape */
  onClose: () => void;
  /** Modal heading — shown next to the ← back arrow */
  title: string;
  /** Any JSX content: inputs, selects, textareas, grids … */
  children: React.ReactNode;

  /**
   * Pass the `id` of a <form> inside children to wire the Save button
   * as a submit trigger (type="submit" form={formId}).
   * If omitted, the Save button calls `onSave` directly.
   */
  formId?: string;
  /** Called when Save is clicked and no formId is given */
  onSave?: () => void;
  /** Shows a spinner inside Save while true */
  isSaving?: boolean;

  /** Override the Save button label (falls back to common.save translation) */
  saveLabel?: string;
  /** Override the Cancel button label (falls back to common.cancel translation) */
  cancelLabel?: string;

  /** Width preset — defaults to "md" */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AddModal({
  isOpen,
  onClose,
  title,
  children,
  formId,
  onSave,
  isSaving = false,
  saveLabel,
  cancelLabel,
  size = "md",
}: AddModalProps) {
  const t = useTranslations("common");

  /* ── Escape key + body scroll lock ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "unset";
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* ── Backdrop ── */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Panel ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-modal-title"
        className={cn(
          "relative w-full flex flex-col max-h-[90vh] rounded-2xl shadow-2xl",
          "ds-bg-form animate-in fade-in zoom-in-95 duration-200",
          sizeMap[size]
        )}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border-form)" }}
        >
          {/* Back / close arrow */}
          <button
            type="button"
            onClick={onClose}
            aria-label={cancelLabel ?? t("cancel")}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg",
              "transition-colors hover:bg-[var(--color-bg)] ds-text-primary"
            )}
          >
            <ArrowLeft size={18} />
          </button>

          <Text
            id="add-modal-title"
            size="lg"
            weight="bold"
            tag="h2"
            className="ds-text-primary"
          >
            {title}
          </Text>
        </div>

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center gap-3 px-6 py-4 shrink-0"
          style={{ borderTop: "1px solid var(--color-border-form)" }}
        >
          {/* Save — if formId given, acts as submit for that form */}
          <Button
            type={formId ? "submit" : "button"}
            {...(formId ? { form: formId } : {})}
            variant="solid"
            size="md"
            loading={isSaving}
            onClick={!formId ? onSave : undefined}
            licon={!isSaving ? <Send size={15} /> : undefined}
          >
            {saveLabel ?? t("save")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
          >
            {cancelLabel ?? t("cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
