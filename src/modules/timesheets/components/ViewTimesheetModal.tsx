"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

export function ViewTimesheetModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any | null }) {
  const t = useTranslations("timesheets");
  const tCommon = useTranslations("common");

  if (!data) return null;

  const empName = data.user?.name || '-';
  const compName = data.user?.company?.name || '-';
  const currency = data.user?.employee?.currency?.symbol || '';
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHours = (mins: any) => {
    const num = Number(mins);
    if (isNaN(num)) return '-';
    return `${Math.floor(num / 60)}h ${Math.round(num % 60)}m`;
  };

  const emp = data.user?.employee;
  const isMonthly = emp?.payment_type === "monthly" || emp?.paymentType === "monthly";
  const rateVal = isMonthly ? (emp?.salary ?? emp?.hourly_rate ?? emp?.hourlyRate) : data.rate;
  const totalVal = isMonthly ? (emp?.salary ?? emp?.hourly_rate ?? emp?.hourlyRate) : data.total;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={tCommon("view") || "View Time Log"}
      headerIcon={<Clock size={24} />}
      headerTitle={empName || '-'}
      headerSubtitle={<StatusBadge status={data.status} />}
    >
      <InfoRow label={t("columns.company") || "Company"}>
        <Text size="sm" tag="span">{compName || '-'}</Text>
      </InfoRow>

      <InfoRow label={t("columns.date") || "Date"}>
        <Text size="sm" tag="span">{data.date || data.created_at?.split('T')[0] || '-'}</Text>
      </InfoRow>

      <InfoRow label={t("columns.hours") || "Hours"}>
        <Text size="sm" tag="span">{formatHours(data.hours)}</Text>
      </InfoRow>

      <InfoRow label={t("columns.rate") || "Rate"}>
        <Text size="sm" tag="span">{rateVal || '-'} {currency}</Text>
      </InfoRow>

      <InfoRow label={t("columns.rateTotal") || "Total"}>
        <Text size="sm" tag="span">{totalVal || '-'} {currency}</Text>
      </InfoRow>

      <InfoRow label="Created At">
        <Text size="sm" tag="span">{formatDate(data.created_at)}</Text>
      </InfoRow>

      <InfoRow label="Updated At">
        <Text size="sm" tag="span">{formatDate(data.updated_at)}</Text>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
