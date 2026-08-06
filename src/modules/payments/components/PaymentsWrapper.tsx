"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ShieldAlert } from "lucide-react";
import { PaymentsManagementPage } from "./PaymentsManagementPage";
import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { Text } from "@/components/atoms/Text";

const BASE_ROLES = ["super_admin", "company", "client"];

export function PaymentsWrapper() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const t = useTranslations("common");

  /**
   * Additive, like the sidebar and the route guard: the base roles get in, and
   * a custom role holding `payments.view` also gets in.
   *
   * This gate used to be the role list alone, which made the payments
   * permission unusable — granting it to an employee changed nothing, because
   * "employee" was not in the list and the page refused to render. The server
   * disagreed: `GET /employee/payments` answers 200.
   *
   * A missing permission never closes the page — see `hasPermission`.
   */
  const allowed =
    !!user && (BASE_ROLES.includes(user.role) || hasPermission("payments.view"));

  if (!allowed) {
    return (
      <div className="p-4 sm:p-6">
        <div className="rounded-2xl border ds-border-form p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--color-status-rejected-bg)]">
            <ShieldAlert size={22} className="text-[var(--color-status-rejected)]" />
          </div>
          <Text size="lg" weight="bold" tag="h2">{t("accessDeniedTitle")}</Text>
          <Text size="sm" className="ds-text-gray-200 max-w-md">
            {t("accessDeniedBody")}
          </Text>
        </div>
      </div>
    );
  }

  return <PaymentsManagementPage />;
}
