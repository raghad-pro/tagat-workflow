// "use client";

// import React, { useEffect } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import { Briefcase, DollarSign, Building, Activity, FileText } from "lucide-react";
// import { ActionModal } from "@/components/molecules/ActionModal";
// import { TextField, SelectField, TextAreaField, MultiSelectField } from "@/components/molecules/FormFields";
// import { Form } from "@/components/ui/form";
// import { useAuth } from "@/providers/AuthProvider";
// import { useCompanies } from "@/modules/companies/hooks/useCompanies";
// import { useCompanyCurrencies, useEmployees } from "@/modules/employees/hooks/useEmployees";

// const getProjectSchema = (isCompanyAdmin: boolean) => z.object({
//   title: z.string().min(2, "Title must be at least 2 characters"),
//   budget: z.string().min(1, "Budget is required"),
//   company: isCompanyAdmin ? z.string().optional() : z.string().min(1, "Company is required"),
//   status: z.string().min(1, "Select status"),
//   currency: z.string().min(1, "Currency is required"),
//   employees: z.array(z.string()).min(1, "At least one employee is required"),
//   notes: z.string().optional(),
// });

// type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

// const STATUS_OPTIONS = [
//   { value: "pending", label: "Pending" },
//   { value: "in_progress", label: "In Progress" },
//   { value: "completed", label: "Completed" },
//   { value: "on_hold", label: "On Hold" },
// ];

// export interface AddProjectFormValues {
//   title: string;
//   budget: string;
//   company?: string;
//   status: string;
//   currency: string;
//   employees: string[];
//   notes?: string;
// }

// interface AddProjectModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSubmit?: (values: AddProjectFormValues, setError: any) => void;
//   isLoading?: boolean;
// }

// export default function AddProjectModal({ isOpen, onClose, onSubmit, isLoading }: AddProjectModalProps) {
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
//     if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency")) {
//       form.setValue("currency", CURRENCY_OPTIONS[0].value);
//     }
//   }, [CURRENCY_OPTIONS.length, form]);

//   const handleFormSubmit = (data: FormValues) => {
//     onSubmit?.(data, form.setError);
//   };

//   if (!isOpen) return null;

//   return (
//     <ActionModal 
//       isOpen={isOpen} 
//       onClose={onClose} 
//       title="Add Project"
//       mode="add"
//       formId="add-project-form"
//       size="lg"
//       isLoading={isLoading}
//     >
//       <div className="flex flex-col w-full">
//         <Form {...form}>
//           <form id="add-project-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
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
//                 <MultiSelectField control={form.control} name="employees" label="Employees" options={employeeOptions} required placeholder="Select employees" />
//               </div>
//               <TextAreaField control={form.control} name="notes" label="Notes" placeholder="Additional details..." rows={4} />
//             </div>
//           </form>
//         </Form>
//       </div>
//     </ActionModal>
//   );
// }"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useTranslations } from "next-intl";
import {
  useCompanyClients,
  useCompanyCurrenciesByCompany,
} from "@/modules/projects/hooks/useCompanyData";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";

// ─── Schema ──────────────────────────────────────────────────────────────────

