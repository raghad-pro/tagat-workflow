"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { FileText, User, Briefcase, CreditCard } from "lucide-react";

const addDevelopmentSchema = z.object({
  title: z.string().min(2, "Title is required"),
  project: z.string().min(1, "Project is required"),
  client: z.string().min(2, "Client is required"),
  budget: z.string().min(1, "Budget is required"),
  cost: z.string().min(1, "Cost is required"),
});

type FormValues = z.infer<typeof addDevelopmentSchema>;

export default function AddDevelopmentModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(addDevelopmentSchema),
    mode: "onTouched",
    defaultValues: { title: "", project: "", client: "", budget: "", cost: "" },
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
      title="Add Development"
      mode="add"
      formId="add-development-form"
      size="lg"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-development-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="title" label="Title" placeholder="Enter title" required icon={FileText} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField control={form.control} name="project" label="Project" options={[{value:"Project 1", label:"Project 1"}]} required placeholder="Select project" />
                <TextField control={form.control} name="client" label="Client" placeholder="Enter client" required icon={User} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField control={form.control} name="budget" label="Budget" placeholder="e.g. ,000" required icon={Briefcase} />
                <TextField control={form.control} name="cost" label="Cost" placeholder="e.g. ,000" required icon={CreditCard} />
              </div>
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
