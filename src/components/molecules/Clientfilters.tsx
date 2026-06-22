"use client";

import { Search, Filter, ChevronDown } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import type { GenericStatus } from "@/types/Shared.types";
type FilterValue = "all" | Extract<GenericStatus, "active" | "pending" | "suspended">;

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All cases" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
];

interface ClientFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  filter: FilterValue;
  onFilterChange: (v: FilterValue) => void;
}

export function ClientFilters({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: ClientFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute start-3 top-1/2 -translate-y-1/2 ds-text-gray-200 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Searching..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-xl ds-border-input-color ds-bg-form ds-text-sm ds-text-primary",
            "ps-9 pe-4",
            "focus:outline-none focus:border-[var(--color-primary)]",
            "transition-colors placeholder:ds-text-gray-200"
          )}
          style={{ height: "var(--input-height)" }}
        />
      </div>

      {/* Filter dropdown */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 cursor-pointer",
            "ds-border-input-color ds-bg-form ds-text-sm ds-text-primary",
            "focus-within:border-[var(--color-primary)] transition-colors",
            "border"
          )}
          style={{ height: "var(--input-height)" }}
        >
          <Filter size={15} className="ds-text-gray-200 shrink-0" />
          <select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value as FilterValue)}
            className="bg-transparent focus:outline-none ds-text-sm ds-text-primary cursor-pointer appearance-none pe-6"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="ds-text-gray-200 pointer-events-none absolute end-3"
          />
        </div>
      </div>
    </div>
  );
}