"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, Building, Clock, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

import { SelectField } from "@/components/molecules/FormFields";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import { useWatch } from "react-hook-form";

const addTimesheetSchema = z.object({
  employee: z.string().min(1, "Employee is required"),
  company: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  hours: z.string().min(1, "Hours is required"),
  rateHr: z.string().min(1, "Rate per hour is required"),
});

type FormValues = z.infer<typeof addTimesheetSchema>;

export default function AddTimesheetModal({ isOpen, onClose, onSubmit = () => {} }: { isOpen: boolean, onClose: () => void, onSubmit?: (data: any) => void }) {
  const t = useTranslations("timesheets");
  const tCommon = useTranslations("common");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(addTimesheetSchema),
    mode: "onSubmit",
    defaultValues: { employee: "", company: "", date: "", hours: "", rateHr: "" },
  });

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const selectedCompanyId = useWatch({ control: form.control, name: "company" });

  // Fetch Companies for Super Admin
  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companies = companiesResponse?.data?.data || [];
  const companyOptions = companies.map((c: any) => ({ value: c.id.toString(), label: c.name }));

  // Fetch all employees and filter by company locally
  const { data: allEmployeesResponse } = useEmployees({ page: 1, per_page: 1000 });
  const allEmployeesList = allEmployeesResponse?.data ?? [];
  let employeeOptions = (isCompanyAdmin ? allEmployeesList : selectedCompanyId ? allEmployeesList.filter((e: any) => e.company_id == selectedCompanyId || e.company?.id == selectedCompanyId) : [])
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
    }));

  if (!isCompanyAdmin && selectedCompanyId && employeeOptions.length === 0) {
    employeeOptions = [{ value: "no-data", label: tCommon("noEmployees") }];
  }

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
    onClose();
    form.reset();
  };

  if (!isOpen) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={() => { form.reset(); onClose(); }} 
      title={t("add") || "Add Time Log"}
      mode="add"
      formId="add-Timesheet-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-Timesheet-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              {!isCompanyAdmin && (
                <SelectField control={form.control} name="company" label={t("columns.company") || "Company"} options={companyOptions} required placeholder="Select company" />
              )}
              <SelectField control={form.control} name="employee" label={t("columns.employee") || "Employee"} options={employeeOptions} required placeholder="Select employee" disabled={!isCompanyAdmin && !selectedCompanyId} />
              <TextField control={form.control} name="date" label={t("columns.date") || "Date"} placeholder="YYYY-MM-DD" required type="date" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="hours" label={t("columns.hours") || "Hours"} placeholder="e.g. 4h30m" required icon={Clock} />
                <TextField control={form.control} name="rateHr" label={t("columns.rate") || "Rate/Hr"} placeholder="e.g. ₪" required icon={DollarSign} />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
