
"use client";

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

const getProjectSchema = (isCompanyAdmin: boolean, tCommon: any, tProject: any) =>
  z.object({
    title:     z.string().min(2, tCommon("validation.minLength", { min: 2 })),
    budget:    z.string().min(1, tCommon("validation.required")),
    company:   isCompanyAdmin
                 ? z.string().optional()
                 : z.string().min(1, tCommon("validation.required")),
    client_id: z.string().min(1, tCommon("validation.required")).refine(val => val !== "no-data", { message: tCommon("validation.required") }),
    status:    z.string().min(1, tCommon("validation.required")),
    currency:  z.string().min(1, tCommon("validation.required")).refine(val => val !== "no-data", { message: tCommon("validation.required") }),
    employees: z.array(z.string()).min(1, tCommon("validation.required")).refine(val => !val.includes("no-data"), { message: tCommon("validation.required") }),
    leader_id: z.string().min(1, tCommon("validation.required")),
    notes:     z.string().optional(),
  })
  // The lead must be one of the assigned members — picking members and then
  // removing the one who leads them would otherwise submit a dangling id.
  .refine((v) => !v.leader_id || v.employees.includes(v.leader_id), {
    path: ["leader_id"],
    message: tProject("validation.leaderNotMember"),
  });

type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

// ─── Constants ────────────────────────────────────────────────────────────────

