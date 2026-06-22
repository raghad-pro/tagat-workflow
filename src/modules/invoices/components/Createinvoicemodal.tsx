"use client";

import { useState, useCallback } from "react";
import { X, Mail, ChevronDown, Calendar } from "@/assets/icons/icons";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { Modal } from "@/components/molecules/Modal";
import type { CreateInvoiceRequest, InvoiceCurrency, InvoiceStatus } from "@/modules/invoices/types/invoices.types";
import { useAuth } from "@/providers/AuthProvider";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreateInvoiceModalProps {
  isOpen:    boolean;
  onClose:   () => void;
  onSave:    (data: CreateInvoiceRequest) => void;
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

const CURRENCY_OPTIONS: { value: InvoiceCurrency; label: string }[] = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "SAR", label: "SAR" },
  { value: "AED", label: "AED" },
];

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
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

const EMPTY_FORM: CreateInvoiceRequest = {
  company:     "",
  client:      "",
  project:     "",
  currency:    "",
  amount:      "",
  invoiceDate: "",
  dueDate:     "",
  status:      "",
};

// ─── SelectField ─────────────────────────────────────────────────────────────
// استخدام native select للأداء وdark mode مجاني
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select",
  required,
}: {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  options:     readonly { value: string; label: string }[];
  placeholder?: string;
  required?:   boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text size="sm" weight="bold" tag="label">
        {label}
        {required && <span className="ds-text-error ms-1">*</span>}
      </Text>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border ds-border-input-color ds-bg-form ds-text-sm ds-text-primary px-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors cursor-pointer"
          style={{ height: "var(--input-height)", paddingInlineEnd: "2.5rem" }}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 ds-text-gray-200"
        />
      </div>
    </div>
  );
}

// ─── DateField ────────────────────────────────────────────────────────────────
function DateField({
  label,
  value,
  onChange,
  required,
}: {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Text size="sm" weight="bold" tag="label">
        {label}
        {required && <span className="ds-text-error ms-1">*</span>}
      </Text>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border ds-border-input-color ds-bg-form ds-text-sm ds-text-primary px-4 focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          style={{ height: "var(--input-height)", paddingInlineEnd: "2.5rem" }}
        />
        <Calendar
          size={14}
          className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 ds-text-gray-200"
        />
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function CreateInvoiceModal({
  isOpen,
  onClose,
  onSave,
  isPending = false,
}: CreateInvoiceModalProps) {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const [form, setForm] = useState<CreateInvoiceRequest>(EMPTY_FORM);

  const set = useCallback(
    (field: keyof CreateInvoiceRequest) => (v: string) =>
      setForm((prev) => ({ ...prev, [field]: v })),
    []
  );

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const handleSave = () => {
    onSave(form);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Invoice"
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="solid"
            size="md"
            loading={isPending}
            licon={!isPending ? <Mail size={14} /> : undefined}
            onClick={handleSave}
          >
            Save Invoice
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {!isCompanyAdmin && (
          <SelectField label="Company"   value={form.company}     onChange={set("company")}     options={COMPANY_OPTIONS}  required />
        )}
        <SelectField label="Client"    value={form.client}      onChange={set("client")}      options={CLIENT_OPTIONS}   required />
        <SelectField label="Project"   value={form.project}     onChange={set("project")}     options={PROJECT_OPTIONS}  />
        <SelectField label="Currency"  value={form.currency}    onChange={set("currency")}    options={CURRENCY_OPTIONS} required />
        <SelectField label="Amount"    value={form.amount}      onChange={set("amount")}      options={AMOUNT_OPTIONS}   required />
        <SelectField label="Status"    value={form.status}      onChange={set("status")}      options={STATUS_OPTIONS}   required />
        <DateField   label="Invoice Date" value={form.invoiceDate} onChange={set("invoiceDate")} required />
        <DateField   label="Due Date"     value={form.dueDate}     onChange={set("dueDate")}     required />
      </div>
    </Modal>
  );
}
