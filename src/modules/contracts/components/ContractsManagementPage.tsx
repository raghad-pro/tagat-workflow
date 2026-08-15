"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, LinkIcon, Clock, AlertCircle, Eye, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid, type StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Text } from "@/components/atoms/Text";
import { PageContainer } from "@/components/template/PageContainer";
import { useAuth } from "@/providers/AuthProvider";
import { useContracts, useContractStats, useCreateContract, useUpdateContract, useDeleteContract } from "../hooks/useContracts";
import { DUMMY_STATS } from "../data/mockData";
import { Contract } from "../types/contracts.types";
import AddContractModal from "./AddContractModal";
import EditContractModal from "./EditContractModal";
import { ViewContractModal } from "./ViewContractModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

const PAGE_SIZE = 10;

export function ContractsManagementPage() {
  const t = useTranslations("contract");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const role = user?.role || "company";

  const [search, setSearch] = useState("");
  const [currentPage, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Contract>();

  const columns: TableColumn<Contract>[] = useMemo(() => [
    {
      key: "customerName",
      header: t("columns.customerName") || "Customer Name",
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-[#E6F6FE] text-[#03A9F4]"
          >
            {(row.customerName || "C").charAt(0).toUpperCase()}
          </div>
          <Text size="sm" weight="medium">{row.customerName}</Text>
        </div>
      ),
    },
    {
      key: "title",
      header: t("columns.title") || "Title",
      render: (row) => <Text size="sm" color="gray-200">{row.title}</Text>,
    },
    {
      key: "project",
      header: t("columns.project") || "Project",
      hideOnMobile: true,
      render: (row) => <Text size="sm" color="gray-200">{row.project}</Text>,
    },
    {
      key: "company",
      header: t("columns.company") || "Company",
      render: (row) => <Text size="sm" weight="bold">{row.company}</Text>,
    },
  ], [t]);

  const actions: TableAction<Contract>[] = useMemo(() => [
    { icon: Eye, label: tCommon("view") || "View", colorScheme: "send", onClick: openView },
    { icon: Edit2, label: tCommon("edit") || "Edit", colorScheme: "edit", onClick: openEdit },
    { icon: Trash2, label: tCommon("delete") || "Delete", colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const { data: res, isLoading } = useContracts(role, { search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData } = useContractStats(role);
  const createContract = useCreateContract(role);
  const updateContract = useUpdateContract(role);
  const deleteContract = useDeleteContract(role);

  const stats = statsData || DUMMY_STATS;

  const statItems: StatItem[] = [
    {
      icon: LinkIcon,
      value: stats.activeContracts?.value ?? "0",
      label: t("stats.active") || "Active Contracts",
      iconColor: "#03A9F4",
      iconBg: "#E6F6FE",
    },
    {
      icon: Clock,
      value: stats.pendingSignature?.value ?? "0",
      label: t("stats.pending") || "Pending Signature",
      iconColor: "#E8D636",
      iconBg: "#FFFDEB",
    },
    {
      icon: AlertCircle,
      value: stats.expiringSoon?.value ?? "0",
      label: t("stats.expiring") || "Expiring Soon",
      iconColor: "#F44336",
      iconBg: "#FEECEB",
    },
  ];

  const contractsData = res?.data ?? [];
  const totalItems = res?.total ?? contractsData.length;

  return (
    <>
      <PageContainer
        isLoading={isLoading}
        skeletonVariant="dashboard"
        skeletonRows={PAGE_SIZE}
      >
        <PageHeader
          title={t("title") || "Contracts"}
          subtitle={t("subtitle") || "Manage and review client contracts and agreements"}
          actions={[{ label: t("add") || "Add Contract", icon: Plus, onClick: () => setIsModalOpen(true), variant: "solid" }]}
        />

        <StatsGrid stats={statItems} cols={3} />

        <div className="rounded-2xl bg-card shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] overflow-hidden p-4 space-y-4">
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t("searchPlaceholder") || "Searching..."}
          />

          <DataTable
            columns={columns}
            data={contractsData}
            actions={actions}
            actionsHeader="Actions"
            isLoading={isLoading}
            emptyMessage={t("noContracts") || "No contracts found."}
            pagination={{
              currentPage,
              pageSize: PAGE_SIZE,
              totalItems,
              onPageChange: setPage,
            }}
          />
        </div>
      </PageContainer>

      {/* Modals */}
      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={async (data: any) => {
          await createContract.mutateAsync(data);
          setIsModalOpen(false);
        }}
        isPending={createContract.isPending}
      />

      {selectedRow && (
        <EditContractModal
          isOpen={activeModal === "edit"}
          onClose={closeModal}
          data={selectedRow}
          onUpdate={async (id: number, data: any) => {
            await updateContract.mutateAsync({ id, data });
            closeModal();
          }}
          isPending={updateContract.isPending}
        />
      )}

      {selectedRow && (
        <ViewContractModal
          isOpen={activeModal === "view"}
          onClose={closeModal}
          data={selectedRow}
        />
      )}

      {selectedRow && (
        <DeleteConfirmationModal
          isOpen={activeModal === "delete"}
          onClose={closeModal}
          title={tCommon("deleteConfirmation") || "Delete Contract"}
          itemName={selectedRow.title}
          onConfirm={async () => {
            await deleteContract.mutateAsync(selectedRow.id);
            closeModal();
          }}
          isLoading={deleteContract.isPending}
        />
      )}
    </>
  );
}
