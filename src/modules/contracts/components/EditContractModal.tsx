"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, FileText, Briefcase } from "lucide-react";
import type { Contract } from "../types/contracts.types";

const editContractSchema = z.object({
  customerName: z.string().min(2, "Customer Name is required"),
  initial: z.string().min(1, "Initial value is required"),
  title: z.string().min(2, "Title is required"),
  project: z.string().min(1, "Project is required"),
  company: z.string().min(1, "Company is required"),
});

type FormValues = z.infer<typeof editContractSchema>;

export default function EditContractModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean, onClose: () => void, onUpdate: (id: number, data: any) => void, data: Contract | null }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(editContractSchema),
    mode: "onSubmit",
    defaultValues: { customerName: "", initial: "", title: "", project: "", company: "" },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        customerName: data.customerName || "",
        initial: data.initial || "",
        title: data.title || "",
        project: "proj-1",
        company: "company-1",
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
      title="Edit Contract"
      mode="edit"
      formId="edit-contract-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-contract-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="customerName" label="Customer Name" placeholder="Enter customer name" required icon={User} />
                <TextField control={form.control} name="initial" label="Initial Value" placeholder="e.g. ,000" required icon={FileText} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="title" label="Contract Title" placeholder="Enter title" required icon={Briefcase} />
                <SelectField control={form.control} name="project" label="Project" options={[{value:"proj-1", label:"Project 1"}]} required placeholder="Select project" />
              </div>
              <SelectField control={form.control} name="company" label="Company" options={[{value:"company-1", label:"Company 1"}]} required placeholder="Select company" />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
