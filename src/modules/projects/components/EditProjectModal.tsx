// "use client";

// import React, { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Briefcase, DollarSign, Building, Activity, FileText } from "lucide-react";
// import { ActionModal } from "@/components/molecules/ActionModal";
// import { TextField, SelectField, TextAreaField, MultiSelectField } from "@/components/molecules/FormFields";
// import { Form } from "@/components/ui/form";
// import type { Project } from "../types/projects.types";
// import { useAuth } from "@/providers/AuthProvider";

// import { useCompanies } from "@/modules/companies/hooks/useCompanies";
// import { useCompanyCurrencies, useEmployees } from "@/modules/employees/hooks/useEmployees";

// const getProjectSchema = (isCompanyAdmin: boolean) => z.object({
//   title: z.string().min(2, "Title must be at least 2 characters"),
//   budget: z.string().min(1, "Budget is required"),
//   company: isCompanyAdmin ? z.string().optional() : z.string().min(1, "Company is required"),
//   status: z.string().min(1, "Select status"),
//   currency: z.string().min(1, "Currency is required"),
//   employees: z.array(z.string()).optional(),
//   notes: z.string().optional(),
// });

// type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

// const STATUS_OPTIONS = [
//   { value: "pending", label: "Pending" },
//   { value: "in_progress", label: "In Progress" },
//   { value: "completed", label: "Completed" },
//   { value: "on_hold", label: "On Hold" },
// ];

// interface EditProjectModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onUpdate: (id: number | string, data: any, setError: any) => void;
//   data: Project | null;
//   isLoading?: boolean;
// }

// export default function EditProjectModal({ isOpen, onClose, onUpdate, data, isLoading }: EditProjectModalProps) {
//   const { user } = useAuth();
//   const isCompanyAdmin = user?.role === "company";

//   const form = useForm<FormValues>({
//     resolver: zodResolver(getProjectSchema(isCompanyAdmin)),
//     mode: "onSubmit",
//     defaultValues: { title: "", budget: "", company: "", status: "", currency: "", employees: [], notes: "" },
//   });

//   const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
//   const companies = companiesResponse?.data?.data || [];
//   const companyOptions = companies.map((c: any) => ({
//     value: c.id.toString(),
//     label: c.name || c.company_name
//   }));

//   const { data: employeesResponse } = useEmployees({ page: 1, per_page: 100 });
//   const employeesList = employeesResponse?.data?.data || employeesResponse?.data || [];
//   const employeeOptions = employeesList.map((e: any) => ({
//     value: (e.user_id || e.user?.id || e.id).toString(),
//     label: e.employee_name || e.employeeName || e.name || e.user?.name || 
//            (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name || ""}`.trim() : null) || 
//            e.id.toString()
//   }));

//   const selectedCompany = form.watch("company");
//   const { data: currenciesData } = useCompanyCurrencies(selectedCompany);
  
//   let currencies = [];
//   if (Array.isArray(currenciesData?.data?.data)) {
//     currencies = currenciesData.data.data;
//   } else if (Array.isArray(currenciesData?.data)) {
//     currencies = currenciesData.data;
//   } else if (Array.isArray(currenciesData)) {
//     currencies = currenciesData;
//   }
  
//   const CURRENCY_OPTIONS = currencies.map((c: any) => ({
//     value: c.id?.toString(),
//     label: c.name || c.code || c.id?.toString(),
//   }));

//   if (CURRENCY_OPTIONS.length === 0) {
//     CURRENCY_OPTIONS.push({ value: "1", label: "USD" });
//   }

//   useEffect(() => {
//     if (data && isOpen) {
//       let currentEmployees: string[] = [];
//       if (Array.isArray(data.employees) && data.employees.length > 0) {
//         currentEmployees = data.employees.map((e: any) => (e.user_id || e.user?.id || e.id).toString());
//       } else if (Array.isArray((data as any).users) && (data as any).users.length > 0) {
//         currentEmployees = (data as any).users.map((u: any) => u.id.toString());
//       } else if (typeof data.employees === "string") {
//         currentEmployees = [data.employees];
//       } else if (typeof data.employees === "number") {
//         currentEmployees = [data.employees.toString()];
//       }

//       form.reset({
//         title: data.name || data.title || "",
//         budget: data.budget?.toString() || "",
//         company: data.company_id?.toString() || (typeof data.company === 'object' ? (data.company as any)?.id?.toString() : data.company?.toString()) || "",
//         status: data.status?.toLowerCase() || "",
//         currency: (data as any).currency_id?.toString() || "",
//         employees: currentEmployees,
//         notes: (data as any).description || (data as any).notes || "",
//       });
//     }
//   }, [data, isOpen, form]);

//   useEffect(() => {
//     if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency")) {
//       form.setValue("currency", CURRENCY_OPTIONS[0].value);
//     }
//   }, [CURRENCY_OPTIONS.length, form]);

//   const handleFormSubmit = (formData: FormValues) => {
//     if (!data) return;
//     onUpdate(data.id, formData, form.setError);
//   };

