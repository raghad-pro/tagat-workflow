"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useAuth } from "@/providers/AuthProvider";
import type { Currency } from "../types/currencies.types";

export function EditCurrencyModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
  serverError,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
  serverError?: Record<string, string[]>;
  initialData: Currency | null;
}) {
  const t = useTranslations("currencies");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const editCurrencySchema = z.object({
    name: z.string().min(1, t("requiredField")),
    code: z.string().min(1, t("requiredField")),
    symbol: z.string().min(1, t("requiredField")),
    company_id: isSuperAdmin ? z.string().min(1, t("requiredField")) : z.string().optional(),
  });

  type FormValues = z.infer<typeof editCurrencySchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(editCurrencySchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      code: "",
      symbol: "",
      company_id: "",
    },
  });

  useEffect(() => {
    if (initialData && isOpen) {
      form.reset({
        name: initialData.name,
        code: initialData.code,
        symbol: initialData.symbol,
        company_id: initialData.company_id?.toString() || "",
      });
    }
  }, [initialData, isOpen, form]);

  useEffect(() => {
    if (serverError) {
      Object.keys(serverError).forEach((key) => {
        form.setError(key as keyof FormValues, {
          type: "server",
          message: serverError[key][0],
        });
      });
    }
  }, [serverError, form]);

  const { data: companiesData } = useCompanies({ page: 1, per_page: 1000 });
  const companies = companiesData?.data?.data || [];
  const COMPANY_OPTIONS = companies.map((c: any) => ({
    value: c.id?.toString(),
    label: c.name || c.domain || c.id?.toString(),
  }));

  const handleSubmit = async (data: FormValues) => {
    await onSave(data);
  };

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("editCurrency")}
      mode="edit"
      onSubmit={form.handleSubmit(handleSubmit)}
      isLoading={isLoading}
      saveLabel={t("save")}
      cancelLabel={t("cancel")}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              control={form.control}
              name="name"
              label={t("currencyName")}
              placeholder=""
              required
            />
            <TextField
              control={form.control}
              name="code"
              label={t("currencyCode")}
              placeholder=""
              required
            />
            {isSuperAdmin && (
              <SelectField
                control={form.control}
                name="company_id"
                label={t("company")}
                options={COMPANY_OPTIONS}
                required
                placeholder={t("selectCompany")}
              />
            )}
            <TextField
              control={form.control}
              name="symbol"
              label={t("symbol")}
              placeholder=""
              required
            />
          </div>
        </form>
      </Form>
    </ActionModal>
  );
}
