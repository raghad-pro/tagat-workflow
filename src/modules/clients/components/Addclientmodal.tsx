"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { User, Mail, Lock } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { ActionModal } from "@/components/molecules/ActionModal";
import { TextField, PasswordField, SelectField } from "@/components/molecules/FormFields";
import { Form } from "@/components/ui/form";
import type { AddClientFormValues } from "@/modules/clients/types/clients.types";

// ─── Schema ────────────────────────────────────────────────────────────────────
const getSchema = (tCommon: any) => z.object({
  name:       z.string().min(2, tCommon("validation.minLength", { min: 2 })),
  email:      z.string().min(1, tCommon("validation.required")).email(tCommon("validation.email")),
  password:   z.string().min(8, tCommon("validation.minLength", { min: 8 })),
  company_id: z.string().optional(),
});

type FormValues = z.infer<ReturnType<typeof getSchema>>;

// ─── Props ─────────────────────────────────────────────────────────────────────
interface AddClientModalProps {
  isOpen:        boolean;
  onClose:       () => void;
  onAdd:         (data: AddClientFormValues) => void;
  isPending?:    boolean;
  isSuperAdmin?: boolean;
  companies?:    Array<{ id: number; name: string }>;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function AddClientModal({
  isOpen,
  onClose,
  onAdd,
  isPending    = false,
  isSuperAdmin = false,
  companies    = [],
}: AddClientModalProps) {
  const tClient = useTranslations("client");
  const tForm = useTranslations("form");
  const tCommon = useTranslations("common");

  const form = useForm<FormValues>({
    resolver:      zodResolver(getSchema(tCommon)),
    mode:          "onTouched",
    defaultValues: { name: "", email: "", password: "", company_id: undefined },
  });

  const onSubmit = (data: FormValues) => {
    const validCompanyId = data.company_id ? parseInt(data.company_id, 10) : undefined;
    onAdd({
      name:     data.name,
      email:    data.email,
      password: data.password,
      ...(isSuperAdmin && validCompanyId != null ? { company_id: validCompanyId } : {}),
    });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={handleClose}
      title={tClient("addModalTitle")}
      mode="add"
      formId="add-client-form"
      size="md"
      saveLabel={tClient("saveClient")}
      isLoading={isPending}
    >
      <div className="flex flex-col gap-5">

        {/* Section header */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "var(--color-bg)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--color-bg-primary-200)" }}
          >
            <User size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <div>
            <Text size="sm" weight="bold" tag="p">{tForm("basicInfo")}</Text>
            <Text size="sm" color="gray-200" tag="p">{tForm("enterDetails")}</Text>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form
            id="add-client-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                control={form.control}
                name="name"
                label={tForm("clientName")}
                placeholder={tForm("placeholders.clientName")}
                required
                icon={User}
              />
              <TextField
                control={form.control}
                name="email"
                label={tForm("emailAddress")}
                placeholder={tForm("placeholders.email")}
                type="email"
                required
                icon={Mail}
              />
            </div>

            <PasswordField
              control={form.control}
              name="password"
              label={tForm("password")}
              placeholder={tForm("placeholders.password")}
              required
              icon={Lock}
            />

            {isSuperAdmin && companies.length > 0 && (
              <SelectField
                control={form.control}
                name="company_id"
                label={tForm("companyOptional")}
                placeholder={`— ${tCommon("selectCompany")} —`}
                options={companies.map(c => ({ value: c.id.toString(), label: c.name }))}
              />
            )}
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}