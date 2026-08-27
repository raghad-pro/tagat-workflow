"use client";

import { useTranslations } from "next-intl";
import React from "react";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import type { Invoice } from "../types/invoices.types";
import { INVOICE_STATUS_TO_GENERIC, INVOICE_STATUS_LABEL } from "../types/invoices.types";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { useInvoice } from "../hooks/useInvoices";

export function ViewInvoiceModal({ isOpen, onClose, invoiceId }: { isOpen: boolean; onClose: () => void; invoiceId: string | number | null }) {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const isClient = user?.role === "client";

  const t = useTranslations("invoice");
  const tc = useTranslations("common");

  const { data: invoiceData, isLoading } = useInvoice(invoiceId);
  const data: any = (invoiceData as any)?.data || invoiceData || null;

  if (!isOpen) return null;

  const getClientName = () => {
    if (typeof data.client === "object" && data.client?.name) return data.client.name;
    return data.client || "—";
  };

  const getCompanyName = () => {
    if (typeof data.company === "object" && data.company?.name) return data.company.name;
    return data.company || "—";
  };

  const getProjectTitle = () => {
    if (typeof data.project === "object" && data.project?.title) return data.project.title;
    return "—";
  };

  const getCurrencySymbol = () => {
    if (typeof data.currency === "object" && data.currency?.symbol) return data.currency.symbol;
    return "$";
  };

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewTitle")}
      headerIcon={<FileText size={24} />}
      headerTitle={data ? t("headerTitle", { id: data.id }) : tc("loading")}
      headerSubtitle={data ? getClientName() : ""}
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : data ? (
        <>
          {!isCompanyAdmin && !isClient && (
        <InfoRow label={t("columns.company")}>
          <Text size="sm" tag="span">
            {getCompanyName()}
          </Text>
        </InfoRow>
      )}

      <InfoRow label={t("columns.client")}>
        <Text size="sm" tag="span">
          {getClientName()}
        </Text>
      </InfoRow>

      <InfoRow label={t("project")}>
        <Text size="sm" tag="span">
          {getProjectTitle()}
        </Text>
      </InfoRow>

      <InfoRow label={t("columns.amount")}>
        <Text size="sm" tag="span">
          {getCurrencySymbol()}{Number(data.amount).toLocaleString('en-US')}
        </Text>
      </InfoRow>

      <InfoRow label={t("columns.issueDate")}>
        <Text size="sm" tag="span">
          {data.invoice_date}
        </Text>
      </InfoRow>

      <InfoRow label={t("columns.dueDate")}>
        <Text size="sm" tag="span">
          {data.due_date}
        </Text>
      </InfoRow>

      <InfoRow label={t("columns.status")}>
        {data.status ? (
          <StatusBadge
            status={INVOICE_STATUS_TO_GENERIC[data.status] ?? "pending"}
            label={INVOICE_STATUS_LABEL[data.status] ?? data.status}
          />
        ) : (
          <span className="ds-text-main">-</span>
        )}
      </InfoRow>
      
      {data.created_at && (
        <InfoRow label={tc("createdAt")}>
          <Text size="sm" tag="span">
            {new Date(data.created_at).toLocaleDateString()}
          </Text>
        </InfoRow>
      )}
      
      {data.payments && Array.isArray(data.payments) && data.payments.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <Text size="sm" weight="medium" className="ds-text-primary">{t("payments")}</Text>
          <div className="border rounded-xl divide-y overflow-hidden">
            {data.payments.map((payment: any, index: number) => (
              <div key={index} className="p-3 flex justify-between items-center bg-[var(--color-bg)]">
                <div className="flex flex-col">
                  <Text size="sm" weight="medium">{payment.date || '—'}</Text>
                  <Text size="sm" className="text-gray-500">{payment.payment_method || '—'}</Text>
                </div>
                <Text size="sm" weight="medium" className="text-green-600">
                  {getCurrencySymbol()}{Number(payment.amount).toLocaleString('en-US')}
                </Text>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      ) : (
        <div className="p-8 text-center text-gray-500">{t("notFound")}</div>
      )}
    </ViewDetailsLayout>
  );
}
