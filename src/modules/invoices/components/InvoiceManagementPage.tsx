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
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const isClient = user?.role === "client";

  const statusFilterOptions: FilterOption[] = useMemo(() => [
    { value: "all",     label: t("filter.all") || "All Invoices" },
    { value: "paid",    label: t("filter.paid") || "Paid" },
    { value: "unpaid",  label: t("filter.unpaid") || "Unpaid" },
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
  const { mutate: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();

  const invoices   = invoicesData?.data ?? [];
  const total      = invoicesData?.total ?? 0;
  const totalPages = invoicesData?.last_page ?? 1;

  // Local filtering to support instant search on current page data
  const displayedInvoices = useMemo(() => {
    if (!search) return invoices;
    const lowerSearch = search.toLowerCase();
    return invoices.filter(inv => {
      return (
        inv.company?.name?.toLowerCase().includes(lowerSearch) ||
        inv.client?.name?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [invoices, search]);

  const localStats = useMemo(() => {
    const total = displayedInvoices.length;
    const paid = displayedInvoices.filter(i => i.status === 'paid').length;
    const unpaid = total - paid;
    return { total, paid, unpaid };
  }, [displayedInvoices]);

  // ── Stats cards ─────────────────────────────────────────────────────────────
  const stats: StatItem[] = useMemo(() => [
    {
      icon:      FileText,
      value:     localStats.total,
      label:     t("stats.total"),
      iconColor: "var(--color-icon-indigo)",
      iconBg:    "var(--color-icon-indigo-bg)",
    },
    {
      icon:      CheckCircle2,
      value:     localStats.paid,
      label:     t("stats.paid"),
      iconColor: "var(--color-icon-success)",
      iconBg:    "var(--color-icon-success-bg)",
    },
    {
      icon:      XCircle,
      value:     localStats.unpaid,
      label:     t("stats.unpaid") || "Unpaid",
      iconColor: "var(--color-icon-danger)",
      iconBg:    "var(--color-icon-danger-bg)",
    },
  ], [localStats, t]);

  // ── Columns ─────────────────────────────────────────────────────────────────
  const columns: TableColumn<Invoice>[] = useMemo(() => {
    const cols: TableColumn<Invoice>[] = [
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
      cols.unshift({
        key:    "company",
        header: t("columns.company"),
        isPrimary: true,
        render: (row) => <Text size="sm" weight="medium" color="primary" tag="p">{row.company?.name ?? "—"}</Text>,
      });
    }

    // Only show client column if the user is NOT a client
    if (!isClient) {
      cols.splice(!isCompanyAdmin ? 1 : 0, 0, {
        key:    "client",
        header: t("columns.client") || "Client",
        isPrimary: isCompanyAdmin,
        render: (row) => (
          <Text size="sm" weight={isCompanyAdmin ? "medium" : "regular"} color={isCompanyAdmin ? "primary" : "gray-100"} tag="p">
            {row.client?.name ?? "—"}
          </Text>
        ),
      });
    }

    return cols;
  }, [t, isCompanyAdmin, isClient]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const actions: TableAction<Invoice>[] = useMemo(() => {
    const baseActions = [
      { icon: Eye,    label: tCommon("view"),   colorScheme: "send" as const, onClick: (row: Invoice) => { setViewInvoice(row); setShowViewModal(true); } }
    ];
    
    if (!isClient) {
      baseActions.push(
        { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit" as const, onClick: (row: Invoice) => { setEditInvoice(row); setShowEditModal(true); } },
        { icon: Trash2, label: tCommon("delete"), colorScheme: "delete" as const, onClick: (row: Invoice) => { setInvoiceToDelete(row); setShowDeleteModal(true); } }
      );
    }
    
    return baseActions;
  }, [deleteInvoice, tCommon, isClient]);

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
  // Removing full-page skeleton to show UI immediately. DataTable has its own loading spinner.
  return (
    <PageContainer isLoading={false} skeletonVariant="dashboard">

      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={!isClient ? [
          {
            label:   t("add"),
            onClick: () => setShowModal(true),
            icon:    Plus,
          },
        ] : undefined}
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
            filters={!isClient ? [
              {
                value:    statusFilter,
                onChange: handleStatus,
                options:  statusFilterOptions,
              },
            ] : []}
          />
        </PageCardSection>

        <PageCardBody>
          <DataTable
            columns={columns}
            data={displayedInvoices}
            actions={actions}
            actionsHeader={tCommon("actions") || "Actions"}
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setInvoiceToDelete(null); }}
        onConfirm={() => {
          if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id, {
              onSuccess: () => {
                setShowDeleteModal(false);
                setInvoiceToDelete(null);
              }
            });
          }
        }}
        title={tCommon("delete") || "Delete Invoice"}
        itemName={invoiceToDelete ? `#INV-${invoiceToDelete.id}` : ""}
        isLoading={isDeleting}
      />

    </PageContainer>
  );
}

