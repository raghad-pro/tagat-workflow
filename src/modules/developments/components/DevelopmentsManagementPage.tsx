"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatCard } from "@/components/atoms/Statcard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { useDevelopments, useDevelopmentStats } from "../hooks/useDevelopments";
import { Folder, Clock, CreditCard, Eye, Edit2, Trash2 } from "lucide-react";
import AddDevelopmentModal from "./AddDevelopmentModal";
import EditDevelopmentModal from "./EditDevelopmentModal";
import { ViewDevelopmentModal } from "./ViewDevelopmentModal";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { useQueryClient } from "@tanstack/react-query";
import { Development } from "../types/developments.types";

const PAGE_SIZE = 4;

export default function DevelopmentsManagementPage() {
  const t = useTranslations("development");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Development>();

  const { data: statsData } = useDevelopmentStats();
  const queryClient = useQueryClient();
  const { data: developmentsData, isLoading, isFetching } = useDevelopments({
    search,
    page,
    per_page: PAGE_SIZE,
  });

  const developments = developmentsData?.data ?? [];
  const total = developmentsData?.meta?.total ?? 0;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const columns: TableColumn<Development>[] = useMemo(() => [
    {
      key: "title",
      header: t("columns.title"),
      isPrimary: true,
      render: (row) => <span className="font-medium ds-text-main">{row.title}</span>,
    },
    {
      key: "project",
      header: t("columns.project"),
      render: (row) => <span className="ds-text-main font-medium">{row.project}</span>,
    },
    {
      key: "client",
      header: t("columns.client"),
      render: (row) => <span>{row.client}</span>,
    },
    {
      key: "budget",
      header: t("columns.budget"),
      render: (row) => <span>{row.budget}</span>,
    },
    {
      key: "cost",
      header: t("columns.cost"),
      render: (row) => <span>{row.cost}</span>,
    },
    {
      key: "status",
      header: t("columns.status"),
      render: (row) => <StatusBadge status={row.status} />,
    },
  ], [t]);

  const actions: TableAction<Development>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{ label: t("add"), onClick: () => setIsModalOpen(true) }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={Folder}
            value={statsData?.total ?? 0}
            label={t("stats.total")}
            iconColor="var(--color-primary)"
            iconBg="rgba(14,165,233,0.1)"
          />
          <StatCard
            icon={Clock}
            value={(statsData?.underReview ?? 0).toLocaleString('en-US')}
            label={t("stats.underReview")}
            iconColor="#eab308"
            iconBg="rgba(234,179,8,0.1)"
          />
          <StatCard
            icon={CreditCard}
            value={"$" + (statsData?.approved ?? 0).toLocaleString('en-US')}
            label={t("stats.approved")}
            iconColor="#22c55e"
            iconBg="rgba(34,197,94,0.1)"
          />
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={handleSearchChange}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable columns={columns} data={developments} actions={actions} isLoading={isFetching} />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={page}
              data={Array(total).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </PageCardFooter>
        </PageCard>
      </PageContainer>

      <AddDevelopmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(v) => { 
          queryClient.setQueryData(["developments", { search, page, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            const newDevelopment = {
              id: Date.now(),
              title: v.title,
              project: v.project,
              client: v.client,
              budget: v.budget,
              cost: v.cost,
              status: "active",
            };
            return {
              ...old,
              data: [newDevelopment, ...old.data]
            };
          });
          setIsModalOpen(false); 
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Development"}
        itemName={selectedRow?.title}
        onConfirm={() => { console.log("Delete Development", selectedRow?.id); closeModal(); }}
      />

      <ViewDevelopmentModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditDevelopmentModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id: number, data: any) => { 
          queryClient.setQueryData(["developments", { search, page, per_page: PAGE_SIZE }], (old: any) => {
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
