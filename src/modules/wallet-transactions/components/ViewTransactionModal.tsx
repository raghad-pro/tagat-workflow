"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { Text } from "@/components/atoms/Text";
import { WalletTransaction } from "../types/wallet-transactions.types";
import { Activity } from "lucide-react";

export function ViewTransactionModal({ 
  isOpen, 
  onClose,
  data
}: { 
  isOpen: boolean; 
  onClose: () => void;
  data: WalletTransaction | null;
}) {
  const t = useTranslations("walletTransactions");

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewTransaction") || "Transaction Details"}
      avatarName={data.transaction_number}
      headerTitle={data.transaction_number}
      headerSubtitle={data.company?.name || `Company ID: ${data.company_id}`}
    >
      <InfoRow label={t("table.date") || "Date"}>
        <Text size="sm" tag="span">{new Date(data.transaction_date).toLocaleString()}</Text>
      </InfoRow>

      <InfoRow label={t("table.type") || "Type"}>
        <Text size="sm" tag="span" className="font-medium text-gray-700 dark:text-gray-300 capitalize">
          {data.type}
        </Text>
      </InfoRow>

      <InfoRow label={t("table.wallet") || "Wallet"}>
        <Text size="sm" tag="span" className="text-gray-600 dark:text-gray-400">
          {data.wallet?.name || "-"}
        </Text>
      </InfoRow>

      <InfoRow label={t("table.amount") || "Amount"}>
        <Text 
          size="sm" 
          tag="span" 
          className={parseFloat(data.amount) > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}
        >
          {parseFloat(data.amount) > 0 ? "+" : ""}${Math.abs(parseFloat(data.amount)).toFixed(2)}
        </Text>
      </InfoRow>

      <InfoRow label={t("notes") || "Notes"}>
        <Text size="sm" tag="span" className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
          {data.notes || "-"}
        </Text>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