const getProjectSchema = (isCompanyAdmin: boolean, tCommon: any) =>
  z.object({
    title:     z.string().min(2, "Title must be at least 2 characters"),
    budget:    z.string().min(1, "Budget is required"),
    company:   isCompanyAdmin
                 ? z.string().optional()
                 : z.string().min(1, "Company is required"),
    client_id: z.string().min(1, "Client is required").refine(val => val !== "no-data", { message: tCommon("requiredField") }),
    status:    z.string().min(1, "Select status"),
    currency:  z.string().min(1, "Currency is required").refine(val => val !== "no-data", { message: tCommon("requiredField") }),
    employees: z.array(z.string()).min(1, "At least one employee is required").refine(val => !val.includes("no-data"), { message: tCommon("requiredField") }),
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddProjectFormValues {
  title:     string;
  budget:    string;
  company?:  string;
  client_id: string;
  status:    string;
  currency:  string;
  employees: string[];
  notes?:    string;
}

interface AddProjectModalProps {
  isOpen:     boolean;
  onClose:    () => void;
  onSubmit?:  (values: AddProjectFormValues, setError: any) => void;
  isLoading?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddProjectModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddProjectModalProps) {
  const { user }       = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const tCommon        = useTranslations("common");
  const tCurrencies    = useTranslations("currencies");

  const form = useForm<FormValues>({
    resolver: zodResolver(getProjectSchema(isCompanyAdmin, tCommon)),
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

  // ── Reset form when modal opens/closes ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      form.reset({
        title:     "",
        budget:    "",
        company:   "",
        client_id: "",
        status:    "",
        currency:  "",
        employees: [],
        notes:     "",
      });
    }
  }, [isOpen, form]);

  // ── Company list (super_admin only) ──────────────────────────────────────
  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companies      = companiesResponse?.data?.data ?? [];
  const companyOptions = companies.map((c: any) => ({
    value: c.id.toString(),
    label: c.name ?? c.company_name,
  }));

  // ── Watch selected company ────────────────────────────────────────────────
  const selectedCompany = form.watch("company");

  // For company, their company_id comes from their auth token/user object.
  const companyIdForQuery = isCompanyAdmin
    ? ((user as any)?.company_id?.toString() ?? null)
    : selectedCompany || null;

  // ── Company-scoped data — all three reset when company changes ────────────

  // GET /clients?company_id=X
  const { data: clientsList = [] } = useCompanyClients(companyIdForQuery);
  let clientOptions = clientsList.map((c: any) => ({
    value: c.id.toString(),
    label: c.name ?? c.id.toString(),
  }));
  if (companyIdForQuery && clientOptions.length === 0) {
    clientOptions = [{ value: "no-data", label: tCommon("noClients") }];
  }

  // Fetch all employees and filter by company locally
  const { data: allEmployeesResponse } = useEmployees({ page: 1, per_page: 1000 });
  const allEmployeesList = allEmployeesResponse?.data ?? [];
  let employeeOptions = companyIdForQuery
    ? allEmployeesList
        .filter((e: any) => e.company_id == companyIdForQuery || e.company?.id == companyIdForQuery)
        .map((e: any) => ({
          value: (e.user_id ?? e.user?.id ?? e.id).toString(),
          label:
            e.user?.name ??
            e.name ??
            e.employee_name ??
            (e.user?.first_name
              ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim()
              : null) ??
            e.id.toString(),
        }))
    : [];

  if (companyIdForQuery && employeeOptions.length === 0) {
    employeeOptions = [{ value: "no-data", label: tCommon("noEmployees") }];
  }

  // GET /companies/{id}/currencies
  const { data: currenciesList = [] } = useCompanyCurrenciesByCompany(companyIdForQuery);
  let CURRENCY_OPTIONS = currenciesList.map((c: any) => ({
    value: c.id.toString(),
    label: `${c.name ?? c.code}${c.symbol ? ` (${c.symbol})` : ""}`,
  }));

  if (companyIdForQuery && CURRENCY_OPTIONS.length === 0) {
    CURRENCY_OPTIONS = [{ value: "no-data", label: tCurrencies("noCurrencies") }];
  }

  // ── Reset company-scoped fields when company changes (super_admin) ────────
  useEffect(() => {
    if (!isCompanyAdmin) {
      form.setValue("client_id", "");
      form.setValue("currency",  "");
      form.setValue("employees", []);
    }
  }, [selectedCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select currency when only one is available ──────────────────────
  useEffect(() => {
    if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency") && CURRENCY_OPTIONS[0].value !== "no-data") {
      form.setValue("currency", CURRENCY_OPTIONS[0].value);
    }
  }, [CURRENCY_OPTIONS.length, form]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit = (data: FormValues) => {
    onSubmit?.(data, form.setError);
  };

  if (!isOpen) return null;

  // Helper for disabled placeholder text
  const noCompany = !companyIdForQuery;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Project"
      mode="add"
      formId="add-project-form"
      size="lg"
      isLoading={isLoading}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form
            id="add-project-form"
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

              {/* Company-scoped fields: Client, Currency, Employees */}
              {!!companyIdForQuery && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      control={form.control}
                      name="client_id"
                      label="Client"
                      options={clientOptions}
                      required
                      placeholder={
                        clientOptions.length === 0 || clientOptions[0]?.value === "no-data"
                          ? tCommon("noClients")
                          : "Select client"
                      }
                      disabled={clientOptions[0]?.value === "no-data"}
                    />
                    <SelectField
                      control={form.control}
                      name="currency"
                      label="Currency"
                      options={CURRENCY_OPTIONS}
                      required
                      placeholder={
                        CURRENCY_OPTIONS.length === 0 || CURRENCY_OPTIONS[0]?.value === "no-data"
                          ? tCurrencies("noCurrencies")
                          : "Select currency"
                      }
                      disabled={CURRENCY_OPTIONS[0]?.value === "no-data"}
                    />
                  </div>

                  <MultiSelectField
                    control={form.control}
                    name="employees"
                    label="Employees"
                    options={employeeOptions}
                    required
                    placeholder={
                      employeeOptions.length === 0 || employeeOptions[0]?.value === "no-data"
                        ? tCommon("noEmployees")
                        : "Select employees"
                    }
                    disabled={employeeOptions[0]?.value === "no-data"}
                  />
                </>
              )}

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