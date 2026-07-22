"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, Clock, Plus, Eye, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar, FilterConfig } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { Text } from "@/components/atoms/Text";
import { AddCompanyModal } from "./AddCompanyModal";
import { ViewCompanyModal } from "./ViewCompanyModal";
import { EditCompanyModal } from "./EditCompanyModal";
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, useCompanyStats } from "../hooks/useCompanies";

const PAGE_SIZE = 4;

function CompanyAvatar({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={logo} 
          alt={`${name} logo`} 
        className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--color-border-form)]"
        />
      </>
    );
  }
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

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddModalOpen(true);
      router.replace("/companies");
    }
  }, [searchParams, router]);

  // Fetch all companies to handle pagination locally
  const { data: companiesResponse, isLoading, isFetching } = useCompanies({ search, status: status !== "all" ? status : undefined, per_page: 50, page: 1 } as any);
  
  const allCompanies = companiesResponse?.data?.data || [];
  
  // Local filtering & pagination
  const filteredCompanies = useMemo(() => {
    return allCompanies.filter((comp: any) => {
      // Status filter
      if (status !== "all") {
        const compStatus = (comp.status ?? "").toLowerCase();
        const target = status.toLowerCase();
        const isApprovedActive = (target === "approved" || target === "active") && (compStatus === "approved" || compStatus === "active");
        if (compStatus !== target && !isApprovedActive) {
          return false;
        }
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = comp.name?.toLowerCase().includes(q);
        const matchesEmail = comp.email?.toLowerCase().includes(q);
        const matchesDomain = comp.domain?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDomain) {
          return false;
        }
      }
      return true;
    });
  }, [allCompanies, status, search]);

  const totalItems = filteredCompanies.length;
  const companies = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredCompanies.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCompanies, page]);

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<any>();

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStatus = useCallback((v: string) => { setStatus(v); setPage(1); }, []);

  const { data: statsResponse } = useCompanyStats();
  const apiStats = (statsResponse as any)?.data ?? statsResponse ?? { total: 0, active: 0, pending: 0 };

  const stats: StatItem[] = useMemo(() => {
    return [
      { icon: Building2,    value: apiStats.total || 0,   label: t("stats.total"), iconColor: "#0ea5e9", iconBg: "rgba(14,165,233,0.12)" },
      { icon: CheckCircle2, value: apiStats.active || 0,  label: t("stats.active"),  iconColor: "#22c55e", iconBg: "rgba(34,197,94,0.12)"  },
      { icon: Clock,        value: apiStats.pending || 0, label: t("stats.pending"), iconColor: "#f59e0b", iconBg: "rgba(251,191,36,0.12)" },
    ];
  }, [t, apiStats]);

  const columns: TableColumn<any>[] = useMemo(() => [
    {
      key: "name",
      header: t("columns.company"),
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <CompanyAvatar name={row.name} logo={row.logo} />
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
      key: "status",
      header: t("columns.status"),
      render: (row) => <StatusBadge status={row.status} withDot />,
    },
  ], [t]);

  const actions: TableAction<any>[] = useMemo(() => [
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
          data={companies}
          actions={actions}
          actionsHeader={tCommon("actions")}
          emptyMessage={tCommon("noDataFound")}
          isLoading={isLoading || isFetching}
          pagination={{
            currentPage: page,
            pageSize: PAGE_SIZE,
            totalItems: totalItems,
            onPageChange: setPage
          }}
        />
      </div>

      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isLoading={createCompany.isPending}
        onSave={(data) => {
          return createCompany.mutateAsync({
            name: data.companyName,
            domain: data.subdomain ,
            email: data.email,
            fieldOfWork: data.fieldOfWork,
            logo: data.logoFile || null,
          }).then(() => {
            setIsAddModalOpen(false);
            toast.success(t("messages.createSuccess") || "Company added successfully");
          });
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
        isLoading={updateCompany.isPending}
        onUpdate={(id, data) => {
          return updateCompany.mutateAsync({
            id,
            data: {
              name: data.companyName,
              domain: data.subdomain,
              email: data.email,
              fieldOfWork: data.fieldOfWork,
              logo: data.logoFile || null,
            }
          }).then(() => {
            closeModal();
            toast.success(t("messages.updateSuccess") || "Company updated successfully");
          });
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={t("deleteTitle")}
        itemName={selectedRow?.name}
        isLoading={deleteCompany.isPending}
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteCompany.mutate(selectedRow.id, {
              onSuccess: () => {
                closeModal();
                toast.success(t("messages.deleteSuccess") || "Company deleted successfully");
              },
              onError: (error: any) => {
                toast.error(error?.message || t("messages.deleteError") || "Failed to delete company");
              }
            });
          }
        }}
      />
    </div>
  );
}