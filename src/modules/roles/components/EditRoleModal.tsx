"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, TextAreaField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Role } from "../types/roles.types";

const getEditRoleSchema = (tCommon: any) => z.object({
  name: z.string().min(2, tCommon("validation.required")),
  description: z.string().min(1, tCommon("validation.required")),
});

type FormValues = z.infer<ReturnType<typeof getEditRoleSchema>>;

export default function EditRoleModal({ isOpen, onClose, onUpdate, data }: { isOpen: boolean, onClose: () => void, onUpdate: (id: number, data: any) => void, data: Role | null }) {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const form = useForm<FormValues>({
    resolver: zodResolver(getEditRoleSchema(tCommon)),
    mode: "onSubmit",
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
      title={t("editRole") || "Edit Role"}
      mode="edit"
      formId="edit-role-form"
      size="md"
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="edit-role-form" onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
            <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
              <TextField control={form.control} name="name" label={t("columns.name") || "Role Name"} placeholder={t("placeholders.name") || "Enter role name"} required icon={ShieldCheck} />
              <TextAreaField control={form.control} name="description" label={t("columns.description") || "Description"} placeholder={t("placeholders.description") || "Enter description..."} rows={4} />
            </div>
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
