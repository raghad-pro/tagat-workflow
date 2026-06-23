"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Clock, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar, FilterConfig } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { PageHeader } from "@/components/molecules/Pageheader";
import { Pagination } from "@/components/molecules/Pagination";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { Text } from "@/components/atoms/Text";
import { AddCompanyModal } from "./AddCompanyModal";
import { ViewCompanyModal } from "./ViewCompanyModal";
import { EditCompanyModal } from "./EditCompanyModal";
import type { Company } from "@/modules/companies/types/companies.types";

const MOCK: Company[] = [
  { id: 1, name: "Zeinab buon",    domain: "zeinabcom.localhost",    email: "zeinab@gmail.com",  joinedDate: "2023-10-15", status: "active", plan: "basic" },
  { id: 2, name: "Omar Al-Faraj",  domain: "omarhashim.localhost",   email: "omar@example.com",  joinedDate: "2023-11-02", status: "pending", plan: "basic" },
  { id: 3, name: "Amir Han",       domain: "amirhan.localhost",      email: "amir@example.com",  joinedDate: "2023-11-05", status: "active", plan: "pro" },
  { id: 4, name: "Nour Al-Jazeera",domain: "nouraljazeera.localhost",email: "nour@example.com",  joinedDate: "2023-11-07", status: "active", plan: "enterprise" },
  { id: 5, name: "Layla Salim",    domain: "laylasalim.localhost",   email: "layla@example.com", joinedDate: "2023-11-06", status: "pending", plan: "basic" },
];

const PAGE_SIZE = 4;

function CompanyAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-primary)] text-xs font-bold flex-shrink-0 bg-[var(--color-bg-primary-200)] border border-[var(--color-primary-400)]">
      {initials}
    </div>
  );
}

export function CompanyManagementPage() {
  const router = useRouter();
  const t = useTranslations("company");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>(MOCK);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Company>();

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStatus = useCallback((v: string) => { setStatus(v); setPage(1); }, []);

  const stats: StatItem[] = useMemo(() => [
    { icon: Building2,    value: 124, label: t("stats.total"), iconColor: "#0ea5e9", iconBg: "rgba(14,165,233,0.12)" },
    { icon: CheckCircle2, value: 118, label: t("stats.active"),  iconColor: "#22c55e", iconBg: "rgba(34,197,94,0.12)"  },
    { icon: Clock,        value: 6,   label: t("stats.pending"), iconColor: "#f59e0b", iconBg: "rgba(251,191,36,0.12)" },
  ], [t]);

  const columns: TableColumn<Company>[] = useMemo(() => [
    {
      key: "name",
      header: t("columns.company"),
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <CompanyAvatar name={row.name} />
          <Text size="sm" weight="medium" tag="span" className="ds-text-primary">
            {row.name}
          </Text>
        </div>
      ),
    },
    {
      key: "domain",
      header: t("columns.domain"),
      render: (row) => (
        <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20">
          {row.domain}
        </span>
      ),
    },
    {
      key: "email",
      header: t("columns.email"),
      hideOnMobile: true,
      render: (row) => <Text size="sm" className="ds-text-gray-200">{row.email}</Text>,
    },
    {
      key: "joinedDate",
      header: t("columns.joinedDate"),
      hideOnMobile: true,
      render: (row) => <Text size="sm" className="ds-text-gray-200">{row.joinedDate}</Text>,
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
  ], [t]);

  const actions: TableAction<Company>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const filters: FilterConfig[] = useMemo(() => [
    {
      value: status,
      onChange: handleStatus,
      options: [
        { value: "all",       label: tCommon("status")  },
        { value: "active",    label: t("filter.active")      },
        { value: "pending",   label: t("filter.pending")     },
      ],
    },
  ], [status, handleStatus, t, tCommon]);

  const filtered = companies.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "all" || c.status === status;
    return matchSearch && matchStatus;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[
          {
            label: t("add"),
            onClick: () => setIsAddModalOpen(true),
            icon: Plus,
            variant: "solid"
          },
        ]}
      />

      <StatsGrid stats={stats} cols={3} />

      <div className="rounded-2xl ds-bg-form flex flex-col mt-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: "var(--color-border-form)" }}>
          <SearchFilterBar
            search={search}
            onSearchChange={handleSearch}
            searchPlaceholder={t("searchPlaceholder")}
            filters={filters}
          />
        </div>

        <DataTable
          columns={columns}
          data={paginated}
          actions={actions}
          actionsHeader={tCommon("actions")}
          emptyMessage={tCommon("noDataFound")}
        />

        <div className="p-4 border-t flex justify-end" style={{ borderColor: "var(--color-border-form)" }}>
          <Pagination
            currentPage={page}
            data={filtered}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={(data) => {
          const newCompany: Company = {
            id: Date.now(),
            name: data.companyName,
            domain: data.subdomain + ".localhost",
            email: data.email,
            joinedDate: new Date().toISOString().split("T")[0],
            status: "pending",
            plan: "basic"
          };
          setCompanies((prev) => [newCompany, ...prev]);
          setIsAddModalOpen(false);
        }}
      />

      <ViewCompanyModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditCompanyModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id, data) => {
          setCompanies((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    name: data.companyName,
                    domain: data.subdomain,
                    email: data.email,
                  }
                : c
            )
          );
          closeModal();
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={t("deleteTitle")}
        itemName={selectedRow?.name}
        onConfirm={() => {
          if (selectedRow) {
            setCompanies((prev) => prev.filter((c) => c.id !== selectedRow.id));
          }
          closeModal();
        }}
      />
    </div>
  );
}