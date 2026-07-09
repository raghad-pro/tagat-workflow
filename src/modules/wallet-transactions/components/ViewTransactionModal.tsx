"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { Text } from "@/components/atoms/Text";
import { Activity } from "lucide-react";
import { useWalletTransaction } from "../hooks/useWalletTransactions";

export function ViewTransactionModal({ 
  isOpen, 
  onClose,
  transactionId
}: { 
  isOpen: boolean; 
  onClose: () => void;
  transactionId: number | null;
}) {
  const t = useTranslations("walletTransactions");
  const { data: res, isLoading } = useWalletTransaction(transactionId);
  const data = res?.data;

  if (!isOpen) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewTransaction") || "Transaction Details"}
      avatarName={`#${data?.id || ""}`}
      headerTitle={`Transaction #${data?.id || "..."}`}
      headerSubtitle={data?.wallet?.company?.name || "-"}
    >
      {isLoading && <div className="p-4 animate-pulse">Loading...</div>}
      
      {!isLoading && data && (
        <>
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

          {data.wallet?.balance && (
            <InfoRow label={t("walletBalance") || "Wallet Balance"}>
              <Text size="sm" tag="span" className="text-brand font-medium">
                {data.wallet.currency?.symbol || "$"}{data.wallet.balance}
              </Text>
            </InfoRow>
          )}

          <InfoRow label={t("table.amount") || "Amount"}>
            <Text 
              size="sm" 
              tag="span" 
              className={parseFloat(data.amount) > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}
            >
              {parseFloat(data.amount) > 0 ? "+" : ""}{data.wallet?.currency?.symbol || "$"}{Math.abs(parseFloat(data.amount)).toFixed(2)}
            </Text>
          </InfoRow>

          <InfoRow label={t("notes") || "Notes"}>
            <Text size="sm" tag="span" className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {data.description || "-"}
            </Text>
          </InfoRow>
        </>
      )}
    </ViewDetailsLayout>
  );
}
