"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import type { Project } from "../types/projects.types";

export function ViewProjectModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Project | null }) {
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
                {typeof data.client === 'object' ? (data.client as any)?.name : data.client}
              </Text>
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">{typeof data.company === 'object' ? (data.company as any)?.name : data.company}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Budget:</span> 
              <span className="ds-text-main">{data.budget}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Employees:</span> 
              <span className="ds-text-main">{data.employees}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Status:</span> 
              <span className="capitalize bg-gray-100 dark:bg-gray-800 text-[var(--color-primary)] px-3 py-1 rounded-full text-sm font-medium">
                {data.status}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
