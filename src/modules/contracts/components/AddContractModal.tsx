"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { User, FileText, Briefcase, Building } from "lucide-react";

const addContractSchema = z.object({
  customerName: z.string().min(2, "Customer Name is required"),
  initial: z.string().min(1, "Initial value is required"),
  title: z.string().min(2, "Title is required"),
  project: z.string().min(1, "Project is required"),
  company: z.string().min(1, "Company is required"),
});

type FormValues = z.infer<typeof addContractSchema>;

export default function AddContractModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isPending = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
  isPending?: boolean;
}) {
  const t = useTranslations("contract");
  const form = useForm<FormValues>({
    resolver: zodResolver(addContractSchema),
    mode: "onSubmit",
    defaultValues: { customerName: "", initial: "", title: "", project: "", company: "" },
  });

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
      title={t("add") || "Add Contract"}
      mode="add"
      formId="add-contract-form"
      size="lg"
      isLoading={isPending}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-contract-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="customerName" label={t("columns.customerName") || "Customer Name"} placeholder="Enter customer name" required icon={User} />
                <TextField control={form.control} name="initial" label="Initial Value" placeholder="e.g. $10,000" required icon={FileText} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="title" label={t("columns.title") || "Contract Title"} placeholder="Enter contract title" required icon={Briefcase} />
                <TextField control={form.control} name="project" label={t("columns.project") || "Project"} placeholder="Enter project name" required icon={Briefcase} />
              </div>
              <TextField control={form.control} name="company" label={t("columns.company") || "Company"} placeholder="Enter company name" required icon={Building} />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
