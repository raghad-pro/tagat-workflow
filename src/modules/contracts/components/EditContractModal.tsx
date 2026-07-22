"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, FileText, Briefcase, Building } from "lucide-react";
import type { Contract } from "../types/contracts.types";

const editContractSchema = z.object({
  customerName: z.string().min(2, "Customer Name is required"),
  initial: z.string().min(1, "Initial value is required"),
  title: z.string().min(2, "Title is required"),
  project: z.string().min(1, "Project is required"),
  company: z.string().min(1, "Company is required"),
});

type FormValues = z.infer<typeof editContractSchema>;

export default function EditContractModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  data,
  isPending = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdate: (id: number, data: any) => void; 
  data: Contract | null;
  isPending?: boolean;
}) {
  const t = useTranslations("contract");
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
        project: data.project || "",
        company: data.company || "",
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
      title={t("editContractTitle") || "Edit Contract"}
      mode="edit"
      formId="edit-contract-form"
      size="lg"
      isLoading={isPending}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-contract-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="customerName" label={t("columns.customerName") || "Customer Name"} placeholder="Enter customer name" required icon={User} />
                <TextField control={form.control} name="initial" label="Initial Value" placeholder="e.g. $10,000" required icon={FileText} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="title" label={t("columns.title") || "Contract Title"} placeholder="Enter title" required icon={Briefcase} />
                <TextField control={form.control} name="project" label={t("columns.project") || "Project"} placeholder="Enter project" required icon={Briefcase} />
              </div>
              <TextField control={form.control} name="company" label={t("columns.company") || "Company"} placeholder="Enter company" required icon={Building} />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
