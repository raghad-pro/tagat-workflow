"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import type { Task } from "../types/tasks.types";

export function ViewTaskModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Task | null }) {
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
              {data.title.charAt(0)}
            </div>
            <div>
              <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
                {data.title}
              </Text>
              <Text size="sm" className="ds-text-gray-200">
                {data.project}
              </Text>
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">{data.company}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Employee:</span> 
              <span className="ds-text-main">{data.employee}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Date:</span> 
              <span className="ds-text-main">{data.start} to {data.end}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Duration:</span> 
              <span className="ds-text-main">{data.duration}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Budget:</span> 
              <span className="ds-text-main text-[var(--color-primary)]">{data.budget}</span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
