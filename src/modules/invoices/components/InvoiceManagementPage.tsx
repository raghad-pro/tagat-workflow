"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";

// ── Shared atoms ──────────────────────────────────────────────────────────────
import { Text }        from "@/components/atoms/Text";
import { Button }      from "@/components/atoms/Button";
import { StatusBadge } from "@/components/atoms/Statusbadge";

// ── Shared molecules ──────────────────────────────────────────────────────────
import { PageHeader }      from "@/components/molecules/Pageheader";
import { StatsGrid, type StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar, type FilterOption } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn, type TableAction } from "@/components/molecules/Datatable";
import { Pagination }      from "@/components/molecules/Pagination";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import { PageContainer } from "@/components/template/PageContainer";

// ── Local components ──────────────────────────────────────────────────────────
import { CreateInvoiceModal } from "./Createinvoicemodal";
import { ViewInvoiceModal } from "./ViewInvoiceModal";
import { EditInvoiceModal } from "./EditInvoiceModal";
import { useAuth } from "@/providers/AuthProvider";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useInvoices }       from "@/modules/invoices/hooks/useInvoices";
import { useInvoiceStats }   from "@/modules/invoices/hooks/useInvoiceStats";
import { useCreateInvoice }  from "@/modules/invoices/hooks/useCreateInvoice";
import { useUpdateInvoice }  from "@/modules/invoices/hooks/useUpdateInvoice";
import { useDeleteInvoice }  from "@/modules/invoices/hooks/useDeleteInvoice";

// ── Types ─────────────────────────────────────────────────────────────────────
import type {
  Invoice,
  CreateInvoiceRequest,
  InvoiceStatus,
} from "@/modules/invoices/types/invoices.types";
import {
  INVOICE_STATUS_TO_GENERIC,
  INVOICE_STATUS_LABEL,
} from "@/modules/invoices/types/invoices.types";

