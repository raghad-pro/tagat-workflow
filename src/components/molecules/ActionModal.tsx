"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  mode: "add" | "edit" | "view" | "delete";
  children: React.ReactNode;
  formId?: string;
  onSubmit?: () => void;
  isLoading?: boolean;
  saveLabel?: string;
  cancelLabel?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function ActionModal({
  isOpen,
  onClose,
  title,
  mode,
  children,
  formId,
  onSubmit,
  isLoading = false,
  saveLabel,
  cancelLabel,
  size = "md",
}: ActionModalProps) {
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const isView = mode === "view";
  const primaryActionLabel = saveLabel || (mode === "delete" ? t("delete") : mode === "edit" ? t("update") : t("save"));
  const secondaryActionLabel = cancelLabel || (isView ? t("close") : t("cancel"));
  const primaryActionIcon = mode === "delete" ? <Trash2 size={15} /> : <Send size={15} />;
  const primaryActionVariant = mode === "delete" ? "danger" : "solid"; // assuming "danger" variant exists, otherwise I should use "solid" and override styles or check Button variants.

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full flex flex-col max-h-[90vh] rounded-2xl shadow-2xl",
          "ds-bg-form animate-in fade-in zoom-in-95 duration-200",
          sizeMap[size]
        )}
      >
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--color-border-form)" }}>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("back") || "Back"}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-bg)] ds-text-primary"
          >
            <ArrowLeft size={18} />
          </button>
          <Text size="lg" weight="bold" tag="h2" className="ds-text-primary">
            {title}
          </Text>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          {children}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderTop: "1px solid var(--color-border-form)" }}>
          {!isView && (
            <Button
              type={formId ? "submit" : "button"}
              {...(formId ? { form: formId } : {})}
              variant="solid"
              size="md"
              loading={isLoading}
              onClick={!formId ? onSubmit : undefined}
              licon={!isLoading ? primaryActionIcon : undefined}
              className="px-8"
            >
              {primaryActionLabel}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onClose}
            className="px-8"
          >
            {secondaryActionLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
