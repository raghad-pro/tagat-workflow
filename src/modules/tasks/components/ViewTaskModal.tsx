"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Task } from "../types/tasks.types";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";

export function ViewTaskModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Task | null }) {
  const t = useTranslations("task");
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";
  
  if (!data) return null;

  // --- Resolution Helpers ---
  const projectObj = typeof data.project === 'object' ? data.project : (data as any).project_details;
  const projectName = projectObj?.title || projectObj?.name || (typeof data.project === 'string' ? data.project : "-");

  const companyObj = typeof data.company === 'object' ? data.company : projectObj?.company;
  const companyName = companyObj?.name || (typeof data.company === 'string' ? data.company : "-");

  const employeeObj = typeof data.employee === 'object' ? data.employee : 
                      typeof (data as any).assignedTo === 'object' ? (data as any).assignedTo :
                      typeof (data as any).assigned_to === 'object' ? (data as any).assigned_to : 
                      typeof (data as any).user === 'object' ? (data as any).user : null;
  const employeeName = employeeObj?.name || employeeObj?.user?.name || 
                       (typeof data.employee === 'string' ? data.employee : 
                       (typeof (data as any).assigned_to === 'string' ? (data as any).assigned_to : "-"));

  // --- Financial Calculations ---
  const paymentType = employeeObj?.payment_type || employeeObj?.paymentType;
  const isHourly = paymentType === "hourly" || paymentType === "part_time" || paymentType === "Hourly";
  const hourlyRate = parseFloat(employeeObj?.hourly_rate || employeeObj?.hourlyRate || "0");
  const salary = parseFloat(employeeObj?.salary || "0");

  const getHoursFromDuration = (dur: any): number => {
    if (!dur) return 0;
    if (typeof dur === 'number') return dur;
    const str = String(dur).toLowerCase();
    if (str.includes('h')) {
      const hMatch = str.match(/(\d+)\s*h/);
      const mMatch = str.match(/(\d+)\s*m/);
      const h = hMatch ? parseInt(hMatch[1], 10) : 0;
      const m = mMatch ? parseInt(mMatch[1], 10) : 0;
      return h + (m / 60);
    } else if (str.includes(':')) {
      const [h, m] = str.split(':');
      return parseInt(h, 10) + (parseInt(m, 10) / 60);
    }
    return parseFloat(str) || 0;
  };

  const hours = getHoursFromDuration(data.duration);
  
  let totalCostDisplay = "-";

  if (isHourly) {
    totalCostDisplay = `${(hours * hourlyRate).toFixed(2)} $ (Hourly Rate: ${hourlyRate.toFixed(2)} $)`;
  } else if (paymentType === "monthly" || paymentType === "Monthly") {
    totalCostDisplay = `${salary.toFixed(2)} $ (Monthly Salary)`;
  } else {
    totalCostDisplay = data.budget ? `${data.budget} $` : "-";
  }

  // Formatting date/time for display
  const startDate = ((data as any).task_date || (data as any).taskDate || "-");
  const startTime = data.start_time || data.start || "-";
  const endTime = data.end_time || data.end || "-";

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewTaskTitle")}
      avatarName={data.title}
      headerTitle={data.title || "Task"}
      headerSubtitle={projectName}
    >
      <InfoRow label={t("labels.project")}>
        <Text size="sm" tag="span">{projectName}</Text>
      </InfoRow>

      <InfoRow label={t("labels.company")}>
        <Text size="sm" tag="span">{companyName}</Text>
      </InfoRow>

      {!isEmployee && (
        <InfoRow label={t("labels.employee")}>
          <Text size="sm" tag="span">{employeeName}</Text>
        </InfoRow>
      )}

      <InfoRow label={t("labels.status")}>
        {(data as any).status ? (
          <StatusBadge 
            status={(data as any).status as any} 
            label={t(`statusOptions.${(data as any).status}`) !== `statusOptions.${(data as any).status}` ? t(`statusOptions.${(data as any).status}`) : undefined}
          />
        ) : (
          <span className="ds-text-main">-</span>
        )}
      </InfoRow>

      <InfoRow label={t("labels.date")}>
        <Text size="sm" tag="span">{startDate}</Text>
      </InfoRow>

      <InfoRow label={t("labels.start")}>
        <Text size="sm" tag="span">{startTime}</Text>
      </InfoRow>

      <InfoRow label={t("labels.end")}>
        <Text size="sm" tag="span">{endTime}</Text>
      </InfoRow>

      <InfoRow label={t("labels.duration")}>
        <Text size="sm" tag="span">{data.duration || "-"}</Text>
      </InfoRow>

      <InfoRow label={t("labels.financial")}>
        <Text size="sm" tag="span">{totalCostDisplay}</Text>
      </InfoRow>

      <InfoRow label={t("labels.createdAt")}>
        <Text size="sm" tag="span">{((data as any).created_at || (data as any).createdAt || "-").replace('T', ' ').substring(0, 19)}</Text>
      </InfoRow>

      {((data as any).description || (data as any).notes) && (
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t ds-border-form">
          <Text size="sm" color="gray-200" tag="span" className="font-bold text-[var(--color-primary)]">
            {t("labels.description")}
          </Text>
          <div className="ds-text-main p-3 rounded-lg bg-[var(--color-bg-primary-200)] w-full text-sm">
            {(data as any).description || (data as any).notes}
          </div>
        </div>
      )}
    </ViewDetailsLayout>
  );
}