// ── Icons ─────────────────────────────────────────────────────────────────────
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Eye,
  Edit2,
  Trash2,
} from "@/assets/icons/icons";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InvoiceManagementPage() {
  const t = useTranslations("invoice");
  const tCommon = useTranslations("common");

  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [showModal, setShowModal]       = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInvoice, setEditInvoice]   = useState<Invoice | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewInvoice, setViewInvoice]   = useState<Invoice | null>(null);

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  const statusFilterOptions: FilterOption[] = useMemo(() => [
    { value: "all",     label: t("filter.all") },
    { value: "paid",    label: t("filter.paid") },
    { value: "pending", label: t("filter.pending") },
    { value: "overdue", label: t("filter.overdue") },
  ], [t]);

  // ── Data ────────────────────────────────────────────────────────────────────
  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
  } = useInvoices({ 
    search, 
    status: statusFilter === "all" ? undefined : statusFilter, 
    page: currentPage, 
    per_page: PAGE_SIZE 
  });

  const { data: statsData, isLoading: isStatsLoading } = useInvoiceStats();

  // ── Mutations ────────────────────────────────────────────────────────────────
  const { mutate: createInvoice, isPending: isCreating } = useCreateInvoice();
  const { mutate: updateInvoice, isPending: isUpdating } = useUpdateInvoice();
  const { mutate: deleteInvoice }                        = useDeleteInvoice();

  const invoices   = invoicesData?.data ?? [];
  const total      = invoicesData?.total ?? 0;
  const totalPages = invoicesData?.last_page ?? 1;

  // ── Stats cards ─────────────────────────────────────────────────────────────
  const stats: StatItem[] = useMemo(() => [
    {
      icon:      FileText,
      value:     statsData?.total   ?? 0,
      label:     t("stats.total"),
      iconColor: "var(--color-icon-indigo)",
      iconBg:    "var(--color-icon-indigo-bg)",
    },
    {
      icon:      CheckCircle2,
      value:     statsData?.paid    ?? 0,
      label:     t("stats.paid"),
      iconColor: "var(--color-icon-success)",
      iconBg:    "var(--color-icon-success-bg)",
    },
    {
      icon:      Clock,
      value:     statsData?.pending ?? 0,
      label:     t("stats.pending"),
      iconColor: "var(--color-icon-warning)",
      iconBg:    "var(--color-icon-warning-bg)",
    },
    {
      icon:      XCircle,
      value:     statsData?.overdue ?? 0,
      label:     t("stats.overdue"),
      iconColor: "var(--color-icon-danger)",
      iconBg:    "var(--color-icon-danger-bg)",
    },
  ], [statsData, t]);

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: TableColumn<Invoice>[] = useMemo(() => {
    const cols: TableColumn<Invoice>[] = [
      {
        key:       "id", // or invoiceNumber if they provide it
        header:    t("columns.number"),
        isPrimary: true,
        render: (row) => (
          <Text size="sm" weight="medium" color="brand" tag="p" className="cursor-pointer hover:underline">
            #{row.id}
          </Text>
        ),
      },
      {
        key:    "invoice_date",
        header: t("columns.issueDate"),
        render: (row) => <Text size="sm" color="gray-100" tag="p">{row.invoice_date}</Text>,
      },
      {
        key:    "due_date",
        header: t("columns.dueDate"),
        render: (row) => <Text size="sm" color="gray-100" tag="p">{row.due_date}</Text>,
      },
      {
        key:    "amount",
        header: t("columns.amount"),
        render: (row) => (
          <Text size="sm" weight="medium" tag="p">
            {row.currency?.symbol ?? "$"}{Number(row.amount).toLocaleString('en-US')}
          </Text>
        ),
      },
      {
        key:    "status",
        header: t("columns.status"),
        render: (row) => (
          <StatusBadge
            status={INVOICE_STATUS_TO_GENERIC[row.status] ?? "pending"}
            label={INVOICE_STATUS_LABEL[row.status] ?? row.status}
          />
        ),
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key:    "company",
        header: t("columns.company"),
        render: (row) => <Text size="sm" tag="p">{row.company?.name ?? "—"}</Text>,
      });
    }

    // Always show client
    cols.splice(!isCompanyAdmin ? 2 : 1, 0, {
      key:    "client",
      header: t("columns.client") || "Client",
      render: (row) => <Text size="sm" tag="p">{row.client?.name ?? "—"}</Text>,
    });

    return cols;
  }, [t, isCompanyAdmin]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const actions: TableAction<Invoice>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: (row) => { setViewInvoice(row); setShowViewModal(true); } },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: (row) => { setEditInvoice(row); setShowEditModal(true); } },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: (row) => deleteInvoice(row.id) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [deleteInvoice, tCommon]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setCurrentPage(1);
  }, []);

  const handleStatus = useCallback((v: string) => {
    setStatusFilter(v);
    setCurrentPage(1);
  }, []);

  const handleCreate = useCallback(
    (data: CreateInvoiceRequest, form: any) => {
      createInvoice(data, {
        onSuccess: () => setShowModal(false),
        onError: (error: any) => {
          const errors = error.response?.data?.errors;
          if (errors?.remaining_budget) {
            form.setError("amount", {
              type: "server",
              message: t("budgetExceeded", { budget: errors.remaining_budget }) || `You have exceeded the budget. Remaining: ${errors.remaining_budget}`,
            });
          }
        }
      });
    },
    [createInvoice, t]
  );

  const handleUpdate = useCallback(
    (id: number | string, data: Partial<CreateInvoiceRequest>, form: any) => {
      updateInvoice({ id, data }, {
        onSuccess: () => {
          setShowEditModal(false);
          setEditInvoice(null);
        },
        onError: (error: any) => {
          const errors = error.response?.data?.errors;
          if (errors?.remaining_budget) {
            form.setError("amount", {
              type: "server",
              message: t("budgetExceeded", { budget: errors.remaining_budget }) || `You have exceeded the budget. Remaining: ${errors.remaining_budget}`,
            });
          }
        }
      });
    },
    [updateInvoice, t]
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  const isInitialLoading = isInvoicesLoading || isStatsLoading;

  return (
    <PageContainer isLoading={isInitialLoading} skeletonVariant="dashboard">

      {/* Header */}
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[
          {
            label:   t("add"),
            onClick: () => setShowModal(true),
            icon:    Plus,
          },
        ]}
      />

      {/* Stats */}
      <StatsGrid stats={stats} cols={4} />

      {/* Table Card */}
      <PageCard>
        <PageCardSection>
          <SearchFilterBar
            search={search}
            onSearchChange={handleSearch}
            searchPlaceholder={t("searchPlaceholder")}
            filters={[
              {
                value:    statusFilter,
                onChange: handleStatus,
                options:  statusFilterOptions,
              },
            ]}
          />
        </PageCardSection>

        <PageCardBody>
          <DataTable
            columns={columns}
            data={invoices}
            actions={actions}
            actionsHeader="Actions"
            isLoading={isInvoicesFetching}
            emptyMessage="No invoices found."
          />
        </PageCardBody>

        <PageCardFooter>
          <Pagination
            currentPage={currentPage}
            data={Array(total).fill(0)}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </PageCardFooter>
      </PageCard>

      {/* Modal */}
      <CreateInvoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreate}
        isPending={isCreating}
      />

      {/* Edit Modal */}
      {editInvoice && (
        <EditInvoiceModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditInvoice(null); }}
          onSave={(data: any, form: any) => handleUpdate(editInvoice.id, data, form)}
          isPending={isUpdating}
          invoice={editInvoice}
        />
      )}

      {/* View Modal */}
      <ViewInvoiceModal
        isOpen={showViewModal}
        onClose={() => { setShowViewModal(false); setViewInvoice(null); }}
        invoiceId={viewInvoice?.id || null}
      />

    </PageContainer>
  );
}

