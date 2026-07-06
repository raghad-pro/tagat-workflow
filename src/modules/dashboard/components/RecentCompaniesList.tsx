"use client";

import { Building2 } from "@/assets/icons/icons";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { RecentCompany } from "../types/dashboard.types";

const PLAN_CLASS: Record<RecentCompany["plan"], { bg: string; text: string }> = {
  Enterprise: { bg: "ds-bg-plan-enterprise", text: "ds-text-plan-enterprise" },
  Pro: { bg: "ds-bg-plan-pro", text: "ds-text-plan-pro" },
  Basic: { bg: "ds-bg-plan-basic", text: "ds-text-plan-basic" },
};

export function RecentCompaniesList({ companies }: { companies: RecentCompany[] }) {
  return (
    <div className="flex flex-col gap-3">
      {companies.map((c, i) => {
        const planStyle = PLAN_CLASS[c.plan];
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
              <Building2 size={14} className="ds-text-brand" />
            </div>

            <div className="flex-1 min-w-0">
              <Text size="sm" weight="bold" tag="p" className="truncate">
                {c.name}
              </Text>
              <Text size="sm" color="gray-200" tag="p" className="text-[10px]">
                {c.date}
              </Text>
            </div>

            <div className="flex items-end gap-2 shrink-0">
              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", planStyle.bg, planStyle.text)}>
                {c.plan}
              </span>
              <Text size="sm" weight="bold" tag="span" className="ds-text-success">
                {c.amount}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
}
