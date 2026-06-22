"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";

export function ViewTimeLogModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any | null }) {
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
              {data.employee.charAt(0).toUpperCase()}
            </div>
            <div>
              <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
                {data.employee}
              </Text>
              <StatusBadge status={data.status} />
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">{data.company}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Date:</span> 
              <span className="ds-text-main">{data.date}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Hours:</span> 
              <span className="ds-text-main">{data.hours}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Rate/Hr:</span> 
              <span className="ds-text-main">{data.rateHr}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Total Rate:</span> 
              <span className="ds-text-main">{data.rateTotal}</span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
