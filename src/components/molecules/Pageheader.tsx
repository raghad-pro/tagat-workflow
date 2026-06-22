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
      <div>
        <Text size="xl" weight="bold" tag="h1">
          {title}
        </Text>
        {subtitle && (
          <Text size="sm" color="gray-200" tag="p" className="mt-1">
            {subtitle}
          </Text>
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
