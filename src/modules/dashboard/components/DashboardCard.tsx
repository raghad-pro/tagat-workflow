"use client";

import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { useTranslations } from "next-intl";

interface DashboardCardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DashboardCard({ title, action, children, className = "" }: DashboardCardProps) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col ds-bg-form ds-border-form ds-shadow-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Text size="sm" weight="bold" tag="p">{title}</Text>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ShowAll({ href = "#" }: { href?: string }) {
  const t = useTranslations("dashboard");
  return (
    <Link href={href} className="text-xs font-semibold hover:underline ds-text-brand">
      ↗ {t("showAll")}
    </Link>
  );
}
