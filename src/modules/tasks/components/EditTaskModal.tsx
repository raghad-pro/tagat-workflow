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
import { useTranslations } from "next-intl";

const editTaskSchema = z.object({
  company: z.string().optional(),
  project: z.string().min(1, "Project is required"),
  employee: z.string().min(1, "Employee is required"),
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

type FormValues = z.infer<typeof editTaskSchema>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: number, data: any) => void;
  data: Task | null;
}

export default function EditTaskModal({ isOpen, onClose, onUpdate, data }: EditTaskModalProps) {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");
  
  const form = useForm<FormValues>({
    resolver: zodResolver(editTaskSchema),
    mode: "onTouched",
    defaultValues: { company: "", project: "", employee: "", title: "", start: "", end: "", duration: "", notes: "" },
  });

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  useEffect(() => {
    if (data && isOpen) {
      // In a real app, map the Start/End date strings back to HH:mm for the time input
      // For now we map whatever we can from the mock data
      form.reset({
        title: data.title || "",
        company: "company-1",
        project: "proj-1",
        employee: "emp-1",
        start: "08:00", // example default for time fields
        end: "10:00",
        duration: "2.00",
        notes: "",
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
    if (onUpdate) onUpdate(data.id, formData);
    onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={tCommon("edit") + " Task"}
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
                  <SelectField control={form.control} name="company" label={t("columns.company") || "Company"} options={[{value:"company-1", label:"Company 1"}]} required placeholder="Select company" />
                )}
                <SelectField control={form.control} name="project" label={t("columns.project") || "Project"} options={[{value:"proj-1", label:"Project 1"}]} required placeholder="Select project" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="employee" label={t("columns.employee") || "Employee"} options={[{value:"emp-1", label:"Employee 1"}]} required placeholder="Select employee" />
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
