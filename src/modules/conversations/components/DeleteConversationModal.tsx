"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Conversation } from "../types/conversations.types";
import { getConversationTitle } from "../utils/conversation.helpers";

interface DeleteConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  conversation: Conversation | null;
  currentUserId?: number | string;
}

export default function DeleteConversationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  conversation,
  currentUserId,
}: DeleteConversationModalProps) {
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("conversations");

  useEffect(() => setMounted(true), []);

  if (!mounted || !isOpen || !conversation) return null;

  const title = getConversationTitle(conversation, currentUserId);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-conversation-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-[440px] rounded-[16px] p-6 shadow-2xl transition-all"
        style={{
          backgroundColor: "var(--color-bg-form)",
          border: "1px solid var(--color-border-form)",
        }}
      >
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FEECEB] text-[#F44336]">
            <Trash2 size={24} />
          </div>
          <div>
            <h3
              id="delete-conversation-modal-title"
              className="text-[17px] font-bold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {t("confirmDeleteTitle")}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[280px]">
              {title}
            </p>
          </div>
        </div>

        {/* Warning Description */}
        <p
          className="text-[13px] leading-relaxed mb-6"
          style={{ color: "var(--color-text-gray)" }}
        >
          {t("confirmDeleteHint")}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="rounded-[8px] h-10 px-4 text-xs font-semibold"
          >
            {t("create.cancel")}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-[8px] h-10 px-5 text-xs font-bold bg-[#F44336] text-white hover:bg-[#D32F2F] active:bg-[#B71C1C] transition-all shadow-sm"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t("loading")}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Trash2 size={14} />
                <span>{t("deleteConversation")}</span>
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
