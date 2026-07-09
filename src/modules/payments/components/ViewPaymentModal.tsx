"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { Text } from "@/components/atoms/Text";
import { Payment } from "../types/payments.types";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { DownloadCloud, User, FileText } from "lucide-react";

export function ViewPaymentModal({ 
  isOpen, 
  onClose, 
  data 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: Payment | null;
}) {
  const t = useTranslations("payments");

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("title") || "Payment Details"}
      avatarName={`#INV-${data.invoice_id}`}
      headerTitle={`#INV-${data.invoice_id}`}
      headerSubtitle={data.invoice?.company?.name || `Company ID: ${data.company_id}`}
    >
      <InfoRow label={t("columns.date") || "Date"}>
        <Text size="sm" tag="span">{data.payment_date}</Text>
      </InfoRow>

      <InfoRow label={t("columns.method") || "Method"}>
        <Text size="sm" tag="span" className="font-medium text-gray-700 dark:text-gray-300 capitalize">
          {data.payment_method}
        </Text>
      </InfoRow>

      <InfoRow label={t("columns.wallet") || "Wallet"}>
        <div className="flex items-center gap-2">
          <DownloadCloud size={14} className="text-gray-400" />
          <Text size="sm" tag="span">{data.wallet?.name || `Wallet ID: ${data.wallet_id}`}</Text>
        </div>
      </InfoRow>

      <InfoRow label="Employee">
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <Text size="sm" tag="span">{data.employee?.user?.name || `Employee ID: ${data.employee_id}`}</Text>
        </div>
      </InfoRow>
      
      <InfoRow label="Invoice Amount">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          <Text size="sm" tag="span">${data.invoice?.amount || "N/A"}</Text>
        </div>
      </InfoRow>

      <InfoRow label={t("columns.amount") || "Amount"}>
        <Text size="sm" tag="span" className="font-bold text-[#0ea5e9]">
          ${Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
      </InfoRow>

      {data.notes && (
        <InfoRow label={t("form.notes") || "Notes"}>
          <Text size="sm" tag="span">{data.notes}</Text>
        </InfoRow>
      )}
    </ViewDetailsLayout>
  );
}
