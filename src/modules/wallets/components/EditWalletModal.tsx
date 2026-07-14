"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { UpdateWalletRequest, Wallet } from "../types/wallets.types";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useCompanyCurrencies } from "../hooks/useWallets";
import { useAuth } from "@/providers/AuthProvider";

const walletSchema = z.object({
  name: z.string().min(2, "Wallet name is required"),
  company_id: z.coerce.number().optional(),
  currency_id: z.coerce.number().min(1, "Currency is required"),
  balance: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  notes: z.string().optional(),
});

export type WalletFormValues = z.input<typeof walletSchema>;

export function EditWalletModal({ 
  isOpen, 
  onClose, 
  data,
  onUpdate, 
  isLoading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: Wallet | null;
  onUpdate: (id: number, form: Partial<UpdateWalletRequest>) => Promise<void>; 
  isLoading?: boolean;
}) {
  const t = useTranslations("wallets");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    mode: "onSubmit",
    defaultValues: { name: "", company_id: isCompanyAdmin ? (user?.company_id || user?.id) : 0, currency_id: 0, balance: 0, notes: "" },
  });

  const selectedCompanyId = form.watch("company_id");
  const initialCompanyRef = useRef<number | null>(null);

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const { data: companyCurrenciesData, isLoading: isCompanyCurrenciesLoading } = useCompanyCurrencies(selectedCompanyId ? Number(selectedCompanyId) : null);

  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const currencyOptions = useMemo(() => {
    const list = companyCurrenciesData?.data || [];
    return list.map((c: any) => ({ label: `${c.name} (${c.code})`, value: String(c.id) }));
  }, [companyCurrenciesData]);

  useEffect(() => {
    if (isOpen && data) {
      initialCompanyRef.current = data.company_id;
      form.reset({
        name: data.name || "",
        company_id: isCompanyAdmin ? (user?.company_id || user?.id) : (data.company?.id || 0),
        currency_id: data.currency_id,
        balance: data.balance,
        notes: data.notes || "",
      });
    }
  }, [isOpen, data, form, isCompanyAdmin, user?.company_id]);

  // Reset currency when company changes (but not on initial load)
  useEffect(() => {
    if (selectedCompanyId && initialCompanyRef.current !== null && selectedCompanyId !== initialCompanyRef.current) {
      form.setValue("currency_id", 0);
      initialCompanyRef.current = Number(selectedCompanyId);
    }
  }, [selectedCompanyId, form]);

  const onSubmit = async (values: WalletFormValues) => {
    if (data?.id) {
      await onUpdate(data.id, {
        ...values,
        balance: Number(values.balance)
      } as Partial<UpdateWalletRequest>);
    }
  };

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tCommon("edit") || "Edit"} 
      mode="edit"
      formId="edit-wallet-form"
      saveLabel={tCommon("save") || "Save"}
      isLoading={isLoading}
    >
      <Form {...form}>
        <form id="edit-wallet-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <TextField 
            control={form.control}
            name="name"
            label={t("form.name")}
            placeholder="Main Wallet"
          />
          <div className="grid grid-cols-2 gap-4">
            {!isCompanyAdmin && (
              <SelectField 
                control={form.control}
                name="company_id"
                label={t("form.company")}
                options={companyOptions}
                placeholder="Select company"
              />
            )}
            <SelectField 
              control={form.control}
              name="currency_id"
              label={t("form.currency")}
              options={currencyOptions}
              placeholder={isCompanyCurrenciesLoading ? "Loading..." : (!selectedCompanyId || currencyOptions.length === 0 ? "No currencies" : "Select currency")}
              disabled={!selectedCompanyId || currencyOptions.length === 0 || isCompanyCurrenciesLoading}
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
