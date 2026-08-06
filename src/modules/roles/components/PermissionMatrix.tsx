"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, ShieldCheck, Minus } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { CheckboxField } from "@/components/atoms/checkboxField";
import { cn } from "@/lib/utils";
import type { Permission } from "../types/roles.types";
import {
  groupPermissions,
  groupIds,
  groupState,
  isActionChecked,
  type PermissionGroup,
} from "../utils/permissions.catalog";

interface PermissionMatrixProps {
  /** The grantable catalog, straight from `GET /roles/form-permissions`. */
  permissions: Permission[];
  /** Selected permission ids. */
  value: number[];
  onChange: (ids: number[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/**
 * Grouped permission picker.
 *
 * Labels are composed from the group and action halves of each permission name
 * (`invoices.create` → "Invoices" + "Create") rather than translated one by
 * one: there are 86 permissions but only ~24 groups and ~10 actions, and a
 * permission added server-side still renders — it falls back to its raw name.
 */
export function PermissionMatrix({
  permissions,
  value,
  onChange,
  isLoading,
  disabled,
}: PermissionMatrixProps) {
  const t = useTranslations("permission");
  const [filter, setFilter] = useState("");

  const selected = useMemo(() => new Set(value), [value]);
  const groups = useMemo(() => groupPermissions(permissions), [permissions]);

  const label = (key: string, fallback: string) => {
    // next-intl throws on a missing key, so probe before using it — the
    // catalog is server-driven and may outgrow the message files.
    const translated = t.has(key) ? t(key) : "";
    return translated || fallback;
  };

  const groupLabel = (key: string) =>
    label(`groups.${key}`, key.replace(/_/g, " "));
  const actionLabel = (action: string) =>
    label(`actions.${action}`, action.replace(/_/g, " "));

  const visibleGroups = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => {
        // A group name match keeps all of its actions; otherwise filter within.
        if (groupLabel(group.key).toLowerCase().includes(needle)) return group;
        const actions = group.actions.filter(
          (a) =>
            actionLabel(a.action).toLowerCase().includes(needle) ||
            `${group.key}.${a.action}`.includes(needle)
        );
        return actions.length ? { ...group, actions } : null;
      })
      .filter(Boolean) as PermissionGroup[];
  }, [groups, filter, t]);

  const setIds = (ids: number[], checked: boolean) => {
    if (disabled) return;
    const next = new Set(selected);
    for (const id of ids) {
      if (checked) next.add(id);
      else next.delete(id);
    }
    onChange(Array.from(next));
  };

  const toggleAll = (checked: boolean) => {
    if (disabled) return;
    onChange(checked ? permissions.map((p) => p.id) : []);
  };

  const total = permissions.length;
  const grantedCount = permissions.filter((p) => selected.has(p.id)).length;

  if (isLoading) {
    return (
      <div className="rounded-2xl border ds-border-form p-5 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl ds-bg-primary-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border ds-border-form p-6 text-center">
        <Text size="sm" className="ds-text-gray-200">{t("empty")}</Text>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border ds-border-form overflow-hidden">
      {/* ── Header: count + select-all + filter ─────────────────────────── */}
      <div className="p-4 flex flex-col gap-3 border-b ds-border-form">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="ds-text-brand" />
            <Text size="sm" weight="medium" tag="span">{t("title")}</Text>
            <span className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand">
              {t("granted", { count: grantedCount, total })}
            </span>
          </div>

          <CheckboxField
            label={grantedCount === total ? t("clearAll") : t("selectAll")}
            checked={grantedCount === total}
            onCheckedChange={(c) => toggleAll(Boolean(c))}
            disabled={disabled}
          />
        </div>

        <div className="relative">
          {/* `ps-9` keeps the icon clear of the text in both LTR and RTL. */}
          <Search
            size={16}
            className="absolute top-1/2 -translate-y-1/2 start-3 ds-text-gray-200 pointer-events-none"
          />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-9 pe-3 py-2 rounded-xl text-sm ds-bg-form ds-text-primary border ds-border-form outline-none focus:border-[var(--color-text-brand)]"
          />
        </div>
      </div>

      {/* ── Groups ───────────────────────────────────────────────────────── */}
      <div className="max-h-[22rem] overflow-y-auto p-4 flex flex-col gap-3">
        {visibleGroups.length === 0 && (
          <Text size="sm" className="ds-text-gray-200 text-center py-4">
            {t("noMatches")}
          </Text>
        )}

        {visibleGroups.map((group) => {
          const state = groupState(group, selected);
          return (
            <div
              key={group.key}
              className={cn(
                "rounded-xl border p-3 flex flex-col gap-3 transition-colors",
                state === "none" ? "ds-border-form" : "border-[var(--color-text-brand)]"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="relative flex items-center">
                  <CheckboxField
                    label={groupLabel(group.key)}
                    checked={state === "all"}
                    onCheckedChange={(c) => setIds(groupIds(group), Boolean(c))}
                    disabled={disabled}
                  />
                  {/* Radix has no tri-state here, so "some" is drawn on top. */}
                  {state === "some" && (
                    <Minus
                      size={14}
                      strokeWidth={3}
                      className="absolute start-[3px] ds-text-brand pointer-events-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 ps-6">
                {group.actions.map((action) => (
                  <CheckboxField
                    key={action.action}
                    label={actionLabel(action.action)}
                    checked={isActionChecked(action, selected)}
                    onCheckedChange={(c) => setIds(action.ids, Boolean(c))}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
