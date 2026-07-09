"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet as WalletIcon, DollarSign, Euro, CheckCircle2, Clock, Eye, Edit2, Trash2, DownloadCloud, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar, FilterConfig } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { Text } from "@/components/atoms/Text";
import { AddWalletModal } from "./AddWalletModal";
import { ViewWalletModal } from "./ViewWalletModal";
import { EditWalletModal } from "./EditWalletModal";
import { useWallets, useCreateWallet, useUpdateWallet, useDeleteWallet, useWalletStats } from "../hooks/useWallets";
import type { Wallet } from "../types/wallets.types";

const PAGE_SIZE = 5;

function WalletAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-primary)] text-xs font-bold flex-shrink-0 bg-[var(--color-bg-primary-200)] border border-[var(--color-primary-400)]">
      {initials}
    </div>
  );
}

export function WalletsManagementPage() {
  const router = useRouter();
  const t = useTranslations("wallets");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsAddModalOpen(true);
      router.replace("/wallets");
    }
  }, [searchParams, router]);

  // Fetch all wallets to handle pagination locally
  const { data: walletsResponse, isLoading, isFetching } = useWallets({ search, page, per_page: 100 });
  
  const allWallets = walletsResponse?.data?.data || [];
  
  // Local pagination
  const totalItems = allWallets.length;
  const wallets = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return allWallets.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allWallets, page]);

  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const deleteWallet = useDeleteWallet();

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Wallet>();

  const handleSearch = useCallback((v: string) => { setSearch(v); setPage(1); }, []);
  const handleStatus = useCallback((v: string) => { setStatus(v); setPage(1); }, []);

  const { data: statsResponse } = useWalletStats();
  const apiStats = statsResponse ?? { totalWallets: 0, totalUSD: 0, totalEUR: 0 };

  const stats: StatItem[] = useMemo(() => {
    return [
      { icon: DollarSign, value: `$${(apiStats.totalUSD || 0).toLocaleString()}`, label: t("stats.totalUSD") || "Total USD", iconColor: "#22c55e", iconBg: "rgba(34,197,94,0.12)" },
      { icon: Euro,       value: `€${(apiStats.totalEUR || 0).toLocaleString()}`, label: t("stats.totalEUR") || "Total EUR", iconColor: "#0ea5e9", iconBg: "rgba(14,165,233,0.12)"  },
      { icon: WalletIcon, value: apiStats.totalWallets || 0,                      label: t("stats.totalWallets") || "Total Wallets", iconColor: "#f59e0b", iconBg: "rgba(251,191,36,0.12)" },
    ];
  }, [t, apiStats]);

  const columns: TableColumn<Wallet>[] = useMemo(() => {
    const cols: TableColumn<Wallet>[] = [
      {
        key: "name",
        header: t("columns.walletName"),
        isPrimary: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <WalletAvatar name={row.name} />
            <Text size="sm" weight="medium" tag="span" className="ds-text-primary">
              {row.name}
            </Text>
          </div>
        ),
      },
      {
        key: "currency",
        header: t("columns.currency"),
        render: (row) => (
          <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-500 bg-blue-50 dark:bg-blue-900/20">
            {row.currency?.code || "N/A"}
          </span>
        ),
      },
      {
        key: "balance",
        header: t("columns.balance"),
        render: (row) => <Text size="sm" className="font-bold ds-text-gray-200">{row.balance.toLocaleString()}</Text>,
      },
      {
        key: "lastTransaction",
        header: t("columns.lastTransaction"),
        hideOnMobile: true,
        render: (row) => <Text size="sm" className="ds-text-gray-200">{new Date(row.updated_at).toLocaleDateString()}</Text>,
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("columns.company"),
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.company?.name || "N/A"}</Text>,
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  const actions: TableAction<Wallet>[] = useMemo(() => [
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
        { value: "inactive",  label: t("filter.inactive")    },
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
          data={wallets}
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

      <AddWalletModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isLoading={createWallet.isPending}
        onSave={async (data) => {
          await createWallet.mutateAsync(data);
          setIsAddModalOpen(false);
          toast.success(t("messages.createSuccess"));
        }}
      />

      <ViewWalletModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditWalletModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        isLoading={updateWallet.isPending}
        onUpdate={async (id, data) => {
          await updateWallet.mutateAsync({ id, data });
          closeModal();
          toast.success(t("messages.updateSuccess"));
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={t("deleteTitle")}
        itemName={selectedRow?.name}
        isLoading={deleteWallet.isPending}
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteWallet.mutate(selectedRow.id, {
              onSuccess: () => {
                closeModal();
                toast.success(t("messages.deleteSuccess"));
              },
              onError: () => {
                toast.error(t("messages.deleteError"));
              }
            });
          }
        }}
      />
    </div>
  );
}
