"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, Edit2, Trash2 } from "@/assets/icons/icons";
import { isBaseRole, type Role } from "../types/roles.types";
import { permissionSummary } from "./ViewRoleModal";

interface RoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
  onView: (role: Role) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function RoleCard({ role, onEdit, onDelete, onView, canEdit, canDelete }: RoleCardProps) {
  const t = useTranslations("role");
  const isSystem = isBaseRole(role.id);

  // Let's generate a color based on role id or name to simulate the image's different pill colors
  const validityColors = [
    "bg-green-500/10 text-green-600 dark:text-green-400",
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  ];
  const colorIndex = role.id % 3;
  const validityClass = validityColors[colorIndex];

  return (
    <div
      className="ds-bg-form border ds-border-form rounded-xl shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] p-5 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(role)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold ds-text-primary capitalize">{role.name}</h3>
            <p className="text-xs ds-text-gray-200 lowercase">{role.name}</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-[10px] font-medium ${validityClass}`}>
          {t("permissionCount", { count: role.permissions?.length || 0 })}
        </div>
      </div>

      {/* Description */}
      <div className="text-xs ds-text-gray-200 line-clamp-2 min-h-[32px]">
        {role.description || permissionSummary(role) || "—"}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end pt-2">
        <div className="flex items-center gap-2">
          {(!isSystem && canEdit) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(role);
              }}
              className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition-colors cursor-pointer"
            >
              <Edit2 size={14} />
            </button>
          )}
          {(!isSystem && canDelete) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(role);
              }}
              className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
