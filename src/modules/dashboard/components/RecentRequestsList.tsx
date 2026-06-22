"use client";

import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { DashboardRequest } from "../types/dashboard.types";

const PRIORITY_CLASS: Record<DashboardRequest["priority"], { bg: string; text: string }> = {
  High: { bg: "ds-bg-priority-high", text: "ds-text-priority-high" },
  Medium: { bg: "ds-bg-priority-medium", text: "ds-text-priority-medium" },
  Low: { bg: "ds-bg-priority-low", text: "ds-text-priority-low" },
};

export function RecentRequestsList({ requests }: { requests: DashboardRequest[] }) {
  return (
    <div className="flex flex-col gap-3">
      {requests.map((r) => {
        const pClass = PRIORITY_CLASS[r.priority];
        return (
          <div key={r.id} className="rounded-xl p-3 ds-bg ds-border-form">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Text size="sm" weight="bold" tag="span" className="ds-text-brand text-[11px]">
                  {r.id}
                </Text>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", pClass.bg, pClass.text)}>
                  {r.priority}
                </span>
              </div>

              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ds-bg-processing ds-text-processing">
                Processing
              </span>
            </div>

            <Text size="sm" weight="bold" tag="p">
              {r.company}
            </Text>

            <Text size="sm" color="gray-200" tag="p" className="text-[10px] mt-0.5">
              {r.sub} · {r.date}
            </Text>
          </div>
        );
      })}
    </div>
  );
}
