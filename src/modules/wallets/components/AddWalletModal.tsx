"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { AddWalletRequest } from "../types/wallets.types";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useCompanyCurrencies } from "../hooks/useWallets";

const walletSchema = z.object({
  name: z.string().min(2, "Wallet name is required"),
  company_id: z.coerce.number().min(1, "Company is required"),
  currency_id: z.coerce.number().min(1, "Currency is required"),
  balance: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  notes: z.string().optional(),
});

export type WalletFormValues = z.input<typeof walletSchema>;

export function AddWalletModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (data: AddWalletRequest) => Promise<void>; 
  isLoading?: boolean;
}) {
  const t = useTranslations("wallets");

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    mode: "onTouched",
    defaultValues: { name: "", company_id: 0, currency_id: 0, balance: 0, notes: "" },
  });

  const selectedCompanyId = form.watch("company_id");

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const { data: companyCurrenciesData } = useCompanyCurrencies(selectedCompanyId ? Number(selectedCompanyId) : null);

  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const currencyOptions = useMemo(() => {
    const list = companyCurrenciesData?.data || [];
    return list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: String(c.id) }));
  }, [companyCurrenciesData]);

  // Reset currency when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      form.setValue("currency_id", 0);
    }
  }, [selectedCompanyId, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: WalletFormValues) => {
    await onSave({
      ...data,
      balance: Number(data.balance)
    } as AddWalletRequest);
  };

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("add") || "Add Wallet"} 
      mode="add"
      formId="add-wallet-form"
      saveLabel={t("add") || "Save"}
      isLoading={isLoading}
    >
      <Form {...form}>
        <form id="add-wallet-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TextField 
            control={form.control}
            name="name"
            label={t("form.name")}
            placeholder="Main Wallet"
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              control={form.control}
              name="company_id"
              label={t("form.company")}
              options={companyOptions}
            />
            <SelectField 
              control={form.control}
              name="currency_id"
              label={t("form.currency")}
              options={currencyOptions}
              disabled={!selectedCompanyId || currencyOptions.length === 0}
            />
          </div>
          <div className="grid grid-cols-1 gap-4">
            <TextField 
              control={form.control}
              name="balance"
              label={t("columns.balance") || "Balance"}
              placeholder="0.00"
              type="number"
            />
          </div>
          <TextField 
            control={form.control}
            name="notes"
            label={t("form.notes")}
            placeholder="Optional notes..."
          />
        </form>
      </Form>
    </ActionModal>
  );
}
