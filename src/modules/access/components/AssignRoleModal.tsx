"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldOff, Users } from "lucide-react";
import { ActionModal } from "@/components/molecules/ActionModal";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import { useCompanyRoles, useRole } from "@/modules/roles/hooks/useRoles";
import { groupPermissions } from "@/modules/roles/utils/permissions.catalog";
import { getExtraRole } from "../hooks/useAccess";

interface AssignRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** One employee, or several for a bulk assignment. */
  employees: any[];
  companyId: number | string | null;
  onConfirm: (roleId: number | null) => void;
  isSubmitting?: boolean;
}

/** Value used for the "no extra role" choice — `null` cannot key a list item. */
const NONE = "__none__";

export default function AssignRoleModal({
  isOpen,
  onClose,
  employees,
  companyId,
  onConfirm,
  isSubmitting,
}: AssignRoleModalProps) {
  const t = useTranslations("access");
  const tPermission = useTranslations("permission");

  const { data: roleOptions, isLoading: rolesLoading } = useCompanyRoles(
    isOpen ? companyId : null
  );

  const isBulk = employees.length > 1;
  const currentRole = isBulk ? null : getExtraRole(employees[0]);

  const [choice, setChoice] = useState<string>(NONE);

  useEffect(() => {
    if (!isOpen) return;
    // Bulk starts unset so a stray confirm cannot mass-clear roles.
    setChoice(isBulk ? NONE : currentRole ? String(currentRole.id) : NONE);
  }, [isOpen, employees]);

  // Preview what the chosen role actually grants, so the consequence is
  // visible before saving rather than discovered later.
  const selectedRoleId = choice === NONE ? null : Number(choice);
  const { data: previewRole, isLoading: previewLoading } = useRole(
    isOpen ? selectedRoleId : null
  );

  const previewGroups = useMemo(() => {
    if (!previewRole?.permissions?.length) return [];
    return groupPermissions(previewRole.permissions).map((group) => ({
      key: group.key,
      label: tPermission.has(`groups.${group.key}`)
        ? tPermission(`groups.${group.key}`)
        : group.key.replace(/_/g, " "),
      count: group.actions.length,
    }));
  }, [previewRole, tPermission]);

  if (!isOpen || employees.length === 0) return null;

  const targetLabel = isBulk
    ? t("bulkTarget", { count: employees.length })
    : employees[0]?.user?.name ?? employees[0]?.name ?? "";

  const options = [
    { value: NONE, label: t("noRole"), hint: t("noRoleHint") },
    ...roleOptions.map((r) => ({ value: String(r.id), label: r.name, hint: "" })),
  ];

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("assignTitle")}
      mode="edit"
      size="lg"
      isLoading={isSubmitting}
      onSubmit={() => onConfirm(selectedRoleId)}
      saveLabel={t("apply")}
    >
      <div className="flex flex-col gap-5 w-full">
        {/* ── Who this applies to ─────────────────────────────────────────── */}
        <div className="rounded-xl border ds-border-form p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center ds-bg-primary-200 shrink-0">
            {isBulk ? (
              <Users size={18} className="ds-text-brand" />
            ) : (
              <ShieldCheck size={18} className="ds-text-brand" />
            )}
          </div>
          <div className="min-w-0">
            <Text size="sm" weight="medium" tag="span">{targetLabel}</Text>
            {!isBulk && (
              <Text size="sm" className="ds-text-gray-200">
                {currentRole ? t("currentRole", { role: currentRole.name }) : t("noRole")}
              </Text>
            )}
          </div>
        </div>

        {/* ── Role picker ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <Text size="sm" weight="medium" tag="span">{t("chooseRole")}</Text>

          {rolesLoading ? (
            <div className="h-24 rounded-xl ds-bg-primary-200 animate-pulse" />
          ) : (
            <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
              {options.map((option) => {
                const active = choice === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setChoice(option.value)}
                    className={cn(
                      "w-full text-start rounded-xl border p-3 flex items-center gap-3 transition-colors",
                      active
                        ? "border-[var(--color-text-brand)] ds-bg-primary-200"
                        : "ds-border-form hover:ds-bg-primary-200"
                    )}
                  >
                    {option.value === NONE ? (
                      <ShieldOff size={16} className="ds-text-gray-200 shrink-0" />
                    ) : (
                      <ShieldCheck size={16} className="ds-text-brand shrink-0" />
                    )}
                    <span className="flex flex-col min-w-0">
                      <Text size="sm" weight="medium" tag="span">{option.label}</Text>
                      {option.hint && (
                        <Text size="sm" className="ds-text-gray-200">{option.hint}</Text>
                      )}
                    </span>
                  </button>
                );
              })}

              {roleOptions.length === 0 && (
                <div className="rounded-xl border ds-border-form p-4 text-center">
                  <Text size="sm" className="ds-text-gray-200">{t("noRolesForCompany")}</Text>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── What the choice grants ───────────────────────────────────────── */}
        {selectedRoleId !== null && (
          <div className="rounded-xl border ds-border-form p-4 flex flex-col gap-2">
            <Text size="sm" weight="medium" tag="span">{t("grants")}</Text>

            {previewLoading ? (
              <div className="h-6 rounded-lg ds-bg-primary-200 animate-pulse" />
            ) : previewGroups.length === 0 ? (
              <Text size="sm" className="ds-text-gray-200">{t("grantsNone")}</Text>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {previewGroups.map((group) => (
                  <span
                    key={group.key}
                    className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand capitalize"
                  >
                    {group.label} · {group.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {isBulk && (
          <Text size="sm" className="ds-text-gray-200">
            {t("bulkWarning", { count: employees.length })}
          </Text>
        )}
      </div>
    </ActionModal>
  );
}
