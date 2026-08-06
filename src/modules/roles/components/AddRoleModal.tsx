"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { RoleFormFields, type RoleFormValues } from "./RoleFormFields";
import { useFormPermissions } from "../hooks/useRoles";
import type { RolePayload } from "../types/roles.types";

const getAddRoleSchema = (tCommon: any, requireCompany: boolean) =>
  z.object({
    name: z.string().min(2, tCommon("validation.required")),
    description: z.string().optional().or(z.literal("")),
    company: requireCompany
      ? z.string().min(1, tCommon("validation.required"))
      : z.string().optional().or(z.literal("")),
  });

type FormValues = z.infer<ReturnType<typeof getAddRoleSchema>> & RoleFormValues;

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RolePayload) => void;
  isSubmitting?: boolean;
}

export default function AddRoleModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: AddRoleModalProps) {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const { data: permissionsData, isLoading: permissionsLoading } = useFormPermissions();
  const { data: companiesData } = useCompanies({ per_page: 100 });

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const companies: any[] = Array.isArray(companiesData?.data?.data)
    ? companiesData.data.data
    : Array.isArray(companiesData?.data)
      ? companiesData.data
      : [];

  const companyOptions = companies
    .map((c: any) => ({ value: String(c.id ?? ""), label: c.name || c.domain || String(c.id) }))
    .filter((o) => o.value !== "");

  const form = useForm<FormValues>({
    resolver: zodResolver(getAddRoleSchema(tCommon, isSuperAdmin)) as any,
    mode: "onSubmit",
    defaultValues: { name: "", description: "", company: "" },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: "", description: "", company: "" });
      setSelectedPermissions([]);
    }
  }, [isOpen, form]);

  const handleFormSubmit = (data: FormValues) => {
    const payload: RolePayload = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      permissions: selectedPermissions,
    };

    // A company admin's roles are scoped server-side from the token; only a
    // super admin has to say which company the role belongs to.
    if (isSuperAdmin && data.company) payload.company_id = Number(data.company);
    else if (!isSuperAdmin && user?.company_id) payload.company_id = user.company_id;

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("addRole")}
      mode="add"
      formId="add-role-form"
      size="xl"
      isLoading={isSubmitting}
    >
      <div className="flex flex-col w-full">
        <Form {...form}>
          <form id="add-role-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
            <RoleFormFields
              control={form.control}
              showCompany={isSuperAdmin}
              companyOptions={companyOptions}
              permissions={permissionsData?.permissions ?? []}
              permissionsLoading={permissionsLoading}
              selectedPermissions={selectedPermissions}
              onPermissionsChange={setSelectedPermissions}
            />
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
