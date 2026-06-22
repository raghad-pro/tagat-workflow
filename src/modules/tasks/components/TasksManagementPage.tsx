"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit2, Trash2, Folder, Clock, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { useTasks, useTaskStats } from "../hooks/useTasks";
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import { Task } from "../types/tasks.types";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";
import { ViewTaskModal } from "./ViewTaskModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { useAuth } from "@/providers/AuthProvider";

const PAGE_SIZE = 4;

export function TasksManagementPage() {
  const t = useTranslations("task");
  const tCommon = useTranslations("common");

  const [search, setSearch]           = useState("");
  const [currentPage, setPage]        = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Task>();
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const queryClient = useQueryClient();
  const { data: res, isLoading } = useTasks({ search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData }      = useTaskStats();
  const stats                    = statsData || DUMMY_STATS;

  const columns: TableColumn<Task>[] = useMemo(() => {
    const cols: TableColumn<Task>[] = [
      {
        key: "title",
        header: t("columns.title"),
        isPrimary: isCompanyAdmin,
        render: (row) => <Text size="sm" weight="medium">{row.title}</Text>,
      },
      {
        key: "project",
        header: t("columns.project"),
        hideOnMobile: true,
        render: (row) => <Text size="sm" color="gray-200">{row.project}</Text>,
      },
      {
        key: "employee",
        header: t("columns.employee"),
        render: (row) => <Text size="sm" color="gray-200">{row.employee}</Text>,
      },
      {
        key: "start",
        header: t("columns.start"),
        hideOnMobile: true,
        render: (row) => <Text size="sm" color="gray-200">{row.start}</Text>,
      },
      {
        key: "end",
        header: t("columns.end"),
        hideOnMobile: true,
        render: (row) => <Text size="sm" color="gray-200">{row.end}</Text>,
      },
      {
        key: "duration",
        header: t("columns.duration"),
        render: (row) => <Text size="sm" color="gray-200">{row.duration}</Text>,
      },
      {
        key: "budget",
        header: t("columns.budget"),
        render: (row) => <Text size="sm" weight="bold" className="ds-text-primary">{row.budget}</Text>,
      },
    ];

    if (!isCompanyAdmin) {
      cols.unshift({
        key: "company",
        header: t("columns.company"),
        isPrimary: true,
        render: (row) => <Text size="sm" weight="bold">{row.company}</Text>,
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  const actions: TableAction<Task>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const statItems = useMemo(() => [
    {
      icon: CreditCard,
      value: stats.budgetUtilization.value,
      label: t("stats.utilization"),
      iconColor: "#4CAF50",
      iconBg:    "#EDF7EE",
    },
    {
      icon: Folder,
      value: stats.activeTasks.value,
      label: t("stats.active"),
      iconColor: "#25C6DA",
      iconBg:    "#E9F9FB",
    },
    {
      icon: Clock,
      value: stats.loggedHours.value,
      label: t("stats.logged"),
      iconColor: "#E8D636",
      iconBg:    "#FFFDEB",
    },
  ], [stats, t]);

  return (
    <div className="p-0 sm:p-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[{
          label: t("addTask"),
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

      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(v) => { 
          queryClient.setQueryData(["tasks", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
            if (!old) return old;
            const newTask = {
              id: Date.now(),
              title: v.title,
              company: v.company,
              project: v.project,
              employee: v.employee,
              start: v.start,
              end: v.end,
              duration: v.duration,
              budget: v.budget,
            };
            return {
              ...old,
              data: [newTask, ...old.data]
            };
          });
          setIsModalOpen(false); 
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Task?"
        message="This action cannot be undone."
        onConfirm={() => { console.log("Delete Task", selectedRow?.id); closeModal(); }}
      />

      <ViewTaskModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditTaskModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id: number, data: any) => { 
          queryClient.setQueryData(["tasks", { search, page: currentPage, per_page: PAGE_SIZE }], (old: any) => {
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
