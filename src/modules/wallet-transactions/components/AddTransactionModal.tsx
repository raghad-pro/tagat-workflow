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

import { useAddWalletTransaction, useWalletBalance } from "../hooks/useWalletTransactions";
import { AddTransactionRequest } from "../types/wallet-transactions.types";
import { useWallets } from "@/modules/wallets/hooks/useWallets";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useAuth } from "@/providers/AuthProvider";

const transactionSchema = z.object({
  company_id: z.coerce.number().optional(),
  wallet_id: z.coerce.number().min(1, "Wallet is required"),
  type: z.string().min(2, "Type is required"),
  related_wallet_id: z.coerce.number().optional(),
  amount: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  exchange_rate: z.union([z.string(), z.number()]).optional(),
  transaction_date: z.string().min(2, "Date is required"),
  description: z.string().optional(),
});

export type TransactionFormValues = z.input<typeof transactionSchema>;

export function AddTransactionModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const t = useTranslations("walletTransactions");
  const tCommon = useTranslations("common");
  const { mutateAsync: addTransaction, isPending: isLoading } = useAddWalletTransaction();
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const { data: walletsData } = useWallets({ per_page: 100 });

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      company_id: isCompanyAdmin ? user?.company_id : 0,
      wallet_id: 0,
      type: "income",
      related_wallet_id: 0,
      amount: "",
      exchange_rate: "",
      transaction_date: new Date().toISOString().split('T')[0],
      description: "",
    },
    mode: "onChange",
  });

  const selectedCompanyId = form.watch("company_id");
  const selectedWalletId = form.watch("wallet_id");
  const selectedType = form.watch("type");
  const selectedRelatedWalletId = form.watch("related_wallet_id");
  const amountValue = Number(form.watch("amount")) || 0;
  const exchangeRateValue = Number(form.watch("exchange_rate")) || 0;

  const { data: balanceData, isLoading: isBalanceLoading } = useWalletBalance(selectedWalletId as number | undefined);
  const currentBalance = Number(balanceData?.data?.balance || 0);

  // Calculate wallet after transaction
  let walletAfterTransaction = currentBalance;
  if (selectedType === "income" || selectedType === "funding" || selectedType === "assets") {
    walletAfterTransaction += amountValue;
  } else if (selectedType === "expenses" || selectedType === "withdraw" || selectedType === "salary" || selectedType === "transfer") {
    walletAfterTransaction -= amountValue;
  }

  const { data: relatedBalanceData } = useWalletBalance(selectedRelatedWalletId as number | undefined);
  const currentRelatedBalance = Number(relatedBalanceData?.data?.balance || 0);
  
  // Commission seems to be 2% based on the user's screenshot (900 -> 18)
  const commission = amountValue * 0.02;
  const relatedWalletAfter = currentRelatedBalance + (amountValue * (exchangeRateValue || 1)) - commission;

  const walletOptions = useMemo(() => {
    let list = walletsData?.data?.data || [];
    if (selectedCompanyId && !isCompanyAdmin) {
      list = list.filter((w: any) => w.company_id == (selectedCompanyId as number) || w.company?.id == (selectedCompanyId as number));
    } else if (isCompanyAdmin) {
      list = list.filter((w: any) => w.company_id == user?.company_id || w.company?.id == user?.company_id);
    }
    return list.map((w: any) => ({ label: w.name, value: String(w.id) }));
  }, [walletsData, selectedCompanyId, isCompanyAdmin, user?.company_id]);

  const relatedWalletOptions = useMemo(() => {
    return walletOptions.filter(w => String(w.value) !== String(selectedWalletId));
  }, [walletOptions, selectedWalletId]);

  const typeOptions = [
    { label: "Income", value: "income" },
    { label: "Expense", value: "expenses" },
    { label: "Withdraw", value: "withdraw" },
    { label: "Funding", value: "funding" },
    { label: "Salary", value: "salary" },
    { label: "Assets", value: "assets" },
    { label: "Transfer", value: "transfer" },
  ];

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const payload: any = {
        wallet_id: Number(values.wallet_id),
        type: values.type,
        amount: Number(values.amount),
        transaction_date: values.transaction_date,
        description: values.description,
      };

      if (values.type === "transfer") {
        payload.related_wallet_id = Number(values.related_wallet_id);
        if (values.exchange_rate) {
            payload.exchange_rate = Number(values.exchange_rate);
        }
      }

      await addTransaction(payload);
      toast.success(t("messages.createSuccess") || "Transaction added successfully");
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to add transaction";
      toast.error(errorMsg);
    }
  };

  const isTransfer = selectedType === "transfer";

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("addTransaction") || "Add Transaction"} 
      onSubmit={form.handleSubmit(onSubmit)}
      isLoading={isLoading}
      saveLabel={tCommon("save") || "Save"}
      mode="add"
    >
      <Form {...form}>
        <form className="space-y-4">
          <div className="flex flex-col space-y-4">
            
            {!isCompanyAdmin && (
              <SelectField
                control={form.control}
                name="company_id"
                label={t("table.company") || "Company"}
                options={companyOptions}
              />
            )}

            <SelectField
              control={form.control}
              name="wallet_id"
              label={t("table.wallet") || "Wallet"}
              options={walletOptions}
              placeholder={tCommon("select") || "Select Wallet"}
            />

            {/* Current Balance Box */}
            {Number(selectedWalletId) > 0 && (
              <div className="px-4 py-3 bg-[#e0f7fa] rounded-md flex items-center">
                <span className="text-[#00bcd4] font-medium text-sm">
                  {t("currentBalance") || "Current Balance"}: {isBalanceLoading ? "..." : currentBalance.toFixed(2)}
                </span>
              </div>
            )}

            <SelectField
              control={form.control}
              name="type"
              label={t("table.type") || "Type"}
              options={typeOptions}
              placeholder={tCommon("select") || "Select Type"}
            />

            {isTransfer && (
              <>
                <SelectField
                  control={form.control}
                  name="related_wallet_id"
                  label={t("relatedWallet") || "Related Wallet (Transfer To)"}
                  options={relatedWalletOptions}
                  placeholder={tCommon("select") || "Select Wallet"}
                />
                
                {Number(selectedRelatedWalletId) > 0 && (
                  <div className="px-4 py-3 bg-[#e8f5e9] rounded-md flex items-center">
                    <span className="text-[#4caf50] font-medium text-sm">
                      {t("toWalletBalance") || "To Wallet Balance"}: {currentRelatedBalance.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            <TextField
              control={form.control}
              name="amount"
              label={t("table.amount") || "Amount"}
              placeholder="0.00"
              type="number"
            />

            {/* Wallet After Transaction Box */}
            {Number(selectedWalletId) > 0 && (
              <div className="px-4 py-3 bg-[#fff3e0] rounded-md flex items-center">
                <span className="text-[#ff9800] font-medium text-sm">
                  {t("walletAfterTransaction") || "Wallet After Transaction"}: {walletAfterTransaction.toFixed(2)}
                </span>
              </div>
            )}

            {isTransfer && (
              <>
                <TextField
                  control={form.control}
                  name="exchange_rate"
                  label={t("exchangeRate") || "Exchange Rate"}
                  placeholder="0.00"
                  type="number"
                />

                <div className="px-4 py-3 bg-[#f5f5f5] rounded-md flex items-center">
                  <span className="text-gray-500 font-medium text-sm">
                    {t("commission") || "Commission"}: {commission.toFixed(2)}
                  </span>
                </div>

                {Number(selectedRelatedWalletId) > 0 && (
                  <div className="px-4 py-3 bg-[#f1f8e9] rounded-md flex items-center">
                    <span className="text-[#8bc34a] font-medium text-sm">
                      {t("relatedWalletAfter") || "Related Wallet After"}: {relatedWalletAfter.toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}

            <TextField
              control={form.control}
              name="transaction_date"
              label={t("table.date") || "Transaction Date"}
              type="date"
            />
          </div>

          <TextAreaField
            control={form.control}
            name="description"
            label={t("notes") || "Description"}
            placeholder={t("notesPlaceholder") || "Optional notes..."}
            rows={4}
          />
        </form>
      </Form>
    </ActionModal>
  );
}
