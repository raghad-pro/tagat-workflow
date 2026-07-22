"use client";

import { Plus } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";

export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "solid" | "outline" | "ghost";
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: PageHeaderAction[];
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const visibleActions = actions?.slice(0, 2) ?? [];

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-[24px] sm:text-[30px] md:text-[34px] font-[800] tracking-tight leading-none ds-text-main">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[14px] text-slate-500 dark:text-slate-400 font-medium tracking-wide mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {visibleActions.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          {visibleActions.map((action, i) => {
            const Icon = action.icon ?? Plus;
            return (
              <Button
                key={i}
                variant={action.variant ?? "solid"}
                size="md"
                onClick={action.onClick}
                licon={<Icon size={16} />}
                className="whitespace-nowrap"
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
