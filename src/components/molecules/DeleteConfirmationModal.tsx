"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      mode="edit"
      size="sm"
      onSubmit={onConfirm}
      isLoading={isLoading}
      saveLabel="Ok"
    >
      {message && (
        <Text size="sm" color="gray-400" tag="p" className="mb-4">
          {message}
        </Text>
      )}
    </ActionModal>
  );
}
