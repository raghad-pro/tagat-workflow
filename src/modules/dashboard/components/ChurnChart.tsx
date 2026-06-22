"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, CartesianGrid } from "recharts";
import type { ChurnPoint } from "../types/dashboard.types";

const churnConfig: ChartConfig = {
  new: { label: "New Subscriptions", color: "var(--color-chart-new)" },
  cancelled: { label: "Cancellations", color: "var(--color-chart-cancelled)" },
};

export function ChurnChart({ data }: { data: ChurnPoint[] }) {
  return (
    <ChartContainer config={churnConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
        <Bar dataKey="cancelled" fill="var(--color-chart-cancelled)" radius={[5, 5, 0, 0]} />
        <Bar dataKey="new" fill="var(--color-chart-new)" radius={[5, 5, 0, 0]} />
        <ChartTooltip content={<ChartTooltipContent />} />
      </BarChart>
    </ChartContainer>
  );
}

export function ChurnLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] ds-text-gray-200">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-chart-cancelled)" }} />
        Cancellations
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-chart-new)" }} />
        New Subscriptions
      </span>
    </div>
  );
}
