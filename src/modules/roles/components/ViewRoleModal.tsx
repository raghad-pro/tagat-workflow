"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { ViewDetailsLayout, InfoRow } from "@/components/molecules/ViewDetailsLayout";
import { isBaseRole, type Role } from "../types/roles.types";
import { groupPermissions, splitPermission } from "../utils/permissions.catalog";
import { useRole } from "../hooks/useRoles";

export function ViewRoleModal({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: Role | null;
}) {
  const t = useTranslations("role");
  const tPermission = useTranslations("permission");

  const { data: fresh } = useRole(isOpen ? data?.id : null);
  const role = fresh ?? data;

  const label = (key: string, fallback: string) =>
    tPermission.has(key) ? tPermission(key) : fallback;

  const granted = useMemo(() => {
    if (!role?.permissions?.length) return [];
    return groupPermissions(role.permissions).map((group) => ({
      key: group.key,
      label: label(`groups.${group.key}`, group.key.replace(/_/g, " ")),
      actions: group.actions.map((a) =>
        label(`actions.${a.action}`, a.action.replace(/_/g, " "))
      ),
    }));
  }, [role, tPermission]);

  if (!role) return null;

  const base = isBaseRole(role.id);

  return (
    <ViewDetailsLayout
      isOpen={isOpen}
      onClose={onClose}
      title={t("viewRole")}
      headerIcon={<Shield size={24} />}
      headerTitle={role.name}
      headerSubtitle={
        <span
          className={
            "px-2 py-0.5 rounded text-xs inline-block " +
            (base
              ? "bg-primary/10 text-[var(--color-primary)]"
              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400")
          }
        >
          {base ? t("types.system") : t("types.custom")}
        </span>
      }
    >
      <InfoRow label={t("columns.description")}>
        <Text size="sm" tag="span">{role.description || "—"}</Text>
      </InfoRow>

      <InfoRow label={t("columns.company")}>
        <Text size="sm" tag="span">{role.company?.name ?? t("allCompanies")}</Text>
      </InfoRow>

      <InfoRow label={t("columns.permissionsCount")}>
        <Text size="sm" tag="span">{role.permissions?.length ?? 0}</Text>
      </InfoRow>

      <div className="flex flex-col gap-3 pt-2">
        <Text size="sm" weight="medium" tag="span">{tPermission("title")}</Text>

        {granted.length === 0 ? (
          <Text size="sm" className="ds-text-gray-200">{t("noPermissions")}</Text>
        ) : (
          <div className="flex flex-col gap-2">
            {granted.map((group) => (
              <div key={group.key} className="rounded-xl border ds-border-form p-3">
                <Text size="sm" weight="medium" tag="span">{group.label}</Text>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {group.actions.map((action) => (
                    <span
                      key={action}
                      className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ViewDetailsLayout>
  );
}

/** Compact "Clients · Projects +2" summary used in table cells. */
export function permissionSummary(role: Role, max = 3): string {
  const names = role.permissions ?? [];
  if (names.length === 0) return "—";
  const groups = Array.from(new Set(names.map((p) => splitPermission(p.name).group)));
  const shown = groups.slice(0, max).map((g) => g.replace(/_/g, " "));
  return groups.length > max ? `${shown.join(" · ")} +${groups.length - max}` : shown.join(" · ");
}
