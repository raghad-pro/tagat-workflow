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
              {data.title ? data.title.charAt(0) : '?'}
            </div>
            <div>
              <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
                {data.title || "-"}
              </Text>
              <Text size="sm" className="ds-text-gray-200">
                {typeof data.project === 'object' ? (data.project?.title || data.project?.name) : data.project || "-"}
              </Text>
            </div>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">
                {typeof data.company === 'object' ? data.company?.name : 
                 (data as any).project?.company?.name || data.company || "-"}
              </span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Employee:</span> 
              <span className="ds-text-main">
                {typeof data.employee === 'object' ? (data.employee?.name || data.employee?.user?.name) : 
                 data.employee ? data.employee :
                 typeof (data as any).assignedTo === 'object' ? ((data as any).assignedTo?.name || (data as any).assignedTo?.user?.name) :
                 (data as any).assignedTo ? (data as any).assignedTo :
                 typeof (data as any).assigned_to === 'object' ? ((data as any).assigned_to?.name || (data as any).assigned_to?.user?.name) :
                 (data as any).assigned_to ? (data as any).assigned_to :
                 typeof (data as any).user === 'object' ? (data as any).user?.name :
                 (data as any).user || "-"}
              </span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Date:</span> 
              <span className="ds-text-main">
                {((data as any).task_date || (data as any).taskDate) ? `${(data as any).task_date || (data as any).taskDate} ` : ''}
                {(data.start_time || data.start || "-")} to {(data.end_time || data.end || "-")}
              </span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Duration:</span> 
              <span className="ds-text-main">{data.duration || "-"}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Status:</span> 
              <span className="ds-text-main">{(data as any).status || "-"}</span>
            </li>
            {((data as any).description || (data as any).notes) && (
              <li className="flex flex-col items-start mt-4">
                <span className="font-bold text-[var(--color-primary)] mb-1">Description:</span> 
                <span className="ds-text-main p-2 rounded-lg bg-[var(--color-bg-primary-200)] w-full">
                  {(data as any).description || (data as any).notes}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}
