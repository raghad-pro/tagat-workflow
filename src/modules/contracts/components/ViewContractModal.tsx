"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import type { Contract } from "../types/contracts.types";

export function ViewContractModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Contract | null }) {
  if (!data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      mode="view"
      size="md"
    >
      <div className="flex flex-col w-full px-2">
        <div className="ds-bg-form rounded-2xl p-6 shadow-sm border ds-border-form">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-primary-200)] flex items-center justify-center text-[var(--color-primary)] font-bold text-xl">
              {data.customerName.charAt(0).toUpperCase()}
            </div>
            <div>
              <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
                {data.customerName}
              </Text>
              <Text size="sm" className="ds-text-gray-200">
                {data.title}
              </Text>
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">{data.company}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Project:</span> 
              <span className="ds-text-main">{data.project}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Initial Value:</span> 
              <span className="ds-text-main">{data.initial}</span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
