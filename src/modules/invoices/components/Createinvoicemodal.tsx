"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { Calendar, DollarSign, FileText } from "lucide-react";
import type { CreateInvoiceRequest } from "@/modules/invoices/types/invoices.types";
import { useAuth } from "@/providers/AuthProvider";

const createInvoiceSchema = z.object({
  company: z.string().optional(),
  client: z.string().min(1, "Client is required"),
  project: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  amount: z.string().min(1, "Amount is required"),
  status: z.string().min(1, "Status is required"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
}).superRefine((data, ctx) => {
  if (data.invoiceDate && data.dueDate) {
    if (new Date(data.invoiceDate) > new Date(data.dueDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invoice date cannot be after due date",
        path: ["invoiceDate"],
      });
    }
  }
});

type FormValues = z.infer<typeof createInvoiceSchema>;

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInvoiceRequest) => void;
  isPending?: boolean;
}

// ─── Option data (static — outside component to avoid recreation) ─────────────
const COMPANY_OPTIONS  = [
  { value: "advanced-tech", label: "Advanced Tech Company" },
  { value: "blue-ocean",    label: "Blue Ocean Solutions"  },
  { value: "nexus",         label: "Nexus Digital"         },
] as const;

const CLIENT_OPTIONS = [
  { value: "ali",  label: "Ali Hassan"  },
  { value: "sara", label: "Sara Ahmed"  },
  { value: "noor", label: "Noor Khalid" },
] as const;

const PROJECT_OPTIONS = [
  { value: "website", label: "Website Redesign" },
  { value: "mobile",  label: "Mobile App"       },
  { value: "crm",     label: "CRM System"       },
] as const;

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "SAR", label: "SAR" },
  { value: "AED", label: "AED" },
];

const STATUS_OPTIONS = [
  { value: "Paid",    label: "Paid"    },
  { value: "Pending", label: "Pending" },
  { value: "Overdue", label: "Overdue" },
];

const AMOUNT_OPTIONS = [
  { value: "500",  label: "$500"   },
  { value: "1000", label: "$1,000" },
  { value: "1500", label: "$1,500" },
  { value: "3000", label: "$3,000" },
];

export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSave,
  isPending = false,
}: CreateInvoiceModalProps) {
  const t = useTranslations("invoice");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(createInvoiceSchema),
    mode: "onTouched",
    defaultValues: {
      company: "",
      client: "",
      project: "",
      currency: "",
      amount: "",
      invoiceDate: "",
      dueDate: "",
      status: "",
    },
  });

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const handleFormSubmit = (data: FormValues) => {
    // cast to match the CreateInvoiceRequest interface
    onSave(data as CreateInvoiceRequest);
    form.reset();
  };

  if (!isOpen) return null;

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
                  <SelectField control={form.control} name="company" label={t("columns.company") || "Company"} options={[...COMPANY_OPTIONS]} required placeholder="Select company" />
                )}
                <SelectField control={form.control} name="client" label="Client" options={[...CLIENT_OPTIONS]} required placeholder="Select client" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="project" label="Project" options={[...PROJECT_OPTIONS]} placeholder="Select project" />
                <SelectField control={form.control} name="currency" label="Currency" options={CURRENCY_OPTIONS} required placeholder="Select currency" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="amount" label={t("columns.amount") || "Amount"} options={AMOUNT_OPTIONS} required placeholder="Select amount" />
                <SelectField control={form.control} name="status" label={t("columns.status") || "Status"} options={STATUS_OPTIONS} required placeholder="Select status" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="invoiceDate" label={t("columns.issueDate") || "Invoice Date"} type="date" placeholder="" required icon={Calendar} />
                <TextField control={form.control} name="dueDate" label={t("columns.dueDate") || "Due Date"} type="date" placeholder="" required icon={Calendar} />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
