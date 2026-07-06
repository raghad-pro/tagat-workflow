"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Briefcase, DollarSign, Building } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { AddEmployeeFormValues } from "../types/employees.types";
import { UseFormSetError } from "react-hook-form";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";

const addEmployeeSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  paymentType: z.string().min(1, "Select payment type"),
  jobTitle: z.string().min(1, "Job title is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  hourlyRate: z.string().min(1, "Rate is required"),
  currency: z.string().min(1, "Select currency"),
  company: z.string().optional(),
});

type FormValues = z.infer<typeof addEmployeeSchema>;

import { useCompanyCurrencies } from "../hooks/useEmployees";

const PAYMENT_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" },
  { value: "part_time", label: "Part Time" }
];

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (values: FormValues, setError: UseFormSetError<FormValues>) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSubmit }: AddEmployeeModalProps) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: companiesData } = useCompanies({ per_page: 100 });
  
  let companies = [];
  if (Array.isArray(companiesData?.data?.data)) {
    companies = companiesData.data.data;
  } else if (Array.isArray(companiesData?.data)) {
    companies = companiesData.data;
  }
  
  const COMPANY_OPTIONS = companies.map((c: any) => ({
    value: c.id?.toString(),
    label: c.name || c.domain || c.id?.toString(),
  }));

  const t = useTranslations("employee");
  const tCurrencies = useTranslations("currencies");
  const form = useForm<FormValues>({
    resolver: zodResolver(addEmployeeSchema),
    mode: "onTouched",
    defaultValues: {
      employeeName: "", email: "", paymentType: "", jobTitle: "",
      password: "", hourlyRate: "", currency: "", company: "",
    },
  });

  const selectedCompany = form.watch("company");
  const { data: currenciesData } = useCompanyCurrencies(selectedCompany);
  
  let currencies = [];
  if (Array.isArray(currenciesData?.data?.data)) {
    currencies = currenciesData.data.data;
  } else if (Array.isArray(currenciesData?.data)) {
    currencies = currenciesData.data;
  } else if (Array.isArray(currenciesData)) {
    currencies = currenciesData;
  }
  
  let CURRENCY_OPTIONS = currencies.map((c: any) => ({
    value: c.id?.toString(),
    label: c.name || c.code || c.id?.toString(),
  }));

  const hasNoCurrencies = (isSuperAdmin && !selectedCompany) || CURRENCY_OPTIONS.length === 0;

  if (hasNoCurrencies) {
    CURRENCY_OPTIONS = [{ value: "no-data", label: tCurrencies("noCurrencies") }];
  }

  // Reset currency when company changes (super_admin)
  useEffect(() => {
    if (isSuperAdmin) {
      form.setValue("currency", "");
    }
  }, [selectedCompany, isSuperAdmin, form]);

  useEffect(() => {
    if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency") && CURRENCY_OPTIONS[0].value !== "no-data") {
      form.setValue("currency", CURRENCY_OPTIONS[0].value);
    }
  }, [CURRENCY_OPTIONS.length, form]);

  const handleFormSubmit = (data: FormValues) => {
    if (onSubmit) {
      onSubmit(data, form.setError);
    } else {
      onClose();
      form.reset();
    }
  };

  const selectedPaymentType = form.watch("paymentType");
  const rateLabel = selectedPaymentType === "monthly" ? "Monthly Rate" : 
                    (selectedPaymentType === "hourly" || selectedPaymentType === "part_time" ? "Hourly Rate" : t("labels.salary"));

  if (!isOpen) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title={t("addEmployeeTitle")}
      mode="add"
      formId="add-employee-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-employee-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ border: "1px solid var(--color-border-form)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="employeeName" label={t("labels.name")} placeholder={t("placeholders.name")} required icon={User} />
                <TextField control={form.control} name="email" label={t("labels.email")} placeholder={t("placeholders.email")} type="email" required icon={Mail} checkExistsUrl="/check-email" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField control={form.control} name="paymentType" label={t("labels.paymentType")} options={PAYMENT_OPTIONS} required placeholder={t("placeholders.paymentType")} />
                <TextField control={form.control} name="jobTitle" label={t("labels.jobTitle")} placeholder={t("placeholders.jobTitle")} required icon={Briefcase} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField control={form.control} name="password" label={t("labels.password")} placeholder={t("placeholders.password")} required icon={Lock} />
                <TextField control={form.control} name="hourlyRate" label={rateLabel} placeholder={t("placeholders.salary")} type="number" required icon={DollarSign} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isSuperAdmin && (
                  <SelectField control={form.control} name="company" label={t("labels.company")} options={COMPANY_OPTIONS} required placeholder={t("placeholders.company")} />
                )}
                <SelectField
                  control={form.control}
                  name="currency"
                  label={t("labels.currency")}
                  options={CURRENCY_OPTIONS}
                  required
                  placeholder={
                    hasNoCurrencies
                      ? tCurrencies("noCurrencies")
                      : t("placeholders.currency")
                  }
                  disabled={hasNoCurrencies}
                />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
