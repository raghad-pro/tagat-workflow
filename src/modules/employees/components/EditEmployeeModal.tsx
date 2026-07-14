"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Mail, Lock, Briefcase, DollarSign } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { Employee } from "../types/employees.types";
import { UseFormSetError } from "react-hook-form";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useCompanyCurrencies } from "../hooks/useEmployees";

const editEmployeeSchema = z.object({
  employeeName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email"),
  paymentType: z.string().min(1, "Select payment type"),
  jobTitle: z.string().min(1, "Job title is required"),
  password: z.string().optional(),
  hourlyRate: z.string().min(1, "Rate is required"),
  currency: z.string().min(1, "Select currency"),
  company: z.string().optional(),
});

export type EditEmployeeFormValues = z.infer<typeof editEmployeeSchema>;

const PAYMENT_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "hourly", label: "Hourly" },
  { value: "part_time", label: "Part Time" }
];

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: any, setError: UseFormSetError<EditEmployeeFormValues>) => void;
  data: Employee | null;
}

export default function EditEmployeeModal({ isOpen, onClose, data, onUpdate }: EditEmployeeModalProps) {
  const t = useTranslations("employee");
  const tCurrencies = useTranslations("currencies");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: companiesData } = useCompanies({ per_page: 100 });

  let companies: any[] = [];
  if (Array.isArray(companiesData?.data?.data)) {
    companies = companiesData.data.data;
  } else if (Array.isArray(companiesData?.data)) {
    companies = companiesData.data;
  }

  const COMPANY_OPTIONS = companies.map((c: any) => ({
    value: c.id?.toString(),
    label: c.name || c.domain || c.id?.toString(),
  }));

  const form = useForm<EditEmployeeFormValues>({
    resolver: zodResolver(editEmployeeSchema),
    mode: "onSubmit",
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

  // Reset currency when company changes (super_admin only)
  useEffect(() => {
    if (!isOpen || !selectedCompany) return;

    const originalCompanyId =
      typeof data?.company === "object"
        ? data.company?.id?.toString() || ""
        : data?.company?.toString() || "";

    if (selectedCompany === originalCompanyId) {
      return;
    }

    if (isSuperAdmin) {
      form.setValue("currency", "");
    }
  }, [selectedCompany, isOpen, data, isSuperAdmin, form]);

  useEffect(() => {
    if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency") && CURRENCY_OPTIONS[0].value !== "no-data") {
      form.setValue("currency", CURRENCY_OPTIONS[0].value);
    }
  }, [CURRENCY_OPTIONS.length, form]);

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        employeeName: data.employee_name || data.employeeName || data.name || data.user?.name || "",
        email: data.user?.email || data.email || "",
        paymentType: typeof data.paymentType === 'string' ? data.paymentType.toLowerCase() : (typeof data.payment_type === 'string' ? data.payment_type.toLowerCase() : ""),
        jobTitle: data.job_title || data.jobTitle || data.job || "",
        password: "",
        hourlyRate: String(data.salary || data.hourly_rate || data.hourlyRate || "").replace(/[^0-9.]/g, '') || "",
        currency: typeof data.currency === 'object' ? data.currency?.id?.toString() || "" : data.currency?.toString().toLowerCase() || "",
        company: typeof data.company === 'object' ? data.company?.id?.toString() || "" : data.company?.toString() || "",
      });
    }
  }, [data, isOpen, form]);

  const handleFormSubmit = (formData: EditEmployeeFormValues) => {
    if (!data) return;
    onUpdate(data.id, formData, form.setError);
  };

  const selectedPaymentType = form.watch("paymentType");
  const rateLabel = selectedPaymentType === "monthly" ? "Monthly Rate" : 
                    (selectedPaymentType === "hourly" || selectedPaymentType === "part_time" ? "Hourly Rate" : t("labels.salary"));

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("editEmployeeTitle")}
      mode="edit"
      formId="edit-employee-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-employee-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ border: "1px solid var(--color-border-form)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField control={form.control} name="employeeName" label={t("labels.name")} placeholder={t("placeholders.name")} required icon={User} />
                <TextField control={form.control} name="email" label={t("labels.email")} placeholder={t("placeholders.email")} type="email" required icon={Mail} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField control={form.control} name="paymentType" label={t("labels.paymentType")} options={PAYMENT_OPTIONS} required placeholder={t("placeholders.paymentType")} />
                <TextField control={form.control} name="jobTitle" label={t("labels.jobTitle")} placeholder={t("placeholders.jobTitle")} required icon={Briefcase} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PasswordField control={form.control} name="password" label={t("labels.password")} placeholder={t("placeholders.password")} icon={Lock} />
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
