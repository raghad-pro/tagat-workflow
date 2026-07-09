"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { SearchFilterBar, FilterConfig } from "@/components/molecules/Searchfilterbar";
import { Text } from "@/components/atoms/Text";
import { Eye, Edit2, Trash2, DownloadCloud, TrendingUp, Clock, BarChart3, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";

import { usePayments, usePaymentStats, useDeletePayment } from "../hooks/usePayments";
import { Payment } from "../types/payments.types";

import { AddPaymentModal } from "./AddPaymentModal";
import { EditPaymentModal } from "./EditPaymentModal";
import { ViewPaymentModal } from "./ViewPaymentModal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

export function PaymentsManagementPage() {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  // State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleStatus = useCallback((val: string) => {
    setStatus(val);
    setPage(1);
  }, []);

  // Queries
  const { data: paymentsRes, isLoading, isFetching } = usePayments(user?.role as string, {
    search,
    status,
    page,
    per_page: perPage,
  });

  const { data: statsRes, isLoading: isStatsLoading } = usePaymentStats(user?.role as string);
  const { mutateAsync: deletePayment, isPending: isDeleting } = useDeletePayment(user?.role as string);

  const handleDelete = useCallback(() => {
    if (!paymentToDelete) return;
    deletePayment(paymentToDelete.id).then(() => {
      toast.success(t("messages.deleteSuccess") || "Payment deleted successfully");
      setPaymentToDelete(null);
    }).catch(() => {
      toast.error(t("messages.deleteError") || "Failed to delete payment");
    });
  }, [paymentToDelete, deletePayment, t]);

  // Stats mapped
  const stats: StatItem[] = useMemo(() => {
    const s = statsRes?.data;
    return [
      {
        value: s ? `$${s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
        label: t("stats.totalRevenue") || "Total Revenue",
        icon: TrendingUp,
        iconColor: "#10b981",
        iconBg: "rgba(16,185,129,0.12)",
      },
      {
        value: s ? `$${s.pendingPayments.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00",
        label: t("stats.pendingPayments") || "Pending Payments",
        icon: Clock,
        iconColor: "#f59e0b",
        iconBg: "rgba(251,191,36,0.12)",
      },
      {
        value: s?.transactionVolume.toString() || "0",
        label: t("stats.transactionVolume") || "Transaction Volume",
        icon: BarChart3,
        iconColor: "#0ea5e9",
        iconBg: "rgba(14,165,233,0.12)",
      },
    ];
  }, [statsRes, t]);

  const filters: FilterConfig[] = useMemo(() => [
    {
      value: status,
      onChange: handleStatus,
      options: [
        { value: "all",       label: t("filter.all") || "All Status" },
        { value: "completed", label: t("filter.completed") || "Completed" },
        { value: "pending",   label: t("filter.pending") || "Pending" },
        { value: "failed",    label: t("filter.failed") || "Failed" },
      ],
    },
  ], [status, handleStatus, t]);

  const columns: TableColumn<Payment>[] = useMemo(() => {
    const cols: TableColumn<Payment>[] = [
      {
        key: "invoice",
        header: t("columns.invoice") || "Invoice",
        isPrimary: true,
        render: (row) => (
          <Text size="sm" weight="medium" className="text-[#0ea5e9]">
            #INV-{row.invoice_id}
          </Text>
        ),
      },
      {
        key: "date",
        header: t("columns.date") || "Date",
        hideOnMobile: true,
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.payment_date}</Text>,
      },
      {
        key: "method",
        header: t("columns.method") || "Method",
        hideOnMobile: true,
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.payment_method}</Text>,
      },
      {
        key: "wallet",
        header: t("columns.wallet") || "Wallet",
        hideOnMobile: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <DownloadCloud size={14} className="text-gray-400" />
            <Text size="sm" className="ds-text-gray-200">{row.wallet?.name || "N/A"}</Text>
          </div>
        ),
      },
      {
        key: "amount",
        header: t("columns.amount") || "Amount",
        render: (row) => (
          <Text size="sm" weight="bold" className="ds-text-primary">
            ${Number(row.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        ),
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("columns.company") || "Company",
        render: (row) => (
          <Text size="sm" weight="medium" className="ds-text-primary">
            {row.invoice?.company?.name || "N/A"}
          </Text>
        ),
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  const actions: TableAction<Payment>[] = useMemo(() => [
    {
      icon: Eye,
      label: tCommon("view") || "View",
      onClick: (row) => {
        setSelectedPayment(row);
        setIsViewModalOpen(true);
      },
      colorScheme: "send"
    },
    {
      icon: Edit2,
      label: tCommon("edit") || "Edit",
      onClick: (row) => {
        setSelectedPayment(row);
        setIsEditModalOpen(true);
      },
      colorScheme: "edit",
      hidden: () => user?.role === "client"
    },
    {
      icon: Trash2,
      label: tCommon("delete") || "Delete",
      onClick: (row) => {
        setPaymentToDelete(row);
      },
      colorScheme: "delete",
      hidden: () => user?.role === "client"
    },
  ], [tCommon, user?.role]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[
          {
            label: t("exportReport") || "Export Report",
            onClick: () => {},
            icon: DownloadCloud,
            variant: "outline"
          },
          ...(user?.role !== "client" ? [{
            label: t("add"),
            onClick: () => setIsAddModalOpen(true),
            icon: Plus,
            variant: "solid" as const
          }] : []),
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

        <div className="p-4 sm:p-6 pt-0">
          <DataTable
            columns={columns}
            data={paymentsRes?.data?.data || []}
            actions={actions}
            isLoading={isLoading || isFetching}
            pagination={{
              currentPage: paymentsRes?.data?.current_page || 1,
              pageSize: paymentsRes?.data?.per_page || 10,
              totalItems: paymentsRes?.data?.total || 0,
              onPageChange: setPage,
            }}
          />
        </div>
      </div>

      <AddPaymentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <EditPaymentModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPayment(null);
        }} 
        data={selectedPayment}
      />

      <ViewPaymentModal 
        isOpen={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPayment(null);
        }} 
        data={selectedPayment}
      />

      <DeleteConfirmationModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDelete}
        title={t("deletePaymentTitle") || "Delete Payment"}
        message={t("confirmDelete") || "Are you sure you want to delete this payment?"}
        isLoading={isDeleting}
      />
    </div>
  );
}
