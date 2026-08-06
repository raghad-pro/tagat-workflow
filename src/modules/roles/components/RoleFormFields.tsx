"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { TextField, TextAreaField, SelectField } from "@/components/molecules/FormFields";
import { Text } from "@/components/atoms/Text";
import { PermissionMatrix } from "./PermissionMatrix";
import type { Permission } from "../types/roles.types";

export interface RoleFormValues extends FieldValues {
  name: string;
  description: string;
  company: string;
}

interface RoleFormFieldsProps<T extends RoleFormValues> {
  control: Control<T>;
  /** Super admins must scope a role to a company — see the note below. */
  showCompany: boolean;
  companyOptions: { value: string; label: string }[];
  permissions: Permission[];
  permissionsLoading?: boolean;
  selectedPermissions: number[];
  onPermissionsChange: (ids: number[]) => void;
  /** Base roles are read-only; the matrix is shown but frozen. */
  readOnlyPermissions?: boolean;
}

/**
 * Shared body of the add and edit role modals — identical apart from their
 * default values, so keeping one copy avoids the two drifting apart.
 */
export function RoleFormFields<T extends RoleFormValues>({
  control,
  showCompany,
  companyOptions,
  permissions,
  permissionsLoading,
  selectedPermissions,
  onPermissionsChange,
  readOnlyPermissions,
}: RoleFormFieldsProps<T>) {
  const t = useTranslations("role");

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-5 flex flex-col gap-5 border ds-border-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            control={control}
            name={"name" as Path<T>}
            label={t("columns.name")}
            placeholder={t("placeholders.name")}
            required
            icon={ShieldCheck}
          />
          {showCompany && (
            <SelectField
              control={control}
              name={"company" as Path<T>}
              label={t("columns.company")}
              options={companyOptions}
              placeholder={t("placeholders.company")}
              required
            />
          )}
        </div>

        <TextAreaField
          control={control}
          name={"description" as Path<T>}
          label={t("columns.description")}
          placeholder={t("placeholders.description")}
          rows={3}
        />

        {showCompany && (
          // A role with no company never reaches an employee: the assignment
          // dropdown is fed by `employees/company/{id}/roles`, which only
          // returns company-scoped rows.
          <Text size="sm" className="ds-text-gray-200">
            {t("companyHint")}
          </Text>
        )}
      </div>

      <PermissionMatrix
        permissions={permissions}
        value={selectedPermissions}
        onChange={onPermissionsChange}
        isLoading={permissionsLoading}
        disabled={readOnlyPermissions}
      />
    </div>
  );
}
