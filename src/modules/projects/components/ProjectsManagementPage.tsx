"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit2, Trash2, Folder, Clock, CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useProjects, useProjectStats, useDeleteProject } from "../hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import { Project } from "../types/projects.types";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { ViewProjectModal } from "./ViewProjectModal";
import EditProjectModal from "./EditProjectModal";
import AddProjectModal from "./AddProjectModal";
import { useAuth } from "@/providers/AuthProvider";

const PAGE_SIZE = 4;

export function ProjectsManagementPage() {
  const t = useTranslations("project");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const columns: TableColumn<Project>[] = useMemo(() => {
    const cols: TableColumn<Project>[] = [
      {
        key: "title",
        header: t("columns.title"),
        isPrimary: true,
        render: (row) => <Text size="sm" weight="medium">{row.title}</Text>,
      },
      {
        key: "client",
        header: t("columns.client"),
        hideOnMobile: true,
        render: (row) => {
          const clientName = typeof row.client === 'object' ? (row.client as any)?.name : row.client;
          return <Text size="sm" color="gray-200">{clientName || "-"}</Text>;
        },
      },
      {
        key: "budget",
        header: t("columns.budget"),
        render: (row) => <Text size="sm" color="gray-200">{row.budget}</Text>,
      },
      {
        key: "employees",
        header: t("columns.employees"),
        render: (row) => <Text size="sm" color="gray-200">{row.employees}</Text>,
      },
      {
        key: "status",
        header: t("columns.status"),
        render: (row) => <StatusBadge status={row.status} withDot />,
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("columns.company"),
        render: (row) => {
          const companyName = typeof row.company === 'object' ? (row.company as any)?.name : row.company;
          return <Text size="sm" weight="bold">{companyName || "-"}</Text>;
        },
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  const [search, setSearch]       = useState("");
  const [currentPage, setPage]    = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Project>();
  const deleteProjectMutation = useDeleteProject();

  const actions: TableAction<Project>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const queryClient = useQueryClient();
  const { data: res, isLoading }  = useProjects({ search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData }       = useProjectStats();
  const stats                     = statsData || DUMMY_STATS;

  const statItems = [
    {
      icon: CheckSquare,
      value: stats.completed.value,
      label: t("stats.completed"),
      iconColor: "#4CAF50",
      iconBg:    "#EDF7EE",
    },
    {
      icon: Folder,
      value: stats.totalProjects.value,
      label: t("stats.active"),
      iconColor: "#25C6DA",
      iconBg:    "#E9F9FB",
    },
    {
      icon: Clock,
      value: stats.inProgress.value,
      label: t("stats.delayed"),
      iconColor: "#E8D636",
      iconBg:    "#FFFDEB",
    },
  ];

  return (
    <div className="p-0 sm:p-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[{
          label: t("add"),
          icon: Plus,
          onClick: () => setIsModalOpen(true),
          variant: "solid",
        }]}
      />

      <StatsGrid stats={statItems} cols={3} />

      <div className="rounded-2xl ds-bg-form flex flex-col" style={{ boxShadow: "var(--shadow-sm)" }}>
        <div className="p-4 sm:p-6 border-b" style={{ borderColor: "var(--color-border-form)" }}>
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t("searchPlaceholder")}
          />
        </div>

        <DataTable
          columns={columns}
          data={res?.data ?? []}
          actions={actions}
          actionsHeader={tCommon("actions")}
          isLoading={isLoading}
        />

        <div className="p-4 border-t flex justify-end" style={{ borderColor: "var(--color-border-form)" }}>
          <Pagination
            currentPage={currentPage}
            data={Array(res?.total ?? 0).fill(0)}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(v) => { 
          queryClient.setQueryData(["projects", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            const newProject = {
              id: Date.now(),
              title: v.title,
              company: v.company,
              client: "Unknown Client",
              budget: v.budget,
              employees: "0",
              status: v.status,
            };
            return {
              ...old,
              data: [newProject, ...old.data]
            };
          });
          setIsModalOpen(false); 
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Project"}
        itemName={selectedRow?.name}
        isLoading={deleteProjectMutation.isPending}
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteProjectMutation.mutate(selectedRow.id, {
              onSuccess: () => closeModal(),
            });
          }
        }}
      />

      <ViewProjectModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditProjectModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id: number, data: any) => { 
          queryClient.setQueryData(["projects", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((p: any) => p.id === id ? { ...p, ...data } : p)
            };
          });
          closeModal(); 
        }}
      />
    </div>
  );
}


