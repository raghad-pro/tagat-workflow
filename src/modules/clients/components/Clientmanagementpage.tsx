"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { SearchFilterBar, type FilterOption } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import { StatsGrid, type StatItem } from "@/components/molecules/Statsgrid";
import { Text } from "@/components/atoms/Text";
import {
  Plus,
  Users,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Eye,
  Edit2,
  Trash2,
} from "@/assets/icons/icons";
import { ClientAvatar } from "@/components/atoms/Clientavatar";

import { AddClientModal }          from "./Addclientmodal";
import { ViewClientModal }         from "./Viewclientmodal";
import { EditClientModal }         from "./Editclientmodal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

import { useClients }            from "@/modules/clients/hooks/useClients";
import { useClientStats }        from "@/modules/clients/hooks/useClientstats";
import { useAddClient }          from "@/modules/clients/hooks/useAddclient";
import { useDeleteClient }       from "@/modules/clients/hooks/useDeleteclient";
import { useUpdateClientStatus } from "@/modules/clients/hooks/useupdateclientstatus";
import { useCompanies }          from "@/modules/companies/hooks/useCompanies";

import type {
  AddClientFormValues,
  UpdateClientStatusRequest,
} from "@/modules/clients/types/clients.types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type PivotStatus = "pending" | "approved" | "rejected" | "active";

interface NormalizedClient {
  id:            number;
  name:          string;
  email:         string;
  companies:     Array<{ id: number; name: string; pivot: { status: PivotStatus } }>;
  primaryStatus: PivotStatus;
  createdAt:     string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all",      label: "All cases" },
  { value: "approved", label: "Approved"  },
  { value: "pending",  label: "Pending"   },
  { value: "rejected", label: "Rejected"  },
];

