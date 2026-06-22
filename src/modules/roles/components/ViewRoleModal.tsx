"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import type { Role } from "../types/roles.types";

export function ViewRoleModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Role | null }) {
  if (!data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      mode="view"
      size="sm"
    >
      <div className="flex flex-col w-full px-2">
        <div className="ds-bg-form rounded-2xl p-6 shadow-sm border ds-border-form">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-primary-200)] flex items-center justify-center text-[var(--color-primary)] font-bold text-xl">
              {data.name.charAt(0)}
            </div>
            <div>
              <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
                {data.name}
              </Text>
              <span className={"px-2 py-0.5 rounded text-xs mt-1 inline-block " + (data.type === 'system' ? 'bg-primary/10 text-primary' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400')}>
                {data.type}
              </span>
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Description:</span> 
              <span className="ds-text-main">{data.description}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Users Count:</span> 
              <span className="ds-text-main">{data.usersCount}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Created At:</span> 
              <span className="ds-text-main">{data.createdAt}</span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
