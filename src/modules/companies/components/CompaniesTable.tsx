"use client";

import { Eye, Trash2 } from "@/assets/icons/icons";
import { Text } from "@/components/atoms/Text";
import { Building2 } from "@/assets/icons/icons";
import type { Company } from "../types/company.types";

interface Props {
  companies: Company[];
  onDelete: (id: number) => void;
  onView: (company: Company) => void;
}

const planStyles: Record<string, { bg: string; color: string }> = {
  Enterprise: { bg: "#fef3c7", color: "#b45309" },
  Pro:        { bg: "#e9f9fb", color: "#0e7490" },
  Basic:      { bg: "#f5f5f5", color: "#707070" },
};

const statusStyles: Record<string, { bg: string; color: string }> = {
  Active:   { bg: "#ecfdf5", color: "#166534" },
  Pending:  { bg: "#fef9c3", color: "#854d0e" },
  Inactive: { bg: "#fef2f2", color: "#991b1b" },
};

export function CompaniesTable({ companies, onDelete, onView }: Props) {
  if (companies.length === 0) {
    return (
      <div className="rounded-2xl ds-bg-form ds-border-form ds-shadow-sm p-16 flex flex-col items-center gap-3">
        <Building2 size={40} className="ds-text-gray-200" />
        <Text color="gray-200">No companies found</Text>
      </div>
    );
  }

  return (
    <div className="rounded-2xl ds-bg-form ds-border-form ds-shadow-sm overflow-hidden">
      
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="ds-bg" style={{ borderBottom: "1px solid var(--color-border-form)" }}>
              {["Logo", "Company Name", "Plan", "Monthly Revenue", "Renewal Date", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-start ds-text-sm ds-text-gray-200 ds-font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((c, i) => (
              <tr
                key={c.id}
                className="transition-colors hover:ds-bg"
                style={{ borderBottom: i < companies.length - 1 ? "1px solid var(--color-border-form)" : "none" }}
              >
                {/* Logo */}
                <td className="px-4 py-3">
                  <div className="w-9 h-9 rounded-xl ds-bg-primary-200 ds-border-form border flex items-center justify-center overflow-hidden">
                    {c.logo
                      ? <img src={c.logo} alt={c.name} className="w-full h-full object-cover" />
                      : <Building2 size={16} className="ds-text-brand" />
                    }
                  </div>
                </td>

                {/* Name */}
                <td className="px-4 py-3">
                  <Text size="sm" weight="bold">{c.name}</Text>
                  <Text size="sm" color="gray-200" className="text-[11px] mt-0.5">{c.subdomain}</Text>
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={planStyles[c.plan] || planStyles.Basic}
                  >
                    {c.plan}
                  </span>
                </td>

                {/* Revenue */}
                <td className="px-4 py-3">
                  <Text size="sm" weight="bold" color="brand">${c.monthly_revenue.toLocaleString()}</Text>
                </td>

                {/* Renewal */}
                <td className="px-4 py-3">
                  <Text size="sm" color="gray-200">{c.renewal_date}</Text>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={statusStyles[c.status] || statusStyles.Active}
                  >
                    {c.status}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(c)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:ds-bg-primary-200 transition-colors ds-text-gray-200 hover:ds-text-brand"
                      aria-label="View"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors ds-text-gray-200 hover:text-red-500"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y" style={{ borderColor: "var(--color-border-form)" }}>
        {companies.map((c) => (
          <div key={c.id} className="p-4 flex gap-3">
            <div className="w-10 h-10 rounded-xl ds-bg-primary-200 flex items-center justify-center shrink-0">
              {c.logo
                ? <img src={c.logo} alt={c.name} className="w-full h-full object-cover rounded-xl" />
                : <Building2 size={18} className="ds-text-brand" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <Text size="sm" weight="bold" className="truncate">{c.name}</Text>
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                  style={statusStyles[c.status]}
                >
                  {c.status}
                </span>
              </div>
              <Text size="sm" color="gray-200" className="text-[11px] mt-0.5 truncate">{c.subdomain}</Text>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold" style={planStyles[c.plan]}>{c.plan}</span>
                <Text size="sm" weight="bold" color="brand" className="text-[11px]">${c.monthly_revenue.toLocaleString()}/mo</Text>
                <Text size="sm" color="gray-200" className="text-[11px]">{c.renewal_date}</Text>
              </div>
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={() => onView(c)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:ds-bg-primary-200 ds-text-gray-200" aria-label="View">
                <Eye size={14} />
              </button>
              <button onClick={() => onDelete(c.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}