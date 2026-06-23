"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { useTranslations } from "next-intl";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName?: string;
  message?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  message,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  const t = useTranslations("common");

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      mode="delete"
      size="sm"
      onSubmit={onConfirm}
      isLoading={isLoading}
      saveLabel={t("delete") || "Delete"}
      cancelLabel={t("cancel") || "Cancel"}
    >
      <div className="flex flex-col items-center justify-center text-center py-4">
        {itemName ? (
          <Text size="lg" className="ds-text-primary mt-2">
            {t("deleteConfirm1") || "Are you sure you want to delete "}
            <span className="text-[var(--color-primary)] font-bold">{itemName}</span>
            {t("deleteConfirm2") || " ?"}
          </Text>
        ) : message ? (
          <Text size="md" color="gray-400" tag="p" className="mb-4">
            {message}
          </Text>
        ) : null}
      </div>
    </ActionModal>
  );
}
