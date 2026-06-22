"use client";

import { LucideIcon } from "lucide-react";
import { StatCard } from "@/components/atoms/Statcard";

export interface StatItem {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;
}

interface StatsGridProps {
  stats: StatItem[];
  /** defaults to 4 columns on lg */
  cols?: 2 | 3 | 4;
}

const COLS_MAP = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function StatsGrid({ stats, cols = 4 }: StatsGridProps) {
  return (
    <div className={`grid ${COLS_MAP[cols]} gap-4 mb-6`}>
      {stats.map((stat, i) => (
        <StatCard key={i} {...stat} />
      ))}
    </div>
  );
}