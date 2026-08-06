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
  .refine((v) => !v.leader_id || v.employees.includes(v.leader_id), {
    path: ["leader_id"],
    message: tProject("validation.leaderNotMember"),
  });

type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

// ─── Constants ────────────────────────────────────────────────────────────────

// Moved STATUS_OPTIONS inside component or replaced inline to support translations.

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
  const t              = useTranslations("project");

  const form = useForm<FormValues>({
    resolver: zodResolver(getProjectSchema(isCompanyAdmin, tCommon, t)),
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
    ? ((user as any)?.company_id || user?.id)?.toString() ?? null
    : selectedCompany || null;

  // ── Company-scoped data ───────────────────────────────────────────────────

  // GET /clients?company_id=X
  const { data: clientsList = [] } = useCompanyClients(companyIdForQuery);
  const clientOptions = clientsList.map((c: any) => ({
    value: c.id.toString(),
    label: c.name ?? c.id.toString(),
  }));

  // Fetch all employees and filter by company locally
  const { data: allEmployeesResponse } = useEmployees({ page: 1, per_page: 100 });
  const rawData = allEmployeesResponse?.data;
  const allEmployeesList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

  let employeeOptions = (companyIdForQuery || isCompanyAdmin)
    ? allEmployeesList
        .filter((e: any) => isCompanyAdmin || e.company_id == companyIdForQuery || e.company?.id == companyIdForQuery)
        .map((e: any) => ({
          // Must be the user id: the API resolves employees/leader against the
          // users table, and the prefill below also reads user ids.
          value: String(e.user_id ?? e.user?.id ?? ""),
          label: e.user?.name ?? e.name ?? e.employee_name ?? (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim() : null) ?? String(e.user_id ?? e.id),
        }))
        .filter((o: any) => o.value !== "")
    : [];

  if ((companyIdForQuery || isCompanyAdmin) && employeeOptions.length === 0) {
    employeeOptions = [{ value: "no-data", label: tCommon("noEmployees") || "No employees" }];
  }

  // ── Project lead — chosen from the members assigned above ────────────────
  const selectedEmployees: string[] = form.watch("employees") ?? [];
  const leaderOptions = employeeOptions.filter(
    (o: any) => o.value !== "no-data" && selectedEmployees.includes(o.value)
  );

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
      // Keep the lead only if they are still among the members.
      leader_id: (() => {
        const id = (data as any).leader_id ?? (data as any).leader?.id;
        const asString = id === undefined || id === null ? "" : String(id);
        return currentEmployees.includes(asString) ? asString : "";
      })(),
      notes:     (data as any).description ?? (data as any).notes ?? "",
    });
  }, [data, isOpen]);  

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
  }, [currenciesList.length]);  

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    // Same gap as the add dialog: a company admin has no company select, so
    // `company_id` would be missing from the update payload too.
    onUpdate(
      data.id,
      isCompanyAdmin ? { ...formData, company: companyIdForQuery ?? "" } : formData,
      form.setError
    );
  };

  if (!isOpen || !data) return null;

  const noCompany = !companyIdForQuery;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("editProjectTitle")}
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
                  label={t("labels.title")}
                  placeholder={t("placeholders.title")}
                  required
                  icon={Briefcase}
                />
                <TextField
                  control={form.control}
                  name="budget"
                  label={t("labels.budget")}
                  placeholder={t("placeholders.budget")}
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
                    label={t("labels.company")}
                    options={companyOptions}
                    required
                    placeholder={t("placeholders.company")}
                  />
                )}
                <SelectField
                  control={form.control}
                  name="status"
                  label={t("labels.status")}
                  options={[
                    { value: "pending",     label: t("statusOptions.pending") },
                    { value: "in_progress", label: t("statusOptions.in_progress") },
                    { value: "completed",   label: t("statusOptions.completed") },
                  ]}
                  required
                  placeholder={t("placeholders.status")}
                />
              </div>

              {/* Row 3: Client + Currency — company-scoped */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={form.control}
                  name="client_id"
                  label={t("labels.client")}
                  options={clientOptions}
                  required
                  placeholder={
                    noCompany
                      ? tCommon("selectCompany")
                      : clientOptions.length === 0
                      ? tCommon("noClients")
                      : t("placeholders.client")
                  }
                  disabled={noCompany}
                />
                <SelectField
                  control={form.control}
                  name="currency"
                  label={t("labels.currency")}
                  options={CURRENCY_OPTIONS}
                  required
                  placeholder={
                    noCompany
                      ? tCommon("selectCompany")
                      : CURRENCY_OPTIONS.length === 0 || CURRENCY_OPTIONS[0]?.value === "no-data"
                      ? tCurrencies("noCurrencies")
                      : t("placeholders.currency")
                  }
                  disabled={noCompany || CURRENCY_OPTIONS[0]?.value === "no-data"}
                />
              </div>

              {/* Row 4: Employees — company-scoped */}
              <MultiSelectField
                control={form.control}
                name="employees"
                label={t("labels.employees")}
                options={employeeOptions}
                placeholder={
                  noCompany
                    ? tCommon("selectCompany")
                    : employeeOptions.length === 0 || employeeOptions[0]?.value === "no-data"
                    ? (tCommon("noEmployees") || "No employees")
                    : t("placeholders.employees")
                }
                disabled={noCompany || employeeOptions[0]?.value === "no-data"}
              />

              {/* Project lead — restricted to the members chosen above */}
              <SelectField
                control={form.control}
                name="leader_id"
                label={t("labels.leader")}
                options={leaderOptions}
                required
                placeholder={
                  leaderOptions.length === 0
                    ? t("placeholders.leaderPickEmployeesFirst")
                    : t("placeholders.leader")
                }
                disabled={leaderOptions.length === 0}
              />

              {/* Notes */}
              <TextAreaField
                control={form.control}
                name="notes"
                label={t("labels.notes")}
                placeholder={t("placeholders.notes")}
                rows={4}
              />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}