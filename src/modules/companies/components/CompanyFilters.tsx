"use client";

import { useState } from "react";
import { Search } from "@/assets/icons/icons";
import { Text } from "@/components/atoms/Text";
import type { CompanyPlan, CompanyStatus } from "../types/company.types";

interface Props {
  onSearch: (q: string) => void;
  onPlanChange: (plan: CompanyPlan | "all") => void;
  onStatusChange: (status: CompanyStatus | "all") => void;
}

const PLANS: Array<CompanyPlan | "all"> = ["all", "Basic", "Pro", "Enterprise"];
const STATUSES: Array<CompanyStatus | "all"> = ["all", "Active", "Pending", "Inactive"];

export function CompanyFilters({ onSearch, onPlanChange, onStatusChange }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute start-3 top-1/2 -translate-y-1/2 ds-text-gray-200 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Searching..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full ps-9 pe-3 h-10 rounded-xl ds-border-input-color ds-bg-form ds-text-sm ds-text-primary focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>

      {/* Plan filter */}
      <select
        onChange={(e) => onPlanChange(e.target.value as CompanyPlan | "all")}
        className="h-10 px-3 rounded-xl ds-border-input-color ds-bg-form ds-text-sm ds-text-gray-200 focus:outline-none focus:border-[var(--color-primary)] sm:w-40"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p === "all" ? "All cases" : p}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        onChange={(e) => onStatusChange(e.target.value as CompanyStatus | "all")}
        className="h-10 px-3 rounded-xl ds-border-input-color ds-bg-form ds-text-sm ds-text-gray-200 focus:outline-none focus:border-[var(--color-primary)] sm:w-36"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All status" : s}
          </option>
        ))}
      </select>
    </div>
  );
}