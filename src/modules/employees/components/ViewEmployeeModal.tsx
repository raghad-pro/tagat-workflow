"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import type { Employee } from "../types/employees.types";

export function ViewEmployeeModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Employee | null }) {
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
            <ClientAvatar 
              name={data.name} 
            />
            <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
              {data.name}
            </Text>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Job Title:</span> 
              <span className="ds-text-main">{data.job}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Company:</span> 
              <span className="ds-text-main">{data.company}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Payment Type:</span> 
              <span className="ds-text-main">{data.paymentType}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">Salary/Rate:</span> 
              <span className="ds-text-main">{data.salary} {data.currency}</span>
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

