"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { useUpdateWalletTransaction } from "../hooks/useWalletTransactions";
import { WalletTransaction, UpdateTransactionRequest } from "../types/wallet-transactions.types";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useWallets } from "@/modules/wallets/hooks/useWallets";

const transactionSchema = z.object({
  company_id: z.coerce.number().min(1, "Company is required"),
  wallet_id: z.coerce.number().min(1, "Wallet is required"),
  amount: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  transaction_date: z.string().min(2, "Date is required"),
  type: z.string().min(2, "Type is required"),
  notes: z.string().optional(),
});

export type TransactionFormValues = z.input<typeof transactionSchema>;

export function EditTransactionModal({ 
  isOpen, 
  onClose,
  data
}: { 
  isOpen: boolean; 
  onClose: () => void;
  data: WalletTransaction | null;
}) {
  const t = useTranslations("walletTransactions");
  const tCommon = useTranslations("common");
  const { mutateAsync: updateTransaction, isPending: isLoading } = useUpdateWalletTransaction();

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const { data: walletsData } = useWallets({ per_page: 100 });

  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const walletOptions = useMemo(() => {
    const list = walletsData?.data?.data || [];
    return list.map((w: any) => ({ label: w.name, value: String(w.id) }));
  }, [walletsData]);

  const typeOptions = [
    { label: "Income", value: "income" },
    { label: "Funding", value: "funding" },
    { label: "Assets", value: "assets" },
    { label: "Expenses", value: "expenses" },
  ];

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onTouched",
  });

  useEffect(() => {
    if (isOpen && data) {
      form.reset({
        company_id: data.company_id,
        wallet_id: data.wallet_id,
        amount: String(Math.abs(parseFloat(data.amount))),
        transaction_date: data.transaction_date.split('T')[0],
        type: data.type.toLowerCase(),
        notes: data.notes || "",
      });
    }
  }, [isOpen, data, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    if (!data?.id) return;
    try {
      await updateTransaction({
        id: data.id,
        data: values as UpdateTransactionRequest
      });
      toast.success(t("messages.updateSuccess") || "Transaction updated successfully");
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update transaction";
      toast.error(errorMsg);
    }
  };

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tCommon("edit") || "Edit Transaction"} 
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
      saveLabel={tCommon("save") || "Save"}
      mode="edit"
    >
      <Form {...form}>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              control={form.control}
              name="company_id"
              label={t("table.company") || "Company"}
              options={companyOptions}
              placeholder={tCommon("select") || "Select"}
            />
            <SelectField
              control={form.control}
              name="wallet_id"
              label={t("table.wallet") || "Wallet"}
              options={walletOptions}
              placeholder={tCommon("select") || "Select"}
            />
            <SelectField
              control={form.control}
              name="type"
              label={t("table.type") || "Type"}
              options={typeOptions}
              placeholder={tCommon("select") || "Select"}
            />
            <TextField
              control={form.control}
              name="amount"
              label={t("table.amount") || "Amount"}
              placeholder="0.00"
              type="number"
            />
            <TextField
              control={form.control}
              name="transaction_date"
              label={t("table.date") || "Transaction Date"}
              type="date"
            />
          </div>
          <TextAreaField
            control={form.control}
            name="notes"
            label={t("notes") || "Notes"}
            placeholder={t("notesPlaceholder") || "Optional notes..."}
            rows={4}
          />
        </form>
      </Form>
    </ActionModal>
  );
}