// Only these three pass the API's status validation — `on_hold` is rejected.
const getStatusOptions = (t: any) => [
  { value: "pending",     label: t("statusOptions.pending")     },
  { value: "in_progress", label: t("statusOptions.in_progress") },
  { value: "completed",   label: t("statusOptions.completed")   },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddProjectFormValues {
  title:     string;
  budget:    string;
  company?:  string;
  client_id: string;
  status:    string;
  currency:  string;
  /** User ids — the API resolves `employees[]` against the users table. */
  employees: string[];
  /** User id of the project lead; must be one of `employees`. */
  leader_id: string;
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
  const tProject       = useTranslations("project");

  const STATUS_OPTIONS = getStatusOptions(tProject);

  const form = useForm<FormValues>({
    resolver: zodResolver(getProjectSchema(isCompanyAdmin, tCommon, tProject)),
    mode: "onSubmit",
    defaultValues: {
      title:     "",
      budget:    "",
      company:   "",
      client_id: "",
      status:    "",
      currency:  "",
      employees: [],
      leader_id: "",
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
        leader_id: "",
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

  // For company, their company_id comes from their auth token/user object, or their own user ID if they are the company.
  const companyIdForQuery = isCompanyAdmin
    ? (((user as any)?.company_id || user?.id)?.toString() ?? null)
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
  const { data: allEmployeesResponse } = useEmployees({ page: 1, per_page: 100 });
  const rawData = allEmployeesResponse?.data;
  const allEmployeesList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);
  
  let employeeOptions = (companyIdForQuery || isCompanyAdmin)
    ? allEmployeesList
        .filter((e: any) => isCompanyAdmin || e.company_id == companyIdForQuery || e.company?.id == companyIdForQuery)
        // The API validates `employees[]` and `leader_id` against the *users*
        // table, so the option value must be the user id. Sending the employee
        // record id silently assigned whoever happened to own that user id.
        .map((e: any) => ({
          value: String(e.user_id ?? e.user?.id ?? ""),
          label: e.user?.name ?? e.name ?? e.employee_name ?? (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim() : null) ?? String(e.user_id ?? e.id),
        }))
        .filter((o: any) => o.value !== "")
    : [];

  if (companyIdForQuery && employeeOptions.length === 0) {
    employeeOptions = [{ value: "no-data", label: tCommon("noEmployees") }];
  }

  // ── Project lead — chosen from the members assigned above ────────────────
  const selectedEmployees: string[] = form.watch("employees") ?? [];
  const leaderOptions = employeeOptions.filter(
    (o: any) => o.value !== "no-data" && selectedEmployees.includes(o.value)
  );

  // Drop the lead if they are removed from the member list.
  const selectedLeader = form.watch("leader_id");
  useEffect(() => {
    if (selectedLeader && !selectedEmployees.includes(selectedLeader)) {
      form.setValue("leader_id", "");
    }
  }, [selectedEmployees, selectedLeader, form]);

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
      form.setValue("leader_id", "");
    }
  }, [selectedCompany]);  

  // ── Auto-select currency when only one is available ──────────────────────
  useEffect(() => {
    if (CURRENCY_OPTIONS.length === 1 && !form.getValues("currency") && CURRENCY_OPTIONS[0].value !== "no-data") {
      form.setValue("currency", CURRENCY_OPTIONS[0].value);
    }
  }, [CURRENCY_OPTIONS.length, form]);  

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit = (data: FormValues) => {
    // A company admin never sees the company select — it is their own company —
    // so `company` stays empty and `buildProjectPayload` skipped `company_id`
    // entirely, which the API rejects with "The company id field is required."
    // The server does not infer it from the token, so it is attached here.
    //
    // `companyIdForQuery` is the same id that just fetched this form's clients
    // and currencies; if it were the wrong company those lists would have come
    // back empty.
    onSubmit?.(
      isCompanyAdmin ? { ...data, company: companyIdForQuery ?? "" } : data,
      form.setError
    );
  };

  if (!isOpen) return null;

  // Helper for disabled placeholder text
  const noCompany = !companyIdForQuery;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={tProject("add")}
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
                  label={tProject("labels.title")}
                  placeholder={tProject("placeholders.title")}
                  required
                  icon={Briefcase}
                />
                <TextField
                  control={form.control}
                  name="budget"
                  label={tProject("labels.budget")}
                  placeholder={tProject("placeholders.budget")}
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
                    label={tProject("labels.company")}
                    options={companyOptions}
                    required
                    placeholder={tProject("placeholders.company")}
                  />
                )}
                <SelectField
                  control={form.control}
                  name="status"
                  label={tProject("labels.status")}
                  options={STATUS_OPTIONS}
                  required
                  placeholder={tProject("placeholders.status")}
                />
              </div>

              {/* Company-scoped fields: Client, Currency, Employees */}
              {!!companyIdForQuery && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      control={form.control}
                      name="client_id"
                      label={tProject("labels.client")}
                      options={clientOptions}
                      required
                      placeholder={
                        clientOptions.length === 0 || clientOptions[0]?.value === "no-data"
                          ? tCommon("noClients")
                          : tProject("placeholders.client")
                      }
                      disabled={clientOptions[0]?.value === "no-data"}
                    />
                    <SelectField
                      control={form.control}
                      name="currency"
                      label={tProject("labels.currency")}
                      options={CURRENCY_OPTIONS}
                      required
                      placeholder={
                        CURRENCY_OPTIONS.length === 0 || CURRENCY_OPTIONS[0]?.value === "no-data"
                          ? tCurrencies("noCurrencies")
                          : tProject("placeholders.currency")
                      }
                      disabled={CURRENCY_OPTIONS[0]?.value === "no-data"}
                    />
                  </div>

                  <MultiSelectField
                    control={form.control}
                    name="employees"
                    label={tProject("labels.employees")}
                    options={employeeOptions}
                    required
                    placeholder={
                      employeeOptions.length === 0 || employeeOptions[0]?.value === "no-data"
                        ? tCommon("noEmployees")
                        : tProject("placeholders.employees")
                    }
                    disabled={employeeOptions[0]?.value === "no-data"}
                  />

                  {/* Project lead — restricted to the members chosen above */}
                  <SelectField
                    control={form.control}
                    name="leader_id"
                    label={tProject("labels.leader")}
                    options={leaderOptions}
                    required
                    placeholder={
                      leaderOptions.length === 0
                        ? tProject("placeholders.leaderPickEmployeesFirst")
                        : tProject("placeholders.leader")
                    }
                    disabled={leaderOptions.length === 0}
                  />
                </>
              )}

              {/* Notes */}
              <TextAreaField
                control={form.control}
                name="notes"
                label={tProject("labels.notes")}
                placeholder={tProject("placeholders.notes")}
                rows={4}
              />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}