"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";

export function ViewEmployeeModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any | null }) {
  const t = useTranslations("employee");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  if (!data) return null;

  const empName = data.employee_name || data.employeeName || data.name || data.user?.name || (data.user?.first_name ? `${data.user.first_name} ${data.user.last_name || ''}` : null) || '-';
  const jobTitle = data.job_title || data.jobTitle || data.job || '-';
  const companyName = typeof data.company === 'object' ? data.company?.name : data.company || '-';
  const paymentType = data.paymentType || data.payment_type || '-';
  const salary = data.salary || data.hourly_rate || data.hourlyRate || '-';
  const currencyCode = typeof data.currency === 'object' ? (data.currency?.name || data.currency?.code) : data.currency || '';

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewEmployeeTitle")}
      avatarName={empName}
      headerTitle={empName}
      headerSubtitle={jobTitle}
    >
      <InfoRow label={t("labels.jobTitle")}>
        <Text size="sm" tag="span">{jobTitle}</Text>
      </InfoRow>
      
      {isSuperAdmin && (
        <InfoRow label={t("labels.company")}>
          <Text size="sm" tag="span">{companyName}</Text>
        </InfoRow>
      )}

      <InfoRow label={t("labels.paymentType")}>
        <Text size="sm" tag="span">{paymentType}</Text>
      </InfoRow>

      <InfoRow label={t("labels.salary")}>
        <Text size="sm" tag="span">{salary} {currencyCode}</Text>
      </InfoRow>

      <InfoRow label={t("labels.status")}>
        <span className="capitalize bg-gray-100 dark:bg-gray-800 text-[var(--color-primary)] px-3 py-1 rounded-full text-sm font-medium">
          {data.status || 'Active'}
        </span>
      </InfoRow>
    </ViewDetailsLayout>
  );
}

