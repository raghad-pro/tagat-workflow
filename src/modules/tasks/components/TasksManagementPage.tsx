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
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import { Task } from "../types/tasks.types";
import { useTasks, useTaskStats, useCreateTask, useUpdateTask, useDeleteTask, useTasksData } from "../hooks/useTasks";
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

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { data: tasksDataResponse } = useTasksData();
  const employeesList = tasksDataResponse?.data?.employees || [];

  const columns: TableColumn<any>[] = useMemo(() => {
    const cols: TableColumn<any>[] = [
      {
        key: "title",
        header: t("columns.title"),
        isPrimary: isCompanyAdmin,
        render: (row) => <Text size="sm" weight="medium">{row.title || row.name || '-'}</Text>,
      },
      {
        key: "project",
        header: t("columns.project"),
        hideOnMobile: true,
        render: (row) => <Text size="sm" color="gray-200">{typeof row.project === 'object' ? (row.project?.title || row.project?.name) : row.project || '-'}</Text>,
      },
      {
        key: "employee",
        header: t("columns.employee"),
        render: (row) => {
          let empName = '-';
          if (row.users && Array.isArray(row.users) && row.users.length > 0) {
            empName = row.users.map((u: any) => u.name || u.user?.name || u).join(', ');
          } else if (row.employees && Array.isArray(row.employees) && row.employees.length > 0) {
            empName = row.employees.map((u: any) => u.name || u.user?.name || u).join(', ');
          } else {
            // Check for nested objects first
            const empObj = row.employee || row.user || row.assignedTo || (typeof row.assigned_to === 'object' ? row.assigned_to : null);
            if (empObj && typeof empObj === 'object') {
              empName = empObj.name || empObj.user?.name || empObj.title || '-';
            } else {
            // Fallback to primitive fields if no object exists
            const rawEmp = row.employee || row.assignedTo || row.assigned_to || row.user || '-';
            
            // Try to resolve from tasksData if we have a number ID
            if (typeof rawEmp === 'number' || !isNaN(Number(rawEmp))) {
              const found = employeesList.find((e: any) => e.id?.toString() === rawEmp?.toString());
              if (found) {
                empName = found.name || found.user?.name || rawEmp;
              } else {
                empName = rawEmp;
              }
            } else {
              empName = rawEmp;
            }
          }
          }
          return <Text size="sm" color="gray-200">{empName}</Text>;
        },
      },
      {
        key: "start",
        header: t("columns.start"),
        hideOnMobile: true,
        render: (row) => {
          const date = row.task_date || row.taskDate || "";
          const time = row.start_time || row.start || "";
          return <Text size="sm" color="gray-200">{date} {time}</Text>;
        },
      },
      {
        key: "end",
        header: t("columns.end"),
        hideOnMobile: true,
        render: (row) => {
          const date = row.task_date || row.taskDate || "";
          const time = row.end_time || row.end || "";
          return <Text size="sm" color="gray-200">{date} {time}</Text>;
        },
      },
      {
        key: "duration",
        header: t("columns.duration"),
        render: (row) => {
          const startTime = row.start_time || row.start;
          const endTime = row.end_time || row.end;
          
          if (startTime && endTime) {
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);
            if (!isNaN(sh) && !isNaN(eh)) {
              let diffMin = (eh * 60 + em) - (sh * 60 + sm);
              if (diffMin < 0) diffMin += 24 * 60;
              const hours = Math.floor(diffMin / 60);
              const mins = diffMin % 60;
              return <Text size="sm" color="gray-200" weight="medium" className="text-[var(--color-primary)]">{hours}h {mins}m</Text>;
            }
          }
          return <Text size="sm" color="gray-200">{row.duration || '-'}</Text>;
        },
      },
      {
        key: "budget",
        header: t("columns.budget"),
        render: (row) => <Text size="sm" weight="bold" className="ds-text-primary">{row.budget || (row.project?.budget) || '-'}</Text>,
      },
    ];

    if (!isCompanyAdmin) {
      cols.unshift({
        key: "company",
        header: t("columns.company"),
        isPrimary: true,
        render: (row) => {
          const cName = typeof row.company === 'object' ? row.company?.name : row.project?.company?.name || row.company;
          return <Text size="sm" weight="bold">{cName || '-'}</Text>;
        },
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
        onSubmit={(v, setError) => {
          const payload: any = {
            project_id: v.project,
            assigned_to: v.employee,
            title: v.title,
            description: v.notes,
            status: "pending",
            task_date: new Date().toISOString().split('T')[0],
            start_time: v.start,
            end_time: v.end,
          };
          if (v.company) payload.company_id = v.company;
          createTask.mutate(payload, {
            onSuccess: () => setIsModalOpen(false),
            onError: (err: any) => {
              if (err?.response?.data?.errors && setError) {
                Object.entries(err.response.data.errors).forEach(([key, val]: any) => {
                  setError(key === 'assigned_to' ? 'employee' : key === 'project_id' ? 'project' : key === 'task_date' ? 'taskDate' : key, { type: 'server', message: val[0] });
                });
              }
            }
          });
        }}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Task"}
        itemName={selectedRow?.title}
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteTask.mutate(selectedRow.id, {
              onSuccess: () => closeModal()
            });
          }
        }}
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
        onUpdate={(id: number, v: any, setError: any) => {
          const payload: any = {
            project_id: v.project,
            assigned_to: v.employee,
            title: v.title,
            description: v.notes,
            status: v.status || "pending",
            task_date: selectedRow?.task_date || selectedRow?.taskDate || new Date().toISOString().split('T')[0],
            start_time: v.start,
            end_time: v.end,
          };
          if (v.company) payload.company_id = v.company;
          updateTask.mutate({ id, data: payload }, {
            onSuccess: () => closeModal(),
            onError: (err: any) => {
              if (err?.response?.data?.errors && setError) {
                Object.entries(err.response.data.errors).forEach(([key, val]: any) => {
                  setError(key === 'assigned_to' ? 'employee' : key === 'project_id' ? 'project' : key === 'task_date' ? 'taskDate' : key, { type: 'server', message: val[0] });
                });
              }
            }
          });
        }}
      />
    </div>
  );
}
