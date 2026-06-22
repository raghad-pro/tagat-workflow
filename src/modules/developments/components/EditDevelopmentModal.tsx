"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { FileText, User, Briefcase, CreditCard } from "lucide-react";
import type { Development } from "../types/developments.types";

const editDevelopmentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  project: z.string().min(1, "Project is required"),
  client: z.string().min(2, "Client is required"),
  budget: z.string().min(1, "Budget is required"),
  cost: z.string().min(1, "Cost is required"),
  status: z.enum(["active", "completed", "pending", "paused"]).optional(),
});

type FormValues = z.infer<typeof editDevelopmentSchema>;

export default function EditDevelopmentModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean, onClose: () => void, onUpdate: (id: number, data: any) => void, data: Development | null }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(editDevelopmentSchema),
    mode: "onTouched",
    defaultValues: { title: "", project: "", client: "", budget: "", cost: "", status: "active" },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        title: data.title || "",
        project: data.project || "",
        client: data.client || "",
        budget: data.budget || "",
        cost: data.cost || "",
        status: data.status as any || "active",
      });
    }
  }, [data, isOpen, form]);

  const handleFormSubmit = (formData: FormValues) => {
    if (!data) return;
    onUpdate(data.id, formData);
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Edit Development"
      mode="edit"
      formId="edit-development-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-development-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="title" label="Title" placeholder="Enter title" required icon={FileText} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="project" label="Project" options={[{value:"Project 1", label:"Project 1"}, {value:data.project, label:data.project}]} required placeholder="Select project" />
                <TextField control={form.control} name="client" label="Client" placeholder="Enter client" required icon={User} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="budget" label="Budget" placeholder="e.g. ,000" required icon={Briefcase} />
                <TextField control={form.control} name="cost" label="Cost" placeholder="e.g. ,000" required icon={CreditCard} />
              </div>
              <SelectField control={form.control} name="status" label="Status" options={[{value:"active", label:"Active"}, {value:"completed", label:"Completed"}, {value:"pending", label:"Pending"}, {value:"paused", label:"Paused"}]} required placeholder="Select status" />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
