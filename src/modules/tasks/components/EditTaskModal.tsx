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
import { useProjectEmployees } from "../hooks/useTasks";
import { useProjects } from "@/modules/projects/hooks/useProjects";
import { useTranslations } from "next-intl";

const getTaskSchema = (t: any, isSuperAdmin: boolean, isEmployee: boolean) =>
  z
    .object({
      company: !isSuperAdmin
        ? z.string().optional()
        : z.string().min(1, t("companyRequired") || "Company is required"),
      project: z
        .string()
        .min(1, t("projectRequired"))
        .refine((val) => val !== "no-data", t("projectRequired")),
      employee: isEmployee
        ? z.string().optional()
        : z
          .string()
          .min(1, t("employeeRequired"))
          .refine((val) => val !== "no-data", t("employeeRequired")),
      title: z.string().min(2, "Title is required"),
      start: z.string().min(1, "Start time is required"),
      end: z.string().min(1, "End time is required"),
      duration: z.string().optional(),
      notes: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.start || !data.end) return;
      const [startH, startM] = data.start.split(":").map(Number);
      const [endH, endM] = data.end.split(":").map(Number);
      let startTotal = startH * 60 + startM;
      let endTotal = endH * 60 + endM;

      
      let durationHours = (endTotal - startTotal) / 60;
      if (durationHours < 0) {
        durationHours += 24;
      }
      
      if (durationHours > 4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("durationExceedsLimit") || "Task duration cannot exceed 4 hours",
          path: ["duration"],
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof getTaskSchema>>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: number, data: any, setError: any) => void;
  data: Task | null;
  isLoading?: boolean;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  onUpdate,
  data,
  isLoading,
}: EditTaskModalProps) {
  const t = useTranslations("task");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const isEmployee = user?.role === "employee";

  const form = useForm<FormValues>({
    resolver: zodResolver(getTaskSchema(t, isSuperAdmin, isEmployee)),
    mode: "onTouched",
    defaultValues: {
      company: "",
      project: "",
      employee: "",
      title: "",
      start: "",
      end: "",
      duration: "",
      notes: "",
    },
  });

  const selectedCompanyId = useWatch({ control: form.control, name: "company" });
  const selectedProjectId = useWatch({ control: form.control, name: "project" });

  // ── Companies (super_admin only) ─────────────────────────────────────────────
  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companyOptions = (companiesResponse?.data?.data ?? []).map((c: any) => ({
    value: c.id.toString(),
    label: c.name,
  }));

  const isCompanyAdmin = user?.role === "company";
  const companyIdForQuery = isCompanyAdmin || isEmployee
    ? ((user as any)?.company_id?.toString() ?? null)
    : selectedCompanyId || null;

  // ── Projects via useProjects ──────────────────────────────────────────────────
  const { data: projectsResponse } = useProjects({ page: 1, per_page: 1000 });
  const allProjects = projectsResponse?.data?.data ?? projectsResponse?.data ?? [];
  
  let rawProjects = companyIdForQuery
    ? allProjects.filter((p: any) => p.company_id == companyIdForQuery || p.company?.id == companyIdForQuery)
    : (isEmployee ? allProjects : []);

  if (isEmployee) {
    const empId = user?.id?.toString();
    rawProjects = rawProjects.filter((p: any) => {
      const users = p.users || p.employees || [];
      // If the backend already filtered it, this is just a safe guard
      if (users.length === 0) return true; // assuming if no users array, backend handled it
      return users.some((u: any) => 
        u?.id?.toString() === empId || 
        u?.user_id?.toString() === empId ||
        (u?.user && u.user?.id?.toString() === empId)
      );
    });
  }

  let projectOptions = rawProjects.map((p: any) => ({
    value: p.id.toString(),
    label: p.title ?? p.name,
  }));
  
  if (companyIdForQuery && projectOptions.length === 0) {
    projectOptions = [{ value: "no-data", label: t("noProjects") || "No projects" }];
  }

  // ── Employees via useProjectEmployees (filtered by project) ─────────────────────────
  const projectIdForQuery = selectedProjectId && selectedProjectId !== "no-data" ? Number(selectedProjectId) : null;
  const { data: projectEmployeesResponse, isLoading: isEmployeesLoading } = useProjectEmployees(projectIdForQuery);
  
  let rawEmployees: any[] = [];
  const payload = projectEmployeesResponse?.data;
  if (Array.isArray(payload)) {
    rawEmployees = payload;
  } else if (payload?.employees && Array.isArray(payload.employees)) {
    rawEmployees = payload.employees;
  } else if (payload?.data && Array.isArray(payload.data)) {
    rawEmployees = payload.data;
  }

  if (rawEmployees.length === 0 && selectedProjectId && selectedProjectId !== "no-data") {
    const selectedProjectObj = allProjects.find((p: any) => p.id?.toString() === selectedProjectId);
    if (selectedProjectObj) {
      if (Array.isArray(selectedProjectObj.employees) && selectedProjectObj.employees.length > 0) {
        rawEmployees = selectedProjectObj.employees;
      } else if (Array.isArray(selectedProjectObj.users) && selectedProjectObj.users.length > 0) {
        rawEmployees = selectedProjectObj.users;
      } else if (typeof selectedProjectObj.employees === "object" && selectedProjectObj.employees !== null) {
        rawEmployees = [selectedProjectObj.employees];
      } else if (typeof selectedProjectObj.users === "object" && selectedProjectObj.users !== null) {
        rawEmployees = [selectedProjectObj.users];
      }
    }
  }

  let employeeOptions = rawEmployees.map((e: any) => {
    if (typeof e !== "object") {
      return { value: String(e), label: String(e) };
    }
    const name = e.name ?? e.employee_name ?? e.user?.name ?? (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim() : null) ?? e.employeeName ?? String(e.id ?? "");
    return {
      value: String(e.user_id ?? e.id ?? ""),
      label: name,
    };
  }).filter((opt) => opt.value !== "");
  
  if (projectIdForQuery && employeeOptions.length === 0 && !isEmployeesLoading) {
    employeeOptions = [{ value: "no-data", label: t("noEmployees") || "No employees" }];
  }

  // ── Populate form when task data loads ──────────────────────────────────────
  useEffect(() => {
    if (!data || !isOpen) return;

    const companyVal =
      data.company_id?.toString() ??
      (typeof data.company === "object" ? (data.company as any)?.id?.toString() : data.company) ??
      "";

    const projectVal =
      data.project_id?.toString() ??
      (typeof data.project === "object"
        ? (data.project as any)?.id?.toString()
        : data.project) ??
      "";

    const empVal =
      (typeof data.assigned_to === "object"
        ? (data.assigned_to as any)?.id?.toString()
        : data.assigned_to?.toString()) ??
      (typeof data.employee === "object"
        ? (data.employee as any)?.id?.toString()
        : data.employee?.toString()) ??
      "";

    const formatTime = (timeStr?: string) => {
      if (!timeStr) return "00:00";
      const englishStr = timeStr.replace(/[٠-٩]/g, w => '٠١٢٣٤٥٦٧٨٩'.indexOf(w).toString());
      const match24 = englishStr.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
      if (match24) return `${match24[1].padStart(2, '0')}:${match24[2]}`;
      const matchAMPM = englishStr.match(/(\d+):(\d+)(?::\d+)?\s*(AM|PM)/i);
      if (matchAMPM) {
        let [, h, m, modifier] = matchAMPM;
        let hours = parseInt(h, 10);
        if (hours === 12 && modifier.toUpperCase() === "AM") hours = 0;
        if (hours < 12 && modifier.toUpperCase() === "PM") hours += 12;
        return `${hours.toString().padStart(2, "0")}:${m}`;
      }
      return "00:00";
    };

    form.reset({
      company: companyVal,
      project: projectVal,
      employee: empVal,
      title: data.title ?? "",
      start: formatTime(data.start_time ?? data.start),
      end: formatTime(data.end_time ?? data.end),
      duration: data.duration ?? "0",
      notes: data.description ?? "",
    });
  }, [data, isOpen, form]);

  // ── Auto-select no-data options ───────────────────────────────────────────────
  useEffect(() => {
    if (projectOptions.length === 1 && projectOptions[0].value === "no-data") {
      if (form.getValues("project") !== "no-data") form.setValue("project", "no-data");
    }
  }, [projectOptions.length, projectOptions[0]?.value, form]);

  useEffect(() => {
    if (employeeOptions.length === 1 && employeeOptions[0].value === "no-data") {
      if (form.getValues("employee") !== "no-data") form.setValue("employee", "no-data");
    }
  }, [employeeOptions.length, employeeOptions[0]?.value, form]);

  // ── Duration auto-calc ───────────────────────────────────────────────────────
  const startVal = useWatch({ control: form.control, name: "start" });
  const endVal = useWatch({ control: form.control, name: "end" });

  useEffect(() => {
    if (!startVal || !endVal) return;
    const parseTime = (timeStr: string) => {
      const englishStr = timeStr.replace(/[٠-٩]/g, w => '٠١٢٣٤٥٦٧٨٩'.indexOf(w).toString());
      const match = englishStr.match(/(\d+):(\d+)/);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      let m = parseInt(match[2], 10);
      if (englishStr.toLowerCase().includes("pm") && h < 12) h += 12;
      if (englishStr.toLowerCase().includes("am") && h === 12) h = 0;
      return { h, m };
    };

    const startT = parseTime(startVal);
    const endT = parseTime(endVal);
    if (!startT || !endT) return;
    
    let diff = endT.h * 60 + endT.m - (startT.h * 60 + startT.m);
    if (diff < 0) {
      diff += 24 * 60;
    }
    form.setValue("duration", diff > 0 ? (diff / 60).toFixed(2) : "0", { shouldValidate: true });
    form.trigger(["start", "end"]);
  }, [startVal, endVal, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate?.(data.id, formData, form.setError);
  };

  if (!isOpen || !data) return null;

  const projectDisabled =
    (isSuperAdmin && !selectedCompanyId) ||
    (projectOptions.length === 1 && projectOptions[0].value === "no-data");

  const employeeDisabled =
    !selectedProjectId ||
    selectedProjectId === "no-data" ||
    (employeeOptions.length === 1 && employeeOptions[0].value === "no-data") ||
    isEmployeesLoading;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("editTask") || "Edit Task"}
      mode="edit"
      formId="edit-task-form"
      size="lg"
      isLoading={isLoading}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form
            id="edit-task-form"
            onSubmit={form.handleSubmit(handleFormSubmit)}
            className="flex flex-col gap-5"
          >
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isSuperAdmin && (
                  <SelectField
                    control={form.control}
                    name="company"
                    label={t("columns.company") || "Company"}
                    options={companyOptions}
                    required
                    placeholder={t("selectCompany") || "Select company"}
                  />
                )}
                <SelectField
                  control={form.control}
                  name="project"
                  label={t("columns.project") || "Project"}
                  options={projectOptions}
                  required
                  placeholder={t("selectProject") || "Select project"}
                  disabled={projectDisabled}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isEmployee && (
                  <SelectField
                    control={form.control}
                    name="employee"
                    label={t("columns.employee") || "Employee"}
                    options={employeeOptions}
                    required
                    placeholder={t("selectEmployee") || "Select employee"}
                    disabled={employeeDisabled}
                  />
                )}
                <TextField
                  control={form.control}
                  name="title"
                  label={t("columns.title") || "Title"}
                  placeholder="Enter task title"
                  required
                  icon={Briefcase}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  control={form.control}
                  name="start"
                  label={t("columns.start") || "Start Time"}
                  type="time"
                  placeholder="00:00"
                  required
                  icon={Clock}
                />
                <TextField
                  control={form.control}
                  name="end"
                  label={t("columns.end") || "End Time"}
                  type="time"
                  placeholder="00:00"
                  required
                  icon={Clock}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  control={form.control}
                  name="duration"
                  label={t("columns.duration") || "Duration (hours)"}
                  placeholder="0.00"
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <TextAreaField
                  control={form.control}
                  name="notes"
                  label="Notes"
                  placeholder="Enter any notes here..."
                />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}