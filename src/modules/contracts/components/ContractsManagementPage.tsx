"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, LinkIcon, Clock, AlertCircle, Eye, Edit2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { PageContainer } from "@/components/template/PageContainer";
import { useContracts, useContractStats } from "../hooks/useContracts";
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import { Contract } from "../types/contracts.types";
import AddContractModal from "./AddContractModal";
import EditContractModal from "./EditContractModal";
import { ViewContractModal } from "./ViewContractModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

const PAGE_SIZE = 4;

export function ContractsManagementPage() {
  const t = useTranslations("contract");
  const tCommon = useTranslations("common");

  const [search, setSearch]           = useState("");
  const [currentPage, setPage]        = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Contract>();

  const columns: TableColumn<Contract>[] = useMemo(() => [
    {
      key: "customerName",
      header: t("customerName"),
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
            style={{ background: "var(--color-bg-primary-200)", color: "var(--color-primary)" }}>
            {row.customerName.charAt(0).toUpperCase()}
          </div>
          <Text size="sm" weight="medium">{row.customerName}</Text>
        </div>
      ),
    },
    {
      key: "title",
      header: t("title"),
      render: (row) => <Text size="sm" color="gray-200">{row.title}</Text>,
    },
    {
      key: "project",
      header: t("project"),
      hideOnMobile: true,
      render: (row) => <Text size="sm" color="gray-200">{row.project}</Text>,
    },
    {
      key: "company",
      header: t("company"),
      render: (row) => <Text size="sm" weight="bold">{row.company}</Text>,
    },
  ], [t, tCommon]);

  const actions: TableAction<Contract>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const queryClient = useQueryClient();
  const { data: res, isLoading }  = useContracts({ search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData }       = useContractStats();
  const stats                     = statsData || DUMMY_STATS;

  const statItems = [
    { icon: LinkIcon,    value: stats.activeContracts.value,  label: t("stats.active"),  iconColor: "var(--color-contract-active)",   iconBg: "var(--color-contract-active-bg)"   },
    { icon: Clock,       value: stats.pendingSignature.value, label: t("stats.pending"), iconColor: "var(--color-contract-pending)",   iconBg: "var(--color-contract-pending-bg)"  },
    { icon: AlertCircle, value: stats.expiringSoon.value,     label: t("stats.expiring"),     iconColor: "var(--color-contract-expiring)",  iconBg: "var(--color-contract-expiring-bg)" },
  ];

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{ label: t("addButton"), icon: Plus, onClick: () => setIsModalOpen(true), variant: "solid" }]}
        />

        <StatsGrid stats={statItems} cols={3} />

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={res?.data ?? []}
              actions={actions}
              actionsHeader="Actions"
              isLoading={isLoading}
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={currentPage}
              data={Array(res?.total ?? 0).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </PageCardFooter>
        </PageCard>
      </PageContainer>

      <AddContractModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(v) => { 
          queryClient.setQueryData(["contracts", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            const newContract = {
              id: Date.now(),
              customerName: v.customerName,
              initial: v.initial,
              title: v.title,
              project: v.project,
              company: v.company,
            };
            return {
              ...old,
              data: [newContract, ...old.data]
            };
          });
          setIsModalOpen(false); 
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={t("deleteTitle") || "Delete Contract"}
        itemName={selectedRow?.title}
        onConfirm={() => { console.log("Delete Contract", selectedRow?.id); closeModal(); }}
      />

      <ViewContractModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditContractModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id: number, data: any) => { 
          queryClient.setQueryData(["contracts", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((p: any) => p.id === id ? { ...p, ...data } : p)
            };
          });
          closeModal(); 
        }}
      />
    </>
  );
}
