"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { useTranslations } from "next-intl";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Wallet } from "../types/wallets.types";
import { StatusBadge } from "@/components/atoms/Statusbadge";

export function ViewWalletModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Wallet | null }) {
  const t = useTranslations("wallets");

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("title") || "Wallet Details"}
      avatarName={data.name}
      headerTitle={data.name}
      headerSubtitle={data.company?.name || ""}
    >
      <InfoRow label={t("form.currency") || "Currency"}>
        <span className="bg-[#0ea5e9] text-white px-3 py-1 rounded-full text-sm font-medium">
          {data.currency?.code || ""}
        </span>
      </InfoRow>

      <InfoRow label={t("columns.balance") || "Balance"}>
        <Text size="sm" tag="span" className="font-bold">{Number(data.balance).toLocaleString()} {data.currency?.symbol || ""}</Text>
      </InfoRow>

      <InfoRow label={t("columns.lastTransaction") || "Last Transaction"}>
        <Text size="sm" tag="span">{new Date(data.updated_at).toLocaleDateString()}</Text>
      </InfoRow>

      {data.notes && (
        <InfoRow label={t("form.notes") || "Notes"}>
          <Text size="sm" tag="span">{data.notes}</Text>
        </InfoRow>
      )}
    </ViewDetailsLayout>
  );
}
