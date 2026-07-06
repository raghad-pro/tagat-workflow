"use client";

import React, { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { Calendar } from "lucide-react";
import type { CreateInvoiceRequest } from "@/modules/invoices/types/invoices.types";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useCompanyDataInfo, useClientProjects, useProjectData } from "@/modules/projects/hooks/useCompanyData";
import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";

const createInvoiceSchema = z.object({
  company_id: z.coerce.number().optional(),
  client_id: z.coerce.number().min(1, "Client is required"),
  project_id: z.coerce.number().min(1, "Project is required"),
  currency_id: z.coerce.number().min(1, "Currency is required"),
  amount: z.coerce.number().min(1, "Amount is required"),
  status: z.string().min(1, "Status is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
}).superRefine((data, ctx) => {
  if (data.invoice_date && data.due_date) {
    if (new Date(data.invoice_date) > new Date(data.due_date)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice date cannot be after due date",
        path: ["invoice_date"],
      });
    }
  }
});

type FormValues = z.infer<typeof createInvoiceSchema>;

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInvoiceRequest, form: any) => void;
  isPending?: boolean;
}

const STATUS_OPTIONS = [
  { value: "paid",    label: "Paid"    },
  { value: "unpaid",  label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
];

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSave,
  isPending = false,
}: CreateInvoiceModalProps) {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(createInvoiceSchema) as any,
    mode: "onTouched",
    defaultValues: {
      company_id: undefined,
      client_id:  undefined,
      project_id: undefined,
      currency_id: undefined,
      amount:      undefined,
      status:      "unpaid",
      invoice_date: new Date().toISOString().split('T')[0],
      due_date:    new Date().toISOString().split('T')[0],
    },
  });

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const role = user?.role || "super_admin";

  const { data: companiesRes } = useCompanies({ per_page: 100 });
  
  const selectedCompanyId = form.watch("company_id");
  const selectedClientId = form.watch("client_id");
  const selectedProjectId = form.watch("project_id");

  // Fetch company data (clients, projects, currencies) separately
  const companyIdForQuery = isCompanyAdmin ? undefined : selectedCompanyId;

  const { data: companyDataRes, isLoading: isCompanyDataInfoLoading } = useCompanyDataInfo(companyIdForQuery);
  const { data: clientProjects, isLoading: isClientProjectsLoading } = useClientProjects(selectedClientId);
  const { data: projectData, isLoading: isProjectDataLoading } = useProjectData(selectedProjectId);
  
  const clientsList = companyDataRes?.data?.clients || companyDataRes?.clients || [];
  const projectsList = clientProjects || [];

  const isLoadingCompanyData = !!isOpen && (!!companyIdForQuery || isCompanyAdmin) && isCompanyDataInfoLoading;

  const companyOptions = useMemo(() => {
    const list = Array.isArray(companiesRes?.data) 
      ? companiesRes.data 
      : (companiesRes?.data?.data || []);
    return list.map((c: any) => ({
      value: String(c.id),
      label: c.name,
    }));
  }, [companiesRes]);

  const clientOptions = useMemo(() => clientsList.map((c: any) => ({ value: String(c.id), label: c.name })), [clientsList]);
  
  const projectOptions = useMemo(() => projectsList.map((p: any) => ({ value: String(p.id), label: p.title || p.name })), [projectsList]);
  
  const currencyOptions = useMemo(() => {
    if (projectData?.currency) {
      const c = projectData.currency;
      return [{ value: String(c.id), label: `${c.name || c.code || ''} ${c.symbol ? `(${c.symbol})` : ''}`.trim() }];
    }
    return [];
  }, [projectData]);

  // When form opens, clear values if company changes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  // When client changes, clear selected project if it doesn't belong to the client
  useEffect(() => {
    if (selectedClientId && selectedProjectId) {
      const projectBelongsToClient = projectsList.some((p: any) => String(p.id) === String(selectedProjectId));
      if (!projectBelongsToClient && !isClientProjectsLoading) {
        form.setValue("project_id", "" as any);
        form.clearErrors("project_id");
      }
    }
  }, [selectedClientId, projectsList, selectedProjectId, form, isClientProjectsLoading]);

  // When project changes, auto-select currency
  useEffect(() => {
    if (projectData && projectData.currency) {
      form.setValue("currency_id", String(projectData.currency.id) as any, { shouldValidate: true });
    } else {
      const current = form.getValues("currency_id");
      if (current !== undefined) {
        form.setValue("currency_id", "" as any);
        form.clearErrors("currency_id");
      }
    }
  }, [projectData, form]);

  const handleFormSubmit = (data: FormValues) => {
    onSave(data as unknown as CreateInvoiceRequest, form);
  };

  if (!isOpen) return null;

  const isClientDisabled = (!isCompanyAdmin && !selectedCompanyId) || isLoadingCompanyData || clientOptions.length === 0;
  const clientPlaceholder = isLoadingCompanyData ? "Loading..." : ((!isCompanyAdmin && !selectedCompanyId) || clientOptions.length === 0 ? "No clients" : "Select client");

  const isProjectDisabled = !selectedClientId || isClientProjectsLoading || projectOptions.length === 0;
  const projectPlaceholder = isClientProjectsLoading ? "Loading..." : (!selectedClientId || projectOptions.length === 0 ? "No projects" : "Select project");

  const isCurrencyDisabled = !selectedProjectId || isProjectDataLoading || currencyOptions.length === 0;
  const currencyPlaceholder = isProjectDataLoading ? "Loading..." : (!selectedProjectId || currencyOptions.length === 0 ? "No currency" : "Select currency");

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title={t("add") || "Create Invoice"}
      mode="add"
      formId="create-invoice-form"
      size="lg"
      isLoading={isPending}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="create-invoice-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCompanyAdmin && (
                  <SelectField control={form.control} name="company_id" label={t("columns.company") || "Company"} options={companyOptions} required placeholder="Select company" />
                )}
                <SelectField control={form.control} name="client_id" label={t("columns.client") || "Client"} options={clientOptions} required placeholder={clientPlaceholder} disabled={isClientDisabled} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="project_id" label={t("columns.project").includes(".") ? "Project" : t("columns.project")} options={projectOptions} required placeholder={projectPlaceholder} disabled={isProjectDisabled} />
                <SelectField control={form.control} name="currency_id" label={t("columns.currency").includes(".") ? "Currency" : t("columns.currency")} options={currencyOptions} required placeholder={currencyPlaceholder} disabled={isCurrencyDisabled} />
              </div>

              {projectData && (
                <div className="grid grid-cols-3 gap-4 p-4 ds-bg-form rounded-xl border ds-border-form mt-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium ds-text-sub">Budget</span>
                    <span className="text-sm font-bold ds-text-main">{projectData.budget}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium ds-text-sub">Paid</span>
                    <span className="text-sm font-bold ds-text-main">{projectData.paid}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium ds-text-sub">Remaining</span>
                    <span className="text-sm font-bold ds-text-main">{projectData.remaining}</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="amount" label={t("columns.amount") || "Amount"} type="number" required placeholder="0.00" />
                <SelectField control={form.control} name="status" label={t("columns.status") || "Status"} options={STATUS_OPTIONS} required placeholder="Select status" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="invoice_date" label={t("columns.issueDate") || "Invoice Date"} type="date" required icon={Calendar} />
                <TextField control={form.control} name="due_date" label={t("columns.dueDate") || "Due Date"} type="date" required icon={Calendar} />
              </div>
              
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
