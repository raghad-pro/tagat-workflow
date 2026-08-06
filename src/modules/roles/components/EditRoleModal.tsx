"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Form } from "@/components/ui/form";
import { Text } from "@/components/atoms/Text";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { RoleFormFields, type RoleFormValues } from "./RoleFormFields";
import { useFormPermissions, useRole } from "../hooks/useRoles";
import { isBaseRole, type Role, type RolePayload } from "../types/roles.types";

const getEditRoleSchema = (tCommon: any, requireCompany: boolean) =>
  z.object({
    name: z.string().min(2, tCommon("validation.required")),
    description: z.string().optional().or(z.literal("")),
    company: requireCompany
      ? z.string().min(1, tCommon("validation.required"))
      : z.string().optional().or(z.literal("")),
  });

type FormValues = z.infer<ReturnType<typeof getEditRoleSchema>> & RoleFormValues;

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: RolePayload) => void;
  data: Role | null;
  isSubmitting?: boolean;
}

export default function EditRoleModal({
  isOpen,
  onClose,
  onUpdate,
  data,
  isSubmitting,
}: EditRoleModalProps) {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const readOnly = isBaseRole(data?.id);

  const { data: permissionsData, isLoading: permissionsLoading } = useFormPermissions();
  const { data: companiesData } = useCompanies({ per_page: 100 });

  /**
   * The list endpoint already embeds `permissions[]`, but it is paginated and
   * can be stale; refetching the single role guarantees the matrix starts from
   * what the server currently holds. Getting this wrong is destructive — the
   * update endpoint replaces the whole set, so a short prefill would silently
   * revoke the permissions it failed to load.
   */
  const { data: fresh, isLoading: roleLoading } = useRole(isOpen ? data?.id : null);
  const role = fresh ?? data;

  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [prefilled, setPrefilled] = useState<number | null>(null);

  const companies: any[] = Array.isArray(companiesData?.data?.data)
    ? companiesData.data.data
    : Array.isArray(companiesData?.data)
      ? companiesData.data
      : [];

  const companyOptions = companies
    .map((c: any) => ({ value: String(c.id ?? ""), label: c.name || c.domain || String(c.id) }))
    .filter((o) => o.value !== "");

  const form = useForm<FormValues>({
    resolver: zodResolver(getEditRoleSchema(tCommon, isSuperAdmin && !readOnly)) as any,
    mode: "onSubmit",
    defaultValues: { name: "", description: "", company: "" },
  });

  useEffect(() => {
    if (!isOpen) {
      setPrefilled(null);
      return;
    }
    // Wait for the authoritative role before seeding, and seed only once per
    // opening so typing is not overwritten by a background refetch.
    if (!role || roleLoading || prefilled === role.id) return;

    form.reset({
      name: role.name ?? "",
      description: role.description ?? "",
      company: role.company_id != null ? String(role.company_id) : "",
    });
    setSelectedPermissions((role.permissions ?? []).map((p) => p.id));
    setPrefilled(role.id);
  }, [isOpen, role, roleLoading, prefilled, form]);

  const handleFormSubmit = (values: FormValues) => {
    if (!role || readOnly) return;

    const payload: RolePayload = {
      name: values.name.trim(),
      description: values.description?.trim() || null,
      // Always the complete set: the endpoint replaces rather than merges.
      permissions: selectedPermissions,
    };

    if (isSuperAdmin && values.company) payload.company_id = Number(values.company);

    onUpdate(role.id, payload);
  };

  if (!isOpen || !data) return null;

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={readOnly ? t("viewRole") : t("editRole")}
      mode="edit"
      formId={readOnly ? undefined : "edit-role-form"}
      size="xl"
      isLoading={isSubmitting}
    >
      <div className="flex flex-col w-full gap-4">
        {readOnly && (
          <div className="rounded-xl p-3 border border-[var(--color-status-pending)] bg-[var(--color-status-pending-bg)]">
            <Text size="sm" className="ds-text-primary">{t("baseRoleHint")}</Text>
          </div>
        )}

        <Form {...form}>
          <form id="edit-role-form" onSubmit={form.handleSubmit(handleFormSubmit)}>
            <RoleFormFields
              control={form.control}
              showCompany={isSuperAdmin && !readOnly}
              companyOptions={companyOptions}
              permissions={permissionsData?.permissions ?? []}
              permissionsLoading={permissionsLoading || roleLoading}
              selectedPermissions={selectedPermissions}
              onPermissionsChange={setSelectedPermissions}
              readOnlyPermissions={readOnly}
            />
          </form>
        </Form>
      </div>
    </ActionModal>
  );
}
