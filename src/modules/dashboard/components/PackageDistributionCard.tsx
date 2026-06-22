"use client";

import { ChartContainer } from "@/components/ui/chart";
import { PieChart, Pie, Cell } from "recharts";
import { Text } from "@/components/atoms/Text";
import type { PackageDistribution } from "../types/dashboard.types";

export function PackageDistributionCard({ data }: { data: PackageDistribution[] }) {
  return (
    <div className="flex items-center gap-6 flex-row xl:flex-col">
      <ChartContainer config={{ packages: { label: "Packages" } }} className="h-[130px] w-[130px]">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={40}
            outerRadius={60}
            strokeWidth={2}
            stroke="var(--color-bg-form)"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex flex-col gap-2.5 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <Text size="sm" weight="bold">{d.value} companies</Text>
            <span className="flex items-center gap-2">
              <Text size="sm" color="gray-200">{d.name}</Text>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: d.color }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
