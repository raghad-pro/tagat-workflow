"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { CashFlowPoint } from "../types/dashboard.types";

const cashFlowConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-revenue)" },
  expenses: { label: "Expenses", color: "var(--color-chart-expenses)" },
};

export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <ChartContainer config={cashFlowConfig} className="h-[200px] w-full">
      <BarChart data={data} barGap={3} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-gray-200)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-text-gray-200)" }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="expenses" fill="var(--color-chart-expenses)" radius={[5, 5, 0, 0]} />
        <Bar dataKey="revenue" fill="var(--color-chart-revenue)" radius={[5, 5, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

export function CashFlowLegend() {
  return (
    <div className="flex items-center gap-3 text-[11px] ds-text-gray-200">
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-chart-expenses)" }} />
        Expenses
      </span>
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--color-chart-revenue)" }} />
        Revenue
      </span>
    </div>
  );
}