//   if (!isOpen || !data) return null;

//   return (
//     <ActionModal 
//       isOpen={isOpen} 
//       onClose={onClose} 
//       title="Edit Project"
//       mode="edit"
//       formId="edit-project-form"
//       size="lg"
//       isLoading={isLoading}
//     >
//       <div className="flex flex-col w-full">
//         <Form {...form}>
//           <form id="edit-project-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
//             <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ border: "1px solid var(--color-border-form)" }}>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <TextField control={form.control} name="title" label="Project Title" placeholder="Enter project title" required icon={Briefcase} />
//                 <TextField control={form.control} name="budget" label="Budget" placeholder="e.g. 5000" required icon={DollarSign} />
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {!isCompanyAdmin && (
//                   <SelectField control={form.control} name="company" label="Company" options={companyOptions} required placeholder="Select company" />
//                 )}
//                 <SelectField control={form.control} name="currency" label="Currency" options={CURRENCY_OPTIONS} required placeholder="Select currency" />
//                 <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} required placeholder="Select status" />
//                 <MultiSelectField control={form.control} name="employees" label="Employees" options={employeeOptions} placeholder="Select employees" />
//               </div>
//               <TextAreaField control={form.control} name="notes" label="Notes" placeholder="Additional details..." rows={4} />
//             </div>
//           </form>
//         </Form>
//       </div>
//     </ActionModal>
//   );
// }
"use client";

import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { Briefcase, DollarSign } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import {
  TextField,
  SelectField,
  TextAreaField,
  MultiSelectField,
} from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { Project } from "../types/projects.types";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import {
  useCompanyClients,
  useCompanyEmployees,
  useCompanyCurrenciesByCompany,
} from "@/modules/projects/hooks/useCompanyData";

// ─── Schema ──────────────────────────────────────────────────────────────────

const getProjectSchema = (isCompanyAdmin: boolean) =>
  z.object({
    title:     z.string().min(2, "Title must be at least 2 characters"),
    budget:    z.string().min(1, "Budget is required"),
    company:   isCompanyAdmin
                 ? z.string().optional()
                 : z.string().min(1, "Company is required"),
    client_id: z.string().min(1, "Client is required"),
    status:    z.string().min(1, "Select status"),
    currency:  z.string().min(1, "Currency is required"),
    employees: z.array(z.string()).optional(),
    notes:     z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "pending",     label: "Pending"     },
  { value: "in_progress", label: "In Progress" },
  { value: "completed",   label: "Completed"   },
  { value: "on_hold",     label: "On Hold"     },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface EditProjectModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onUpdate:   (id: number | string, data: any, setError: any) => void;
  data:       Project | null;
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditProjectModal({
  isOpen,
  onClose,
  onUpdate,
  data,
  isLoading,
}: EditProjectModalProps) {
  const { user }       = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const tCommon        = useTranslations("common");
  const tCurrencies    = useTranslations("currencies");

  const form = useForm<FormValues>({
    resolver: zodResolver(getProjectSchema(isCompanyAdmin)),
    mode: "onSubmit",
    defaultValues: {
      title:     "",
      budget:    "",
      company:   "",
      client_id: "",
      status:    "",
      currency:  "",
      employees: [],
      notes:     "",
    },
  });

  // ── Company list (super_admin only) ──────────────────────────────────────
  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companies      = companiesResponse?.data?.data ?? [];
  const companyOptions = companies.map((c: any) => ({
    value: c.id.toString(),
    label: c.name ?? c.company_name,
  }));

  // ── Watch selected company ────────────────────────────────────────────────
  const selectedCompany = form.watch("company");

  const companyIdForQuery = isCompanyAdmin
    ? ((user as any)?.company_id?.toString() ?? null)
    : selectedCompany || null;

  // ── Company-scoped data ───────────────────────────────────────────────────

  // GET /clients?company_id=X
  const { data: clientsList = [] } = useCompanyClients(companyIdForQuery);
  const clientOptions = clientsList.map((c: any) => ({
    value: c.id.toString(),
    label: c.name ?? c.id.toString(),
  }));

  // GET /employees?company_id=X
  const { data: employeesList = [] } = useCompanyEmployees(companyIdForQuery);
  const employeeOptions = employeesList.map((e: any) => ({
    value: (e.user_id ?? e.user?.id ?? e.id).toString(),
    label:
      e.user?.name ??
      e.name ??
      e.employee_name ??
      (e.user?.first_name
        ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim()
        : null) ??
      e.id.toString(),
  }));

  // GET /companies/{id}/currencies
  const { data: currenciesList = [] } = useCompanyCurrenciesByCompany(companyIdForQuery);
  let CURRENCY_OPTIONS = currenciesList.map((c: any) => ({
    value: c.id.toString(),
    label: `${c.name ?? c.code}${c.symbol ? ` (${c.symbol})` : ""}`,
  }));

  if (companyIdForQuery && CURRENCY_OPTIONS.length === 0) {
    CURRENCY_OPTIONS = [{ value: "no-data", label: tCurrencies("noCurrencies") }];
  }

  // ── Populate form when modal opens ───────────────────────────────────────
  useEffect(() => {
    if (!data || !isOpen) return;

    let currentEmployees: string[] = [];
    if (Array.isArray(data.employees) && data.employees.length > 0) {
      currentEmployees = (data.employees as any[]).map((e: any) =>
        (e.user_id ?? e.user?.id ?? e.id).toString()
      );
    } else if (Array.isArray((data as any).users)) {
      currentEmployees = (data as any).users.map((u: any) => u.id.toString());
    } else if (typeof data.employees === "string" && data.employees) {
      currentEmployees = [data.employees];
    } else if (typeof data.employees === "number") {
      currentEmployees = [String(data.employees)];
    }

    const companyId =
      data.company_id?.toString() ??
      (typeof data.company === "object"
        ? (data.company as any)?.id?.toString()
        : data.company?.toString()) ??
      "";

    const clientId =
      (data as any).client_id?.toString() ??
      (typeof data.client === "object"
        ? (data.client as any)?.id?.toString()
        : "") ??
      "";

    form.reset({
      title:     (data as any).name ?? data.title ?? "",
      budget:    data.budget?.toString() ?? "",
      company:   companyId,
      client_id: clientId,
      status:    data.status?.toLowerCase() ?? "",
      currency:  (data as any).currency_id?.toString() ?? "",
      employees: currentEmployees,
      notes:     (data as any).description ?? (data as any).notes ?? "",
    });
  }, [data, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset company-scoped fields when company changes (super_admin only) ──
  useEffect(() => {
    if (!isOpen || !selectedCompany) return;

    const originalCompanyId =
      data?.company_id?.toString() ??
      (typeof data?.company === "object"
        ? (data.company as any)?.id?.toString()
        : data?.company?.toString()) ??
      "";

    if (selectedCompany === originalCompanyId) {
      return;
    }

    if (!isCompanyAdmin) {
      form.setValue("client_id", "");
      form.setValue("currency",  "");
      form.setValue("employees", []);
    }
  }, [selectedCompany, isOpen, data, isCompanyAdmin, form]); 

  // ── Auto-select currency when only one available ──────────────────────────
  useEffect(() => {
    if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency")) {
      form.setValue("currency", CURRENCY_OPTIONS[0].value);
    }
  }, [currenciesList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate(data.id, formData, form.setError);
  };

  if (!isOpen || !data) return null;

  const noCompany = !companyIdForQuery;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project"
      mode="edit"
      formId="edit-project-form"
      size="lg"
      isLoading={isLoading}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form
            id="edit-project-form"
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-5"
          >
            <div
              className="rounded-2xl p-5 flex flex-col gap-5"
              style={{ border: "1px solid var(--color-border-form)" }}
            >
              {/* Row 1: Title + Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  control={form.control}
                  name="title"
                  label="Project Title"
                  placeholder="Enter project title"
                  required
                  icon={Briefcase}
                />
                <TextField
                  control={form.control}
                  name="budget"
                  label="Budget"
                  placeholder="e.g. 5000"
                  required
                  icon={DollarSign}
                />
              </div>

              {/* Row 2: Company (super_admin) + Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCompanyAdmin && (
                  <SelectField
                    control={form.control}
                    name="company"
                    label="Company"
                    options={companyOptions}
                    required
                    placeholder="Select company"
                  />
                )}
                <SelectField
                  control={form.control}
                  name="status"
                  label="Status"
                  options={STATUS_OPTIONS}
                  required
                  placeholder="Select status"
                />
              </div>

              {/* Row 3: Client + Currency — company-scoped */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={form.control}
                  name="client_id"
                  label="Client"
                  options={clientOptions}
                  required
                  placeholder={
                    noCompany
                      ? "Select a company first"
                      : clientOptions.length === 0
                      ? "No clients found"
                      : "Select client"
                  }
                  disabled={noCompany}
                />
                <SelectField
                  control={form.control}
                  name="currency"
                  label="Currency"
                  options={CURRENCY_OPTIONS}
                  required
                  placeholder={
                    noCompany
                      ? "Select a company first"
                      : CURRENCY_OPTIONS.length === 0 || CURRENCY_OPTIONS[0]?.value === "no-data"
                      ? tCurrencies("noCurrencies")
                      : "Select currency"
                  }
                  disabled={noCompany || CURRENCY_OPTIONS[0]?.value === "no-data"}
                />
              </div>

              {/* Row 4: Employees — company-scoped */}
              <MultiSelectField
                control={form.control}
                name="employees"
                label="Employees"
                options={employeeOptions}
                placeholder={
                  noCompany
                    ? "Select a company first"
                    : employeeOptions.length === 0
                    ? "No employees found"
                    : "Select employees"
                }
                disabled={noCompany}
              />

              {/* Notes */}
              <TextAreaField
                control={form.control}
                name="notes"
                label="Notes"
                placeholder="Additional details..."
                rows={4}
              />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}