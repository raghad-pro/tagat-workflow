"use client";

import React, { useState } from "react";
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
import { StatusBadge } from "@/components/atoms/Statusbadge";

import { AddClientModal } from "./Addclientmodal";
import { ViewClientModal } from "./Viewclientmodal";
import { EditClientModal } from "./Editclientmodal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

import { useClients } from "@/modules/clients/hooks/useClients";
import { useClientStats } from "@/modules/clients/hooks/useClientstats";
import { useAddClient } from "@/modules/clients/hooks/useAddclient";
import { useDeleteClient } from "@/modules/clients/hooks/useDeleteclient";
import { useUpdateClientStatus } from "@/modules/clients/hooks/useupdateclientstatus";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";

import type {
  AddClientFormValues,
  UpdateClientStatusRequest,
} from "@/modules/clients/types/clients.types";

// ─── types ─────────────────────────────────────────────────────────────────────
// النوع المبسط اللي بنتعامل معه داخل الـ page
type PivotStatus = "pending" | "approved" | "rejected";

type NormalizedClient = {
  id: number;
  name: string;
  email: string;
  companies: Array<{
    id: number;
    name: string;
    pivot: { status: PivotStatus };
  }>;
  // الحالة الرئيسية للعرض (أول شركة أو pending)
  primaryStatus: PivotStatus;
  createdAt: string;
};

// ─── constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

const STATUS_OPTIONS: FilterOption[] = [
  { value: "all",      label: "All cases" },
  { value: "approved", label: "Approved" },
  { value: "pending",  label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

// ─── status badge styles (approved/pending/rejected) ──────────────────────────
const STATUS_CONFIG: Record<PivotStatus, { bg: string; color: string; dot: string }> = {
  approved: { bg: "rgba(52,211,153,0.12)", color: "#059669",              dot: "#34d399" },
  pending:  { bg: "rgba(251,191,36,0.12)", color: "#d97706",              dot: "#f59e0b" },
  rejected: { bg: "rgba(239,68,68,0.10)", color: "var(--color-error)",    dot: "#ef4444" },
};

function PivotStatusPill({ status }: { status: PivotStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
      {label}
    </span>
  );
}

// ─── helper: normalize raw API client ─────────────────────────────────────────
function normalizeClient(raw: any): NormalizedClient {
  const companies = (raw.companies ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    pivot: { status: (c.pivot?.status ?? "pending") as PivotStatus },
  }));

  const primaryStatus: PivotStatus =
    companies.length > 0 ? companies[0].pivot.status : "pending";

  return {
    id: raw.id,
    name: raw.name,
    email: raw.user?.email ?? raw.email ?? "",
    companies,
    primaryStatus,
    createdAt: raw.created_at ?? "",
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ClientManagementPage() {
  const t = useTranslations("client");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);

  // modal state
  const [addOpen,    setAddOpen]    = useState(false);
  const [viewClient, setViewClient] = useState<NormalizedClient | null>(null);
  const [editClient, setEditClient] = useState<NormalizedClient | null>(null);
  const [deleteClient, setDeleteClient] = useState<NormalizedClient | null>(null);

  // ── data ────────────────────────────────────────────────────────────────────
  const { data: rawData, isLoading, isFetching } = useClients({});
  const { data: stats, isLoading: statsLoading }  = useClientStats();

  const { mutate: addClient,    isPending: isAdding }   = useAddClient();
  const { mutate: removeClient, isPending: isDeleting } = useDeleteClient();
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateClientStatus();

  // ── normalize + filter client-side ──────────────────────────────────────────
  const allClients: NormalizedClient[] = (rawData?.data?.data ?? []).map(normalizeClient);

  const filtered = allClients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companies.some((comp) => comp.name.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === "all" ||
      c.companies.some((comp) => comp.pivot.status === statusFilter);

    return matchSearch && matchStatus;
  });

  const total      = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageData   = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleSearch = (v: string) => { setSearch(v);       setCurrentPage(1); };
  const handleStatus = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

  const handleAdd = (data: AddClientFormValues) => {
    addClient(data, { onSuccess: () => setAddOpen(false) });
  };

  const handleDelete = () => {
    if (!deleteClient) return;
    // نستخدم أول شركة مرتبطة كـ company_id — لو ما في نستخدم 1
    const company_id = deleteClient.companies[0]?.id ?? 1;
    removeClient(
      { id: deleteClient.id, company_id },
      { onSuccess: () => setDeleteClient(null) }
    );
  };

  const handleUpdateStatus = (
    id: number,
    data: UpdateClientStatusRequest
  ) => {
    updateStatus(
      { id, data },
      { onSuccess: () => setEditClient(null) }
    );
  };

  // ── stats cards ──────────────────────────────────────────────────────────────
  const statCards: StatItem[] = [
    {
      icon:      Users,
      value:     stats?.total ?? 0,
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
      value:     stats?.pending ?? 0,
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

  // ── table columns ────────────────────────────────────────────────────────────
  const columns: TableColumn<NormalizedClient>[] = [
    {
      key:       "name",
      header:    "Client Name",
      isPrimary: true,
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
    // عمود الشركات — للـ super_admin بس
    ...(!isCompanyAdmin
      ? [{
          key:    "companies",
          header: "Companies",
          render: (row: NormalizedClient) =>
            row.companies.length === 0 ? (
              <Text size="sm" color="gray-200" tag="p">—</Text>
            ) : (
              <div className="flex flex-col gap-1">
                {row.companies.map((c) => (
                  <Text key={c.id} size="sm" tag="p">{c.name}</Text>
                ))}
              </div>
            ),
        } as TableColumn<NormalizedClient>]
      : []),
    {
      key:    "status",
      header: "Status",
      render: (row) => {
        // الـ company_admin بيشوف حالته هو فقط
        const toShow = isCompanyAdmin
          ? row.companies.filter((c) => c.id === user?.company_id)
          : row.companies;

        if (toShow.length === 0)
          return <PivotStatusPill status="pending" />;

        return (
          <div className="flex flex-col gap-1">
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

  // ── render ───────────────────────────────────────────────────────────────────
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
                  value:   statusFilter,
                  onChange: handleStatus,
                  options: STATUS_OPTIONS,
                },
              ]}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={pageData}
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

      {/* ── Add Modal ── */}
      <AddClientModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
        isPending={isAdding}
      />

      {/* ── View Modal ── */}
      <ViewClientModal
        isOpen={!!viewClient}
        onClose={() => setViewClient(null)}
        data={viewClient}
      />

      {/* ── Edit / Update Status Modal ── */}
      <EditClientModal
        isOpen={!!editClient}
        onClose={() => setEditClient(null)}
        data={editClient}
        onUpdate={handleUpdateStatus}
        isPending={isUpdating}
      />

      {/* ── Delete Confirm ── */}
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