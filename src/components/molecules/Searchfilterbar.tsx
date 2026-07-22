"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  value: string;
  onChange: (v: string) => void;
  options: FilterOption[];
}

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters?: FilterConfig[];
  searchPlaceholder?: string;
}

// ─── Custom Dropdown ──────────────────────────────────────────────────────────
function FilterDropdown({ filter }: { filter: FilterConfig }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = filter.options.find((o) => o.value === filter.value);

  return (
    <div ref={ref} className="relative shrink-0">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-2 rounded-xl px-4 border transition-colors",
          "ds-border-input-color ds-bg-form ds-text-sm ds-text-primary",
          open && "border-[var(--color-primary)]"
        )}
        style={{ height: "var(--input-height)", minWidth: "160px" }}
      >
        <Filter size={15} className="ds-text-gray-200 shrink-0" />
        <span className="flex-1 text-start truncate">
          {selected?.label ?? filter.options[0]?.label}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "ds-text-gray-200 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute end-0 top-full mt-1.5 z-30 rounded-xl overflow-hidden p-1.5 flex flex-col gap-0.5"
          style={{
            background: "var(--color-bg-form)",
            border: "1px solid var(--color-border-inputs)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
            minWidth: "100%",
          }}
        >
          {filter.options.map((opt, i) => {
            const isSelected = opt.value === filter.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  filter.onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-start px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                  isSelected
                    ? "bg-[#BBEDF4]/30 text-[#0f5b66] dark:bg-[#0f5b66]/20 dark:text-[#a5e8f3]"
                    : "ds-text-gray-100 hover:bg-[var(--color-bg)]"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SearchFilterBar({
  search,
  onSearchChange,
  filters,
  searchPlaceholder = "Searching...",
}: SearchFilterBarProps) {
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
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            "w-full rounded-xl border ds-border-input-color ds-bg-form ds-text-sm ds-text-primary",
            "ps-9 pe-4",
            "focus:outline-none focus:border-[var(--color-primary)]",
            "transition-colors placeholder:text-[var(--color-text-gray-200)]"
          )}
          style={{ height: "var(--input-height)" }}
        />
      </div>

      {/* Filter dropdowns */}
      {filters?.map((f, i) => (
        <FilterDropdown key={i} filter={f} />
      ))}
    </div>
  );
}