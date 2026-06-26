"use client";

import React, { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { Briefcase, Clock } from "lucide-react";
import type { Task } from "../types/tasks.types";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { useTasksData, useProjectEmployees } from "../hooks/useTasks";
import { useTranslations } from "next-intl";

const getTaskSchema = (t: any, isCompanyAdmin: boolean) => z.object({
  company: isCompanyAdmin ? z.string().optional() : z.string().min(1, t("companyRequired") || "Company is required"),
  project: z.string().min(1, t("projectRequired")).refine(val => val !== "no-data", t("projectRequired")),
  employee: z.string().min(1, t("employeeRequired")).refine(val => val !== "no-data", t("employeeRequired")),
  title: z.string().min(2, "Title is required"),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  duration: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.start || !data.end) return;

  const [startH, startM] = data.start.split(":").map(Number);
  const [endH, endM] = data.end.split(":").map(Number);
  
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal >= endTotal) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Start time must be before end time",
      path: ["start"],
    });
  }

  const durationHours = (endTotal - startTotal) / 60;
  if (durationHours > 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Task duration cannot exceed 4 hours",
      path: ["end"],
    });
  }
});

type FormValues = z.infer<ReturnType<typeof getTaskSchema>>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: number, data: any, setError: any) => void;
  data: Task | null;
}

export default function EditTaskModal({ isOpen, onClose, onUpdate, data }: EditTaskModalProps) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const form = useForm<FormValues>({
    resolver: zodResolver(getTaskSchema(t, isCompanyAdmin)),
    mode: "onTouched",
    defaultValues: { company: "", project: "", employee: "", title: "", start: "", end: "", duration: "", notes: "" },
  });

  const selectedCompanyId = useWatch({ control: form.control, name: "company" });

  // Fetch Companies for Super Admin
  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companies = companiesResponse?.data?.data || [];
  const companyOptions = companies.map((c: any) => ({ value: c.id.toString(), label: c.name }));

  // Fetch Projects and Employees based on selected company
  const { data: tasksDataResponse, isLoading: isLoadingProjects } = useTasksData(isCompanyAdmin ? undefined : (selectedCompanyId ? Number(selectedCompanyId) : undefined));
  
  const rawProjects = tasksDataResponse?.projects || tasksDataResponse?.data?.projects || [];
  let projectOptions = rawProjects.map((p: any) => ({
    value: p.id.toString(),
    label: p.title || p.name
  }));
  
  if (projectOptions.length === 0) {
    projectOptions = [{ value: "no-data", label: t("noProjects") || "No projects" }];
  }

  const selectedProjectId = useWatch({ control: form.control, name: "project" });
  const { data: projectEmployeesResponse, isLoading: isLoadingEmployees } = useProjectEmployees(
    selectedProjectId && selectedProjectId !== "no-data" ? Number(selectedProjectId) : null
  );
  
  const rawEmployees = projectEmployeesResponse?.employees || projectEmployeesResponse?.data?.employees || [];
  let employeeOptions = rawEmployees.map((e: any) => ({
    value: e.id.toString(),
    label: e.name || e.user?.name
  }));

  if (employeeOptions.length === 0) {
    employeeOptions = [{ value: "no-data", label: t("noEmployees") || "No employees" }];
  }

  const projLen = projectOptions.length;
  const projFirstVal = projectOptions[0]?.value;
  useEffect(() => {
    if (projLen === 1 && projFirstVal === "no-data") {
      if (form.getValues("project") !== "no-data") form.setValue("project", "no-data");
    } else if (form.getValues("project") === "no-data") {
      form.setValue("project", "");
    }
  }, [projLen, projFirstVal, form]);

  const empLen = employeeOptions.length;
  const empFirstVal = employeeOptions[0]?.value;
  useEffect(() => {
    if (empLen === 1 && empFirstVal === "no-data") {
      if (form.getValues("employee") !== "no-data") form.setValue("employee", "no-data");
    } else if (form.getValues("employee") === "no-data") {
      form.setValue("employee", "");
    }
  }, [empLen, empFirstVal, form]);

  useEffect(() => {
    if (data && isOpen) {
      const companyVal = data.company_id?.toString() || (typeof data.company === 'object' ? (data.company as any)?.id?.toString() : data.company);
      const projectVal = data.project_id?.toString() || (typeof data.project === 'object' ? (data.project as any)?.id?.toString() : data.project);
      const empVal = data.assigned_to?.toString() || (typeof data.employee === 'object' ? (data.employee as any)?.id?.toString() : data.employee);

      form.reset({
        company: companyVal || "",
        project: projectVal || "",
        employee: empVal || "",
        title: data.title,
        start: data.start_time || data.start || "00:00",
        end: data.end_time || data.end || "00:00",
        duration: data.duration || "0",
        notes: data.description || "Some existing notes...",
      });
    }
  }, [data, isOpen, form]);

  // Watch start and end times to calculate duration dynamically
  const startVal = useWatch({ control: form.control, name: "start" });
  const endVal = useWatch({ control: form.control, name: "end" });

  useEffect(() => {
    if (startVal && endVal) {
      const [startH, startM] = startVal.split(":").map(Number);
      const [endH, endM] = endVal.split(":").map(Number);
      if (!isNaN(startH) && !isNaN(endH)) {
        const diff = (endH * 60 + endM) - (startH * 60 + startM);
        if (diff > 0) {
          const hours = (diff / 60).toFixed(2);
          form.setValue("duration", hours);
        } else {
          form.setValue("duration", "0");
        }
      }
    }
  }, [startVal, endVal, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    if (onUpdate) {
      onUpdate(data.id, formData, form.setError);
    } else {
      onClose();
    }
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={t("editTask") || "Edit Task"}
      mode="edit"
      formId="edit-task-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-task-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCompanyAdmin && (
                  <SelectField control={form.control} name="company" label={t("columns.company") || "Company"} options={companyOptions} required placeholder="Select company" />
                )}
                <SelectField control={form.control} name="project" label={t("columns.project") || "Project"} options={projectOptions} required placeholder="Select project" disabled={(!isCompanyAdmin && !selectedCompanyId) || (projectOptions.length === 1 && projectOptions[0].value === "no-data")} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="employee" label={t("columns.employee") || "Employee"} options={employeeOptions} required placeholder="Select employee" disabled={!selectedProjectId || selectedProjectId === "no-data" || (employeeOptions.length === 1 && employeeOptions[0].value === "no-data")} />
                <TextField control={form.control} name="title" label={t("columns.title") || "Title"} placeholder="Enter task title" required icon={Briefcase} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="start" label={t("columns.start") || "Start Time"} type="time" placeholder="00:00" required icon={Clock} />
                <TextField control={form.control} name="end" label={t("columns.end") || "End Time"} type="time" placeholder="00:00" required icon={Clock} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="duration" label={t("columns.duration") || "Duration (hours)"} placeholder="0.00" disabled />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <TextAreaField control={form.control} name="notes" label="Notes" placeholder="Enter any notes here..." />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
