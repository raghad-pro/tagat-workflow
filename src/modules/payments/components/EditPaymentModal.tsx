"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { useUpdatePayment, usePaymentData } from "../hooks/usePayments";
import { Payment, UpdatePaymentRequest } from "../types/payments.types";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";

const paymentSchema = z.object({
  company_id: z.coerce.number().min(1, "Company is required"),
  invoice_id: z.coerce.number().min(1, "Invoice is required"),
  wallet_id: z.coerce.number().min(1, "Wallet is required"),
  employee_id: z.coerce.number().min(1, "Employee is required"),
  amount: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  payment_method: z.string().min(2, "Payment method is required"),
  payment_date: z.string().min(2, "Payment date is required"),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.input<typeof paymentSchema>;

export function EditPaymentModal({ 
  isOpen, 
  onClose,
  data
}: { 
  isOpen: boolean; 
  onClose: () => void;
  data: Payment | null;
}) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const { mutateAsync: updatePayment, isPending: isLoading } = useUpdatePayment();

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    mode: "onTouched",
  });

  const selectedCompanyId = useWatch({
    control: form.control,
    name: "company_id",
  });

  // Track initial load to prevent clearing fields immediately when populated
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch payment data options when a company is selected
  const { data: paymentDataRes } = usePaymentData(Number(selectedCompanyId) || 0);

  const invoiceOptions = useMemo(() => {
    const list = paymentDataRes?.data?.invoices || [];
    return list.map(inv => ({ 
      label: `${inv.code} - ${inv.client_name} (${inv.amount} ${inv.currency})`, 
      value: String(inv.id) 
    }));
  }, [paymentDataRes]);

  const walletOptions = useMemo(() => {
    const list = paymentDataRes?.data?.wallets || [];
    return list.map(w => ({ label: w.name, value: String(w.id) }));
  }, [paymentDataRes]);

  const employeeOptions = useMemo(() => {
    const list = paymentDataRes?.data?.employees || [];
    return list.map(emp => ({ label: emp.user?.name || `Emp #${emp.id}`, value: String(emp.id) }));
  }, [paymentDataRes]);

  useEffect(() => {
    if (isOpen && data) {
      setIsInitialLoad(true);
      form.reset({
        company_id: data.company_id,
        invoice_id: data.invoice_id,
        employee_id: data.employee_id,
        wallet_id: data.wallet_id,
        amount: Number(data.amount),
        payment_method: data.payment_method,
        payment_date: data.payment_date,
        notes: data.notes || "",
      });
      // After a short delay, turn off initial load flag so user changes will reset dependent fields
      setTimeout(() => setIsInitialLoad(false), 500);
    }
  }, [isOpen, data, form]);

  useEffect(() => {
    if (isOpen && selectedCompanyId && !isInitialLoad) {
      // Clear dependent fields if the user changes the company manually
      form.setValue("invoice_id", 0);
      form.setValue("wallet_id", 0);
      form.setValue("employee_id", 0);
    }
  }, [selectedCompanyId, isOpen, isInitialLoad, form]);

  const methodOptions = [
    { label: "Cash", value: "cash" },
    { label: "Stripe", value: "stripe" },
    { label: "PayPal", value: "paypal" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Bank Transfer", value: "bank_transfer" },
  ];

  const onSubmit = async (values: PaymentFormValues) => {
    if (!data?.id) return;
    try {
      await updatePayment({
        id: data.id,
        data: {
          ...values,
          amount: Number(values.amount),
          exchange_rate: Number(data.exchange_rate) || 1
        } as UpdatePaymentRequest
      });
      toast.success(t("messages.updateSuccess") || "Payment updated successfully");
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update payment";
      toast.error(errorMsg);
    }
  };

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tCommon("edit") || "Edit Payment"} 
      mode="edit"
      formId="edit-payment-form"
      saveLabel={tCommon("save") || "Save"}
      isLoading={isLoading}
    >
      <Form {...form}>
        <form id="edit-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              control={form.control}
              name="company_id"
              label={t("form.company")}
              options={companyOptions}
            />
            <SelectField 
              control={form.control}
              name="invoice_id"
              label={t("form.invoice")}
              options={invoiceOptions}
              disabled={!selectedCompanyId || invoiceOptions.length === 0}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <SelectField 
              control={form.control}
              name="wallet_id"
              label={t("form.wallet")}
              options={walletOptions}
              disabled={!selectedCompanyId || walletOptions.length === 0}
            />
            <SelectField 
              control={form.control}
              name="employee_id"
              label="Employee"
              options={employeeOptions}
              disabled={!selectedCompanyId || employeeOptions.length === 0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <TextField 
              control={form.control}
              name="amount"
              label={t("form.amount")}
              placeholder="0.00"
              type="number"
            />
            <SelectField 
              control={form.control}
              name="payment_method"
              label={t("form.method")}
              options={methodOptions}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <TextField 
              control={form.control}
              name="payment_date"
              label={t("form.date")}
              placeholder="YYYY-MM-DD"
              type="date"
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
