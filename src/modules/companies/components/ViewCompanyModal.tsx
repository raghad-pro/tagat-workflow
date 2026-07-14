"use client";

import React from "react";
import { Text } from "@/components/atoms/Text";
import { useTranslations } from "next-intl";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Company } from "@/modules/companies/types/companies.types";

export function ViewCompanyModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Company | null }) {
  const t = useTranslations("company");
  const tCommon = useTranslations("common");

  if (!data) return null;

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewCompanyTitle") || "View Company"}
      avatarName={data.name}
      avatarSrc={data.logo || undefined}
      headerTitle={data.name}
      headerSubtitle={data.email}
    >
      <InfoRow label={t("columns.email") || "Email"}>
        <Text size="sm" tag="span">{data.email}</Text>
      </InfoRow>

      <InfoRow label={t("columns.domain") || "Domain"}>
        <span className="bg-[#0ea5e9] text-white px-3 py-1 rounded-full text-sm font-medium">
          {data.domain}
        </span>
      </InfoRow>

      <InfoRow label={t("labels.companyLogo") || "Logo"}>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden border ds-border-form text-xl font-bold bg-[var(--color-bg-primary-200)] text-[var(--color-primary)]">
          {data.logo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.logo} alt={`${data.name} logo`} className="w-full h-full object-cover" />
            </>
          ) : (
            data.name.slice(0, 1).toUpperCase()
          )}
        </div>
      </InfoRow>
    </ViewDetailsLayout>
  );
}
