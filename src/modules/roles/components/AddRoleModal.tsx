"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";

const addRoleSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof addRoleSchema>;

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function AddRoleModal({ isOpen, onClose, onSubmit }: AddRoleModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(addRoleSchema),
    mode: "onTouched",
    defaultValues: { name: "", description: "" },
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
      title="Add Role"
      mode="add"
      formId="add-role-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-role-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="name" label="Role Name" placeholder="Enter role name" required icon={ShieldCheck} />
              <TextAreaField control={form.control} name="description" label="Description" placeholder="Enter description..." rows={4} />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
