"use client";

import React, { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

import { useCreatePayment, usePaymentData } from "../hooks/usePayments";
import { AddPaymentRequest } from "../types/payments.types";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useAuth } from "@/providers/AuthProvider";

const getPaymentSchema = (tCommon: any) => z.object({
  company_id: z.coerce.number().optional(),
  invoice_id: z.coerce.number().min(1, tCommon("validation.required")),
  wallet_id: z.coerce.number().min(1, tCommon("validation.required")),
  employee_id: z.coerce.number().min(1, tCommon("validation.required")),
  amount: z.coerce.number().min(1, tCommon("validation.required")),
  payment_method: z.string().min(2, tCommon("validation.required")),
  payment_date: z.string().min(2, tCommon("validation.required")),
  notes: z.string().optional(),
});

export type PaymentFormValues = z.input<ReturnType<typeof getPaymentSchema>>;

export function AddPaymentModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const { mutateAsync: createPayment, isPending: isLoading } = useCreatePayment();
  const isCompanyAdmin = user?.role === "company";

  const { data: companiesData } = useCompanies({ per_page: 100 });
  const companyOptions = useMemo(() => {
    const list = companiesData?.data?.data || [];
    return list.map((c: any) => ({ label: c.name, value: String(c.id) }));
  }, [companiesData]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(getPaymentSchema(tCommon)),
    mode: "onSubmit",
    defaultValues: { 
      company_id: isCompanyAdmin ? user?.company_id : 0, 
      invoice_id: 0, 
      employee_id: 0,
      wallet_id: 0, 
      amount: 0,
      payment_method: "cash",
      payment_date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      notes: "" 
    },
  });

  const selectedCompanyId = useWatch({ control: form.control, name: "company_id" }) || (isCompanyAdmin ? user?.company_id : undefined);

  // Use the new paymentData hook that fetches related data
  const { data: paymentDataRes, isLoading: isDataLoading } = usePaymentData(user?.role as string, selectedCompanyId as number);

  const invoiceOptions = useMemo(() => {
    const list = paymentDataRes?.invoices || [];
    return list.map(inv => ({ 
      label: `${inv.code} - ${inv.client_name} (${inv.amount} ${inv.currency})`, 
      value: String(inv.id) 
    }));
  }, [paymentDataRes]);

  const walletOptions = useMemo(() => {
    const list = paymentDataRes?.wallets || [];
    return list.map(w => ({ label: w.name, value: String(w.id) }));
  }, [paymentDataRes]);

  const employeeOptions = useMemo(() => {
    const list = paymentDataRes?.employees || [];
    return list.map(emp => ({ label: emp.user?.name || `Emp #${emp.id}`, value: String(emp.id) }));
  }, [paymentDataRes]);

  // Reset dependent fields when company changes
  useEffect(() => {
    if (isOpen && selectedCompanyId) {
      // Don't reset if we're just loading initially, but how to tell?
      // For Add modal, changing company should clear the selections:
      const currentCompany = form.getValues("company_id");
      if (currentCompany && Number(currentCompany) === Number(selectedCompanyId)) {
        // If they just opened it, values might be 0, but if they changed it:
        form.setValue("invoice_id", 0);
        form.setValue("wallet_id", 0);
        form.setValue("employee_id", 0);
      }
    }
  }, [selectedCompanyId, isOpen, form]);

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const methodOptions = [
    { label: "Cash", value: "cash" },
    { label: "Stripe", value: "stripe" },
    { label: "PayPal", value: "paypal" },
    { label: "Credit Card", value: "credit_card" },
    { label: "Bank Transfer", value: "bank_transfer" },
  ];

  const onSubmit = async (values: PaymentFormValues) => {
    try {
      const payload: any = {
        ...values,
        amount: Number(values.amount),
        exchange_rate: 1 // Default to 1 as it's not in the design
      };
      
      if (!isCompanyAdmin) {
        payload.company_id = selectedCompanyId as number;
      }

      await createPayment(payload as AddPaymentRequest);
      toast.success(t("messages.createSuccess") || "Payment added successfully");
      onClose();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || "Failed to add payment";
      toast.error(errorMsg);
    }
  };

  const isInvoiceDisabled = (!isCompanyAdmin && !selectedCompanyId) || isDataLoading || invoiceOptions.length === 0;
  const invoicePlaceholder = isDataLoading ? t("placeholders.loading") : ((!isCompanyAdmin && !selectedCompanyId) || invoiceOptions.length === 0 ? t("placeholders.noInvoices") : t("placeholders.selectInvoice"));

  const isWalletDisabled = (!isCompanyAdmin && !selectedCompanyId) || isDataLoading || walletOptions.length === 0;
  const walletPlaceholder = isDataLoading ? t("placeholders.loading") : ((!isCompanyAdmin && !selectedCompanyId) || walletOptions.length === 0 ? t("placeholders.noWallets") : t("placeholders.selectWallet"));

  const isEmployeeDisabled = (!isCompanyAdmin && !selectedCompanyId) || isDataLoading || employeeOptions.length === 0;
  const employeePlaceholder = isDataLoading ? t("placeholders.loading") : ((!isCompanyAdmin && !selectedCompanyId) || employeeOptions.length === 0 ? t("placeholders.noEmployees") : t("placeholders.selectEmployee"));

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("add") || "Add Payment"} 
      mode="add"
      formId="add-payment-form"
      saveLabel={t("add") || "Save"}
      isLoading={isLoading}
    >
      <Form {...form}>
        <form id="add-payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isCompanyAdmin && (
              <SelectField 
                control={form.control}
                name="company_id"
                label={t("form.company")}
                options={companyOptions}
              />
            )}
            <SelectField 
              control={form.control}
              name="invoice_id"
              label={t("form.invoice")}
              options={invoiceOptions}
              disabled={isInvoiceDisabled}
              placeholder={invoicePlaceholder}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField 
              control={form.control}
              name="wallet_id"
              label={t("form.wallet")}
              options={walletOptions}
              disabled={isWalletDisabled}
              placeholder={walletPlaceholder}
            />
            <SelectField 
              control={form.control}
              name="employee_id"
              label={t("form.employee")}
              options={employeeOptions}
              disabled={isEmployeeDisabled}
              placeholder={employeePlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
