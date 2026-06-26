"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import type { Employee } from "../types/employees.types";
import { useTranslations } from "next-intl";

export function ViewEmployeeModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any | null }) {
  const t = useTranslations("employee");

  if (!data) return null;

  const empName = data.employee_name || data.employeeName || data.name || data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}` : null) || '-';
  const jobTitle = data.job_title || data.jobTitle || data.job || '-';
  const companyName = typeof data.company === 'object' ? data.company?.name : data.company || '-';
  const paymentType = data.paymentType || data.payment_type || '-';
  const salary = data.salary || data.hourly_rate || data.hourlyRate || '-';
  const currencyCode = typeof data.currency === 'object' ? (data.currency?.name || data.currency?.code) : data.currency || '';

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("viewEmployeeTitle")}
      mode="view"
      size="md"
    >
      <div className="flex flex-col w-full px-2">
        <div className="ds-bg-form rounded-2xl p-6 shadow-sm border ds-border-form">
          <div className="flex items-center gap-4 mb-6">
            <ClientAvatar 
              name={empName} 
            />
            <Text size="xl" weight="bold" tag="h3" className="ds-text-primary">
              {empName}
            </Text>
          </div>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("labels.jobTitle")}:</span> 
              <span className="ds-text-main">{jobTitle}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("labels.company")}:</span> 
              <span className="ds-text-main">{companyName}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("labels.paymentType")}:</span> 
              <span className="ds-text-main">{paymentType}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("labels.salary")}:</span> 
              <span className="ds-text-main">{salary} {currencyCode}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("labels.status")}:</span> 
              <span className="capitalize bg-gray-100 dark:bg-gray-800 text-[var(--color-primary)] px-3 py-1 rounded-full text-sm font-medium">
                {data.status || 'Active'}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
}

