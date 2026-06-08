"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/atoms/Button";
import { Text } from "@/components/atoms/Text";
import { CompaniesTable } from "./CompaniesTable";
import { CompanyFilters } from "./CompanyFilters";
import { AddCompanyModal } from "./AddCompanyModal";
import type { Company, CompanyPlan, CompanyStatus, AddCompanyRequest } from "../types/company.types";
import toast from "react-hot-toast";

// ─── Mock Data — يتحل لما تتوفر API ─────────────────────────────────────────
const MOCK_COMPANIES: Company[] = [
  { id: 1, logo: null, name: "Advanced Tech Company",   subdomain: "advanced-tech.workflow.com",   plan: "Enterprise", monthly_revenue: 1500, renewal_date: "2026-12-15", status: "Active"  },
  { id: 2, logo: null, name: "Innovation Foundation",   subdomain: "innovation.workflow.com",      plan: "Pro",        monthly_revenue: 499,  renewal_date: "2026-09-20", status: "Active"  },
  { id: 3, logo: null, name: "Smart Solutions Company", subdomain: "smart-solutions.workflow.com", plan: "Basic",      monthly_revenue: 99,   renewal_date: "2026-07-10", status: "Active"  },
  { id: 4, logo: null, name: "Development Group",       subdomain: "dev-group.workflow.com",       plan: "Pro",        monthly_revenue: 499,  renewal_date: "2026-08-05", status: "Pending" },
  { id: 5, logo: null, name: "Future Company",          subdomain: "future-corp.workflow.com",     plan: "Enterprise", monthly_revenue: 2000, renewal_date: "2027-01-30", status: "Active"  },
];

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<CompanyPlan | "all">("all");
  const [statusFilter, setStatusFilter] = useState<CompanyStatus | "all">("all");

  // ─── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                         c.subdomain.toLowerCase().includes(search.toLowerCase());
      const matchPlan   = planFilter === "all" || c.plan === planFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchPlan && matchStatus;
    });
  }, [companies, search, planFilter, statusFilter]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAdd = async (data: AddCompanyRequest) => {
    setIsPending(true);
    try {
      // TODO: استبدل بـ API call
      // const response = await companiesApi.create(data);
      const newCompany: Company = {
        id: Date.now(),
        logo: data.logo ? URL.createObjectURL(data.logo) : null,
        name: data.name,
        subdomain: `${data.subdomain}.workflow.com`,
        plan: data.plan,
        monthly_revenue: data.monthly_revenue ?? 0,
        renewal_date: data.renewal_date ?? "—",
        status: "Active",
      };
      setCompanies((prev) => [newCompany, ...prev]);
      toast.success("Company added successfully");
      setModalOpen(false);
    } catch {
      toast.error("Failed to add company");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = (id: number) => {
    // TODO: استبدل بـ API call + confirmation dialog
    setCompanies((prev) => prev.filter((c) => c.id !== id));
    toast.success("Company removed");
  };

  const handleView = (company: Company) => {
    // TODO: روّح لصفحة التفاصيل
    // router.push(`/companies/${company.id}`);
    toast(`Viewing: ${company.name}`);
  };

  return (
    <div className="flex flex-col gap-5 p-4 sm:p-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <Text size="xl" weight="bold" tag="h1">Company Management</Text>
          <Text size="sm" color="gray-200" className="mt-1">View and manage all subscribed companies</Text>
        </div>
        <Button
          variant="solid"
          size="md"
          licon={<span className="text-base leading-none">+</span>}
          onClick={() => setModalOpen(true)}
          className="whitespace-nowrap self-start sm:self-auto"
        >
          Add a new company
        </Button>
      </div>

      {/* ── Filters ── */}
      <CompanyFilters
        onSearch={setSearch}
        onPlanChange={setPlanFilter}
        onStatusChange={setStatusFilter}
      />

      {/* ── Table ── */}
      <CompaniesTable
        companies={filtered}
        onDelete={handleDelete}
        onView={handleView}
      />

      {/* ── Modal ── */}
      <AddCompanyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        isPending={isPending}
      />
    </div>
  );
}