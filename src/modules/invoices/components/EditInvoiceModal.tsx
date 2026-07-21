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
import type { CreateInvoiceRequest, Invoice } from "@/modules/invoices/types/invoices.types";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useCompanyDataInfo, useProjectData, useClientProjects } from "@/modules/projects/hooks/useCompanyData";
import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";

const editInvoiceSchema = z.object({
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

type FormValues = z.infer<typeof editInvoiceSchema>;

interface EditInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CreateInvoiceRequest>, form: any) => void;
  isPending?: boolean;
  invoice: Invoice;
}

const STATUS_OPTIONS = [
  { value: "paid",    label: "Paid"    },
  { value: "unpaid",  label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
];

export function EditInvoiceModal({
  isOpen,
  onClose,
  onSave,
  isPending = false,
  invoice,
}: EditInvoiceModalProps) {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(editInvoiceSchema) as any,
    mode: "onSubmit",
    defaultValues: {
      company_id: Number(invoice.company_id) || undefined,
      client_id: Number(invoice.client_id) || undefined,
      project_id: Number(invoice.project_id) || undefined,
      currency_id: Number(invoice.currency_id) || undefined,
      amount: Number(invoice.amount) || undefined,
      status: invoice.status || "unpaid",
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
      due_date: invoice.due_date || new Date().toISOString().split('T')[0],
    },
  });

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const role = user?.role || "super_admin";

  const { data: companiesRes } = useCompanies({ per_page: 100 });
  
  const selectedCompanyId = form.watch("company_id");

  // Fetch company data (clients, projects, currencies) separately
  const companyIdForQuery = isCompanyAdmin ? (user?.company_id || user?.id) : selectedCompanyId;

  const { data: companyDataRes, isLoading: isCompanyDataInfoLoading } = useCompanyDataInfo(companyIdForQuery);
  const { data: projectData, isLoading: isProjectDataLoading } = useProjectData(form.watch("project_id"));
  const { data: clientProjectsRes, isLoading: isClientProjectsLoading } = useClientProjects(form.watch("client_id"));

  const clientsList = companyDataRes?.data?.clients || companyDataRes?.clients || [];
  const projectsList = Array.isArray(clientProjectsRes) ? clientProjectsRes : [];
  const currenciesList = companyDataRes?.data?.currencies || companyDataRes?.currencies || [];

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
  const projectOptions = useMemo(() => projectsList.map((p: any) => ({ value: String(p.id), label: p.title })), [projectsList]);
  const currencyOptions = useMemo(() => currenciesList.map((c: any) => ({ value: String(c.id), label: `${c.name} ${c.symbol ? `(${c.symbol})` : ''}`.trim() })), [currenciesList]);

  const prevClientIdRef = React.useRef(form.watch("client_id"));

  // Sync form when invoice changes
  useEffect(() => {
    if (isOpen && invoice) {
      form.reset({
        company_id: Number(invoice.company_id) || undefined,
        client_id: Number(invoice.client_id) || undefined,
        project_id: Number(invoice.project_id) || undefined,
        currency_id: Number(invoice.currency_id) || undefined,
        amount: Number(invoice.amount) || undefined,
        status: invoice.status || "unpaid",
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || new Date().toISOString().split('T')[0],
      });
      prevClientIdRef.current = Number(invoice.client_id) || undefined;
    }
  }, [invoice, isOpen, form]);

  const currentClientId = form.watch("client_id");
  // When client changes, clear selected project
  useEffect(() => {
    if (prevClientIdRef.current !== currentClientId) {
      form.setValue("project_id", "" as any);
      form.setValue("currency_id", "" as any);
      prevClientIdRef.current = currentClientId;
    }
  }, [currentClientId, form]);

  // When project changes, auto-select currency
  useEffect(() => {
    if (projectData && projectData.currency) {
      form.setValue("currency_id", String(projectData.currency.id) as any, { shouldValidate: true });
    }
  }, [projectData, form]);

  const handleFormSubmit = (data: FormValues) => {
    onSave(data as unknown as Partial<CreateInvoiceRequest>, form);
  };

  if (!isOpen) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title={t("edit") || "Edit Invoice"}
      mode="edit"
      formId="edit-invoice-form"
      size="lg"
      isLoading={isPending}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-invoice-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCompanyAdmin && (
                  <SelectField control={form.control} name="company_id" label={t("columns.company") || "Company"} options={companyOptions} required placeholder={tCommon("selectCompany") || "Select company"} />
                )}
                <SelectField control={form.control} name="client_id" label={t("columns.client") || "Client"} options={clientOptions} required placeholder={tCommon("selectClient") || "Select client"} disabled={isLoadingCompanyData} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="project_id" label={tCommon("project") || "Project"} options={projectOptions} required placeholder={tCommon("selectProject") || "Select project"} disabled={isClientProjectsLoading} />
                <SelectField control={form.control} name="currency_id" label={t("columns.currency") || "Currency"} options={currencyOptions} required placeholder={tCommon("selectCurrency") || "Select currency"} disabled={isLoadingCompanyData} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="amount" label={t("columns.amount") || "Amount"} type="number" required placeholder="0.00" />
                <SelectField control={form.control} name="status" label={t("columns.status") || "Status"} options={STATUS_OPTIONS} required placeholder={tCommon("selectStatus") || "Select status"} />
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
