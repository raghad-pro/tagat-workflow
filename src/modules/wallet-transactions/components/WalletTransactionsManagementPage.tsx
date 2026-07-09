"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { SearchFilterBar, FilterConfig } from "@/components/molecules/Searchfilterbar";
import { Eye, Edit2, Trash2, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";

import { useWalletTransactions, useWalletTransactionStats, useDeleteWalletTransaction } from "../hooks/useWalletTransactions";
import { WalletTransaction } from "../types/wallet-transactions.types";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { AddTransactionModal } from "./AddTransactionModal";
import { EditTransactionModal } from "./EditTransactionModal";
import { ViewTransactionModal } from "./ViewTransactionModal";

export function WalletTransactionsManagementPage() {
  const t = useTranslations("walletTransactions"); // assuming translation exists, fallback to English
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  // State
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<WalletTransaction | null>(null);

  const handleSearch = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
  }, []);

  const handleTypeFilter = useCallback((val: string) => {
    setType(val);
    setPage(1);
  }, []);

  // Queries
  const { data: transactionsRes, isLoading, isFetching } = useWalletTransactions({
    search,
    type,
    page,
    per_page: perPage,
  });
  const data = transactionsRes?.data;

  const { mutateAsync: deleteTransaction, isPending: isDeleting } = useDeleteWalletTransaction();

  const handleDelete = useCallback(() => {
    if (!transactionToDelete) return;
    deleteTransaction(transactionToDelete.id).then(() => {
      toast.success(t("messages.deleteSuccess") || "Transaction deleted successfully");
      setTransactionToDelete(null);
    }).catch((error: any) => {
      const errorMsg = error.response?.data?.message || error.message || "Failed to delete transaction";
      toast.error(errorMsg);
    });
  }, [transactionToDelete, deleteTransaction, t]);

  // Stats mapped
  const stats: StatItem[] = useMemo(() => {
    const transactions = data?.data || [];
    let income = 0;
    let expenses = 0;

    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      const typeStr = tx.type.toLowerCase();
      if (typeStr === "income" || typeStr === "funding" || typeStr === "assets" || typeStr === "transfer_in") {
        income += amount;
      } else if (typeStr === "expenses" || typeStr === "withdraw" || typeStr === "salary" || typeStr === "transfer" || typeStr === "transfer_out") {
        expenses += amount;
      }
    });

    const totalVolume = income + expenses;

    return [
      {
        label: t("stats.totalVolume") || "Total volume",
        value: `$${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: Activity,
        trend: { value: 0, label: "", isPositive: true },
        variant: "default",
      },
      {
        label: t("stats.income") || "Income",
        value: `$${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: ArrowDownRight, // Money coming in
        trend: { value: 0, label: "", isPositive: true },
        variant: "success",
      },
      {
        label: t("stats.expenses") || "Expenses",
        value: `$${expenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        icon: ArrowUpRight, // Money going out
        trend: { value: 0, label: "", isPositive: false },
        variant: "danger",
      },
    ];
  }, [data, t]);

  // Filter config
  const filters: FilterConfig[] = useMemo(() => [
    {
      options: [
        { label: t("filters.all") || "All cases", value: "all" },
        { label: t("filters.income") || "Income", value: "income" },
        { label: t("filters.funding") || "Funding", value: "funding" },
        { label: t("filters.assets") || "Assets", value: "assets" },
        { label: t("filters.expenses") || "Expenses", value: "expenses" },
      ],
      value: type,
      onChange: handleTypeFilter,
    },
  ], [type, handleTypeFilter, t]);

  // Table Columns
  const columns: TableColumn<WalletTransaction>[] = useMemo(() => {
    const cols: TableColumn<WalletTransaction>[] = [
      {
        key: "transaction_date",
        header: t("table.date") || "Date",
        render: (row) => {
          const date = new Date(row.transaction_date);
          return <span>{date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>;
        },
      },
      {
        key: "wallet",
        header: t("table.wallet") || "Wallet",
        render: (row) => <span>{row.wallet?.name || "-"}</span>,
      },
      {
        key: "amount",
        header: t("table.amount") || "Amount",
        render: (row) => {
          const amountNum = parseFloat(row.amount);
          const isPositive = amountNum > 0;
          return (
            <span className="font-semibold text-gray-700">
              {isPositive ? "+" : ""}${Math.abs(amountNum).toFixed(2)}
            </span>
          );
        },
      },
      {
        key: "type",
        header: t("table.type") || "Type",
        render: (row) => {
          const typeStr = row.type.toLowerCase();
          let colorClass = "ds-bg-plan-basic ds-text-plan-basic";
          let dotStyle = { backgroundColor: "var(--color-plan-basic)" };
          
          if (typeStr === "income" || typeStr === "assets") {
            colorClass = "ds-invoice-paid";
            dotStyle = { backgroundColor: "var(--color-invoice-paid)" };
          } else if (typeStr === "funding") {
            colorClass = "ds-invoice-pending";
            dotStyle = { backgroundColor: "var(--color-invoice-pending)" };
          } else if (typeStr === "expenses" || typeStr === "withdraw") {
            colorClass = "ds-invoice-overdue";
            dotStyle = { backgroundColor: "var(--color-invoice-overdue)" };
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${colorClass}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={dotStyle}></span>
              {row.type}
            </span>
          );
        },
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("table.company") || "Company",
        render: (row) => <span>{row.wallet?.company?.name || "-"}</span>,
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  // Actions
  const actions: TableAction<WalletTransaction>[] = useMemo(() => [
    {
      icon: Eye,
      label: tCommon("view") || "View",
      onClick: (row) => {
        setSelectedTransaction(row);
        setIsViewModalOpen(true);
      },
      colorScheme: "send"
    },
    {
      icon: Edit2,
      label: tCommon("edit") || "Edit",
      onClick: (row) => {
        setSelectedTransaction(row);
        setIsEditModalOpen(true);
      },
      colorScheme: "edit",
      hidden: (row) => row.type.toLowerCase() === "transfer_in"
    },
    {
      icon: Trash2,
      label: tCommon("delete") || "Delete",
      onClick: (row) => {
        setTransactionToDelete(row);
      },
      colorScheme: "delete"
    },
  ], [tCommon]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader
        title={t("title") === "walletTransactions.title" ? "Transactions Management" : t("title")}
        subtitle={t("description") === "walletTransactions.description" ? "Manage and monitor all wallet transactions." : t("description")}
        actions={[
          {
            label: t("addTransaction") === "walletTransactions.addTransaction" ? "Add Transactions" : t("addTransaction"),
            onClick: () => setIsAddModalOpen(true),
          }
        ]}
      />

      <StatsGrid 
        stats={stats} 
        cols={stats.length as 2 | 3 | 4}
      />

      <div className="rounded-2xl ds-bg-form flex flex-col mt-6" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: "var(--color-border-form)" }}>
          <SearchFilterBar
            search={search}
            onSearchChange={handleSearch}
            filters={filters}
            searchPlaceholder={t("searchPlaceholder") || "Searching..."}
          />
        </div>

        <DataTable
          data={transactionsRes?.data?.data || []}
          columns={columns}
          actions={actions}
          isLoading={isLoading || isFetching}
          pagination={{
            currentPage: page,
            totalItems: transactionsRes?.data?.total || 0,
            pageSize: transactionsRes?.data?.per_page || 10,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Modals */}
      <AddTransactionModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      <EditTransactionModal 
        isOpen={isEditModalOpen} 
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTransaction(null);
        }} 
        data={selectedTransaction}
      />

      <ViewTransactionModal 
        isOpen={isViewModalOpen} 
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTransaction(null);
        }} 
        transactionId={selectedTransaction?.id || null}
      />

      <DeleteConfirmationModal
        isOpen={!!transactionToDelete}
        onClose={() => setTransactionToDelete(null)}
        onConfirm={handleDelete}
        title={t("deleteTitle") || "Delete Transaction"}
        message={t("confirmDelete") || "Are you sure you want to delete this transaction?"}
        isLoading={isDeleting}
      />
    </div>
  );
}
