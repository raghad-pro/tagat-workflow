"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { WorkingHoursPoint } from "../types/dashboard.types";

const chartConfig: ChartConfig = {
  hours: { label: "Working Hours", color: "var(--color-primary)" },
};

export function WorkingHoursChart({ data }: { data: WorkingHoursPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={data} barGap={3} barCategoryGap="25%">
        <CartesianGrid vertical={false} stroke="var(--color-border-form)" />
        <XAxis 
          dataKey="day" 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 12, fill: "var(--color-text-gray-200)" }} 
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={{ fontSize: 12, fill: "var(--color-text-gray-200)" }} 
          tickFormatter={(value) => `${value}h`}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar 
          dataKey="hours" 
          fill="var(--color-hours)" 
          radius={[6, 6, 0, 0]} 
          maxBarSize={40}
        />
      </BarChart>
    </ChartContainer>
  );
}
