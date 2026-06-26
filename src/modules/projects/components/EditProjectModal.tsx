"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Briefcase, DollarSign, Building, Activity, FileText } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { Project } from "../types/projects.types";
import { useAuth } from "@/providers/AuthProvider";

import { useCompanies } from "@/modules/companies/hooks/useCompanies";

const getProjectSchema = (isCompanyAdmin: boolean) => z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  budget: z.string().min(1, "Budget is required"),
  company: isCompanyAdmin ? z.string().optional() : z.string().min(1, "Company is required"),
  status: z.string().min(1, "Select status"),
  notes: z.string().optional(),
});

type FormValues = z.infer<ReturnType<typeof getProjectSchema>>;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On Hold" },
];

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  data: Project | null;
}

export default function EditProjectModal({ isOpen, onClose, onUpdate, data }: EditProjectModalProps) {
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const form = useForm<FormValues>({
    resolver: zodResolver(getProjectSchema(isCompanyAdmin)),
    mode: "onTouched",
    defaultValues: { title: "", budget: "", company: "", status: "", notes: "" },
  });

  const { data: companiesResponse } = useCompanies({ page: 1, per_page: 100 });
  const companies = companiesResponse?.data?.data || [];
  const companyOptions = companies.map((c: any) => ({
    value: c.id.toString(),
    label: c.name || c.company_name
  }));

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        title: data.title || "",
        budget: data.budget || "",
        company: data.company_id?.toString() || (typeof data.company === 'object' ? (data.company as any)?.id?.toString() : data.company?.toString()) || "",
        status: data.status?.toLowerCase() || "",
        notes: (data as any).description || (data as any).notes || "",
      });
    }
  }, [data, isOpen, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate(data.id, formData);
    onClose();
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Project"
      mode="edit"
      formId="edit-project-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-project-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5" style={{ border: "1px solid var(--color-border-form)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="title" label="Project Title" placeholder="Enter project title" required icon={Briefcase} />
                <TextField control={form.control} name="budget" label="Budget" placeholder="e.g. $5,000" required icon={DollarSign} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isCompanyAdmin && (
                  <SelectField control={form.control} name="company" label="Company" options={companyOptions} required placeholder="Select company" />
                )}
                <SelectField control={form.control} name="status" label="Status" options={STATUS_OPTIONS} required placeholder="Select status" />
              </div>
              <TextAreaField control={form.control} name="notes" label="Notes" placeholder="Additional details..." rows={4} />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
