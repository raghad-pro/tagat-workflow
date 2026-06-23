"use client";

import React from "react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { useTranslations } from "next-intl";
import type { Company } from "@/modules/companies/types/companies.types";

export function ViewCompanyModal({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: Company | null }) {
  const t = useTranslations("company");
  const tCommon = useTranslations("common");

  if (!data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("viewCompanyTitle") || "View Company"}
      mode="view"
      size="md"
    >
      <div className="flex flex-col w-full px-2">
        <div className="ds-bg-form rounded-2xl p-6 shadow-sm border ds-border-form">
          <Text size="xl" weight="bold" tag="h3" className="ds-text-primary mb-6">
            {data.name}
          </Text>

          <ul className="space-y-4 list-disc list-inside ds-text-sub">
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("columns.email") || "Email"}:</span> 
              <span className="ds-text-main">{data.email}</span>
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2 text-[var(--color-primary)]">{t("columns.domain") || "Domain"}:</span> 
              <span className="bg-[#0ea5e9] text-white px-3 py-1 rounded-full text-sm font-medium">
                {data.domain}
              </span>
            </li>
          </ul>

          <div className="mt-8">
            <Text size="lg" weight="bold" tag="h4" className="ds-text-primary mb-3">
              {t("labels.companyLogo") || "Logo"}:
            </Text>
            <div className="w-24 h-24 rounded-2xl bg-gray-100 dark:bg-gray-800 border ds-border-form">
              {/* Logo image would go here */}
            </div>
          </div>
        </div>
      </div>
    </ActionModal>
  );
}
