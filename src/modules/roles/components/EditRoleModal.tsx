"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";
import type { Role } from "../types/roles.types";

const editRoleSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().min(1, "Description is required"),
});

type FormValues = z.infer<typeof editRoleSchema>;

export default function EditRoleModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean, onClose: () => void, onUpdate: (id: number, data: any) => void, data: Role | null }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(editRoleSchema),
    mode: "onTouched",
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (data && isOpen) {
      form.reset({
        name: data.name || "",
        description: data.description || "",
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
      title="Edit Role"
      mode="edit"
      formId="edit-role-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-role-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
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