const STATUS_CONFIG: Record<PivotStatus, { bg: string; color: string; dot: string }> = {
  approved: { bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  active:   { bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  pending:  { bg: "rgba(245,158,11,0.12)", color: "#d97706", dot: "#f59e0b" },
  rejected: { bg: "rgba(239,68,68,0.10)",  color: "#dc2626", dot: "#ef4444" },
};

// ─── Status Pill ───────────────────────────────────────────────────────────────
function PivotStatusPill({ status }: { status: PivotStatus }) {
  const cfg   = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {label}
    </span>
  );
}

// ─── Normalize raw API client ──────────────────────────────────────────────────
function normalizeClient(raw: any): NormalizedClient {
  const companies = (raw.companies ?? []).map((c: any) => ({
    id:    c.id,
    name:  c.name,
    pivot: { status: (c.pivot?.status ?? raw.status ?? "pending") as PivotStatus },
  }));

  const statusVal = (
    raw.status ??
    (companies.length > 0 ? companies[0].pivot.status : null) ??
    "pending"
  ).toLowerCase() as PivotStatus;

  return {
    id:            raw.id,
    name:          raw.name ?? raw.user?.name ?? "Unknown Client",
    email:         raw.user?.email ?? raw.email ?? "",
    companies,
    primaryStatus: statusVal,
    createdAt:     raw.created_at ?? "",
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ClientManagementPage() {
  const t       = useTranslations("client");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  // ── Filters state ────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [addOpen,      setAddOpen]      = useState(false);
  const [viewClient,   setViewClient]   = useState<NormalizedClient | null>(null);
  const [editClient,   setEditClient]   = useState<NormalizedClient | null>(null);
  const [deleteClient, setDeleteClient] = useState<NormalizedClient | null>(null);

  // ── Data — fetch all clients for local search & status filtering ──────────────
  const { data: rawData, isLoading, isFetching } = useClients({
    page:     1,
    per_page: 1000,
  } as any);

  const { data: companiesResponse } = useCompanies({ per_page: 50, page: 1 } as any);
  const companiesList = companiesResponse?.data?.data || [];

  const { data: stats, isLoading: statsLoading } = useClientStats();

  const { mutate: addClient,    isPending: isAdding   } = useAddClient();
  const { mutate: removeClient, isPending: isDeleting } = useDeleteClient();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateClientStatus();

  // ── Normalize ─────────────────────────────────────────────────────────────────
  const allClients: NormalizedClient[] = (rawData?.data?.data ?? []).map(normalizeClient);
  
  // ── Local Filtering & Pagination ──────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    let list = [...allClients];
    list.sort((a, b) => b.id - a.id); // Sort newest first

    return list.filter((client) => {
      // Status filter
      if (statusFilter !== "all") {
        const target = statusFilter.toLowerCase().trim();
        const primaryStatus = (client.primaryStatus ?? "").toLowerCase();

        const primaryMatch = primaryStatus === target;
        const companyMatch = client.companies.some(
          (c) => (c.pivot?.status ?? "").toLowerCase() === target
        );
        const activeApprovedMatch =
          (target === "approved" || target === "active") &&
          (primaryStatus === "active" || primaryStatus === "approved");

        if (!primaryMatch && !companyMatch && !activeApprovedMatch) {
          return false;
        }
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = client.name.toLowerCase().includes(q);
        const matchesEmail = client.email.toLowerCase().includes(q);
        const matchesCompany = client.companies.some((c) => c.name.toLowerCase().includes(q));
        if (!matchesName && !matchesEmail && !matchesCompany) {
          return false;
        }
      }

      return true;
    });
  }, [allClients, statusFilter, search]);

  const total = filteredClients.length;
  const clients = filteredClients.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSearch = (v: string) => { setSearch(v);       setCurrentPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

  const handleAdd = (data: AddClientFormValues) => {
    addClient(data, { onSuccess: () => setAddOpen(false) });
  };

  const handleDelete = () => {
    if (!deleteClient) return;
    const company_id = deleteClient.companies[0]?.id ?? 1;
    removeClient(
      { id: deleteClient.id, company_id },
      { onSuccess: () => setDeleteClient(null) }
    );
  };

  const handleUpdateStatus = (id: number, data: UpdateClientStatusRequest) => {
    updateStatus(
      { id, data },
      { onSuccess: () => setEditClient(null) }
    );
  };

  // ── Stats cards ───────────────────────────────────────────────────────────────
  const statCards: StatItem[] = [
    {
      icon:      Users,
      value:     stats?.total    ?? 0,
      label:     "Total Clients",
      iconColor: "var(--color-primary)",
      iconBg:    "var(--color-bg-primary-200)",
    },
    {
      icon:      ShieldCheck,
      value:     stats?.approved ?? 0,
      label:     "Approved",
      iconColor: "#059669",
      iconBg:    "rgba(52,211,153,0.12)",
    },
    {
      icon:      Clock,
      value:     stats?.pending  ?? 0,
      label:     "Pending",
      iconColor: "#d97706",
      iconBg:    "rgba(251,191,36,0.12)",
    },
    {
      icon:      ShieldAlert,
      value:     stats?.rejected ?? 0,
      label:     "Rejected",
      iconColor: "#dc2626",
      iconBg:    "rgba(239,68,68,0.10)",
    },
  ];

  // ── Table columns ─────────────────────────────────────────────────────────────
  const columns: TableColumn<NormalizedClient>[] = [
    {
      key:       "name",
      header:    "Client Name",
      isPrimary: true,
      width:     isSuperAdmin ? "40%" : "60%",
      render: (row) => (
        <div className="flex items-center gap-3">
          <ClientAvatar name={row.name} />
          <div className="min-w-0">
            <Text size="sm" weight="medium" tag="p" className="truncate">
              {row.name}
            </Text>
            <Text size="sm" color="gray-200" tag="p" className="text-[12px] truncate">
              {row.email}
            </Text>
          </div>
        </div>
      ),
    },
    // Companies column — super_admin only
    ...(isSuperAdmin
      ? [{
          key:    "companies",
          header: "Companies",
          width:  "30%",
          render: (row: NormalizedClient) =>
            row.companies.length === 0 ? (
              <Text size="sm" color="gray-200" tag="p">—</Text>
            ) : (
              <div className="flex flex-col gap-1 min-w-0">
                {row.companies.map((c) => (
                  <Text key={c.id} size="sm" tag="p" className="truncate">{c.name}</Text>
                ))}
              </div>
            ),
        } as TableColumn<NormalizedClient>]
      : []),
    {
      key:    "status",
      header: "Status",
      width:  isSuperAdmin ? "20%" : "25%",
      render: (row) => {
        const toShow = !isSuperAdmin
          ? row.companies.filter((c) => c.id === user?.company_id)
          : row.companies;

        if (toShow.length === 0) {
          return (
            <div className="flex items-start">
              <PivotStatusPill status="pending" />
            </div>
          );
        }

        return (
          <div className="flex flex-col items-start gap-1">
            {toShow.map((c) => (
              <PivotStatusPill key={c.id} status={c.pivot.status} />
            ))}
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      icon:        Eye,
      label:       "View",
      colorScheme: "send" as const,
      onClick:     (row: NormalizedClient) => setViewClient(row),
    },
    {
      icon:        Edit2,
      label:       "Edit Status",
      colorScheme: "edit" as const,
      onClick:     (row: NormalizedClient) => setEditClient(row),
    },
    {
      icon:        Trash2,
      label:       "Remove",
      colorScheme: "delete" as const,
      onClick:     (row: NormalizedClient) => setDeleteClient(row),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <PageContainer
        isLoading={isLoading || statsLoading}
        skeletonVariant="dashboard"
        skeletonRows={PAGE_SIZE}
      >
        <PageHeader
          title="Client Management"
          subtitle="View and manage all platform clients"
          actions={[
            {
              label:   "Add a new Client",
              icon:    Plus,
              onClick: () => setAddOpen(true),
            },
          ]}
        />

        <StatsGrid stats={statCards} cols={4} />

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={handleSearch}
              searchPlaceholder="Search by name, email or company..."
              filters={[
                {
                  value:    statusFilter,
                  onChange: handleStatus,
                  options:  STATUS_OPTIONS,
                },
              ]}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={clients}
              actions={actions}
              actionsHeader="Actions"
              isLoading={isFetching}
              emptyMessage="No clients found."
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              data={Array(total).fill(0)}
              onPageChange={setCurrentPage}
            />
          </PageCardFooter>
        </PageCard>
      </PageContainer>

      {/* Add Modal */}
      <AddClientModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        isPending={isAdding}
        isSuperAdmin={isSuperAdmin}
        companies={companiesList}
      />

      {/* View Modal */}
      <ViewClientModal
        isOpen={!!viewClient}
        onClose={() => setViewClient(null)}
        client={viewClient}
      />

      {/* Edit Modal */}
      <EditClientModal
        isOpen={!!editClient}
        onClose={() => setEditClient(null)}
        data={editClient}
        onUpdate={handleUpdateStatus}
        isPending={isUpdating}
        isCompanyAdmin={!isSuperAdmin}
        userCompanyId={user?.company_id ?? undefined}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteClient}
        onClose={() => setDeleteClient(null)}
        title={t("deleteTitle")}
        itemName={deleteClient?.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  );
}