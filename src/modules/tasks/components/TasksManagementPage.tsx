"use client";

import toast from "react-hot-toast";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit2, Trash2, Folder, Clock, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn, type TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import type { Task, TaskProject, TaskEmployee, TaskCompany } from "../types/tasks.types";
import {
  useTasks,
  useTaskStats,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useTasksData,
} from "../hooks/useTasks";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import AddTaskModal from "./AddTaskModal";
import EditTaskModal from "./EditTaskModal";
import { ViewTaskModal } from "./ViewTaskModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { useAuth } from "@/providers/AuthProvider";
import { UseFormSetError } from "react-hook-form";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getProjectName(task: Task): string {
  if (!task.project) return "-";
  if (typeof task.project === "object") {
    return task.project.title ?? task.project.name ?? "-";
  }
  return task.project;
}

function getCompanyName(task: Task): string {
  if (task.company) {
    if (typeof task.company === "object") return task.company.name;
    return task.company;
  }
  if (typeof task.project === "object") {
    return task.project.company?.name ?? "-";
  }
  return "-";
}

function getEmployeeName(task: Task, employeesList: TaskEmployee[], currentUser?: any): string {
  // Check users/employees arrays first
  if (task.users?.length) {
    return task.users
      .map((u) => u.name ?? u.user?.name ?? String(u))
      .join(", ");
  }
  if (task.employees?.length) {
    return task.employees
      .map((u) => u.name ?? u.user?.name ?? String(u))
      .join(", ");
  }

  const raw = task.employee ?? task.assignedTo ?? task.assigned_to;
  if (!raw) return "-";

  const rawId = typeof raw === "object" ? String((raw as any).id || (raw as any).user_id || "") : String(raw);

  // If we already have the name inside the object, use it
  if (typeof raw === "object") {
    const objName = (raw as any).name ?? (raw as any).employee_name ?? (raw as any).user?.name;
    if (objName) return objName;
  }

  // If the user is viewing their own tasks, use their name
  if (currentUser && (String(currentUser.id) === rawId || String(currentUser.employee_id) === rawId)) {
    return currentUser.name || currentUser.first_name || rawId;
  }

  // Try to resolve from employeesList using the ID
  const found = employeesList.find(
    (e: any) => e.id?.toString() === rawId || e.user_id?.toString() === rawId
  );
  return found?.name ?? found?.employee_name ?? found?.user?.name ?? rawId;
}

function getTimeRange(task: Task): { start: string; end: string } {
  const start = task.start_time ?? task.start ?? "";
  const end   = task.end_time   ?? task.end   ?? "";
  return {
    start: start.trim(),
    end:   end.trim(),
  };
}

function calcDuration(task: Task): string {
  const startTime = task.start_time ?? task.start;
  const endTime   = task.end_time   ?? task.end;

  if (!startTime || !endTime) return task.duration ?? "-";

  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if (isNaN(sh) || isNaN(eh)) return task.duration ?? "-";

  let diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin < 0) diffMin += 24 * 60;
  return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function TasksManagementPage() {
  const t       = useTranslations("task");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch]       = useState("");
  const [currentPage, setPage]    = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } =
    useActionModals<Task>();

  const { data: res, isLoading }  = useTasks({ search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData }       = useTaskStats();
  const { data: tasksDataResponse } = useTasksData();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // ── Dynamic Stats Calculation ────────────────────────────────────────────────
  const stats = useMemo(() => {
    const tasks = res?.data || [];
    const totalTasks = res?.total || tasks.length;

    let totalMins = 0;
    let totalBudget = 0;

    tasks.forEach(task => {
      // Calculate duration
      const startTime = task.start_time ?? task.start;
      const endTime   = task.end_time   ?? task.end;
      if (startTime && endTime) {
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          let diffMin = (eh * 60 + em) - (sh * 60 + sm);
          if (diffMin < 0) diffMin += 24 * 60;
          totalMins += diffMin;
        }
      }

      // Calculate budget
      const budgetRaw = task.budget ?? (typeof task.project === "object" ? task.project?.budget : undefined);
      if (budgetRaw) {
        const b = parseFloat(String(budgetRaw).replace(/[^0-9.-]+/g, ""));
        if (!isNaN(b)) {
          totalBudget += b;
        }
      }
    });

    const hours = Math.floor(totalMins / 60);

    return {
      activeTasks: { value: totalTasks, label: "Total Active Tasks" },
      loggedHours: { value: `${hours}`, label: "Logged Hours" },
      budgetUtilization: { value: `${totalBudget.toFixed(2)}`, label: "Total Budget Utilization" },
    };
  }, [res]);


  // Use full employees list to resolve employee names properly
  const { data: employeesResponse } = useEmployees({ page: 1, per_page: 100 });
  const employeesList = (employeesResponse?.data?.data ?? employeesResponse?.data ?? []) as any[];

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<Task>[]>(() => {
    const cols: TableColumn<Task>[] = [
      {
        key:       "title",
        header:    t("columns.title"),
        isPrimary: !isSuperAdmin,
        render: (row) => (
          <Text size="sm" weight="medium">{row.title || "-"}</Text>
        ),
      },
      {
        key:          "project",
        header:       t("columns.project"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" color="gray-200">{getProjectName(row)}</Text>
        ),
      },
      {
        key:    "employee",
        header: t("columns.employee"),
        render: (row) => (
          <Text size="sm" color="gray-200">
            {getEmployeeName(row, employeesList, user)}
          </Text>
        ),
      },
      {
        key:          "start",
        header:       t("columns.start"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" color="gray-200">{getTimeRange(row).start || "-"}</Text>
        ),
      },
      {
        key:          "end",
        header:       t("columns.end"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" color="gray-200">{getTimeRange(row).end || "-"}</Text>
        ),
      },
      {
        key:    "duration",
        header: t("columns.duration"),
        render: (row) => (
          <Text size="sm" color="gray-200" weight="medium" className="text-[var(--color-primary)]">
            {calcDuration(row)}
          </Text>
        ),
      },
      {
        key:    "budget",
        header: t("columns.budget"),
        render: (row) => {
          const budget =
            row.budget ??
            (typeof row.project === "object" ? row.project?.budget : undefined) ??
            "-";
          return <Text size="sm" weight="bold" className="ds-text-primary">{budget}</Text>;
        },
      },
    ];

    if (isSuperAdmin) {
      cols.unshift({
        key:       "company",
        header:    t("columns.company"),
        isPrimary: true,
        render: (row) => (
          <Text size="sm" weight="bold">{getCompanyName(row)}</Text>
        ),
      });
    }

    return cols;
  }, [t, isSuperAdmin, employeesList]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const actions = useMemo<TableAction<Task>[]>(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView   },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit   },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  // ── Stat items ───────────────────────────────────────────────────────────────
  const statItems = useMemo(() => [
    {
      icon:      CreditCard,
      value:     stats.budgetUtilization.value,
      label:     t("stats.utilization"),
      iconColor: "#4CAF50",
      iconBg:    "#EDF7EE",
    },
    {
      icon:      Folder,
      value:     stats.activeTasks.value,
      label:     t("stats.active"),
      iconColor: "#25C6DA",
      iconBg:    "#E9F9FB",
    },
    {
      icon:      Clock,
      value:     stats.loggedHours.value,
      label:     t("stats.logged"),
      iconColor: "#E8D636",
      iconBg:    "#FFFDEB",
    },
  ], [stats, t]);

  // ── Task payload builder ──────────────────────────────────────────────────────
  const buildPayload = useCallback((
    v: Record<string, string>,
    taskDate?: string
  ): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      project_id:  v.project,
      assigned_to: v.employee,
      title:       v.title,
      description: v.notes,
      status:      v.status ?? "pending",
      task_date:   taskDate ?? new Date().toISOString().split("T")[0],
      start_time:  v.start,
      end_time:    v.end,
    };
    if (v.company) payload.company_id = v.company;
    return payload;
  }, []);

  const handleServerErrors = useCallback((
    err: any,
    setError: UseFormSetError<any>
  ) => {
    const message = err?.response?.data?.message || "حدث خطأ غير متوقع";
    toast.error(message);
    const errors = err?.response?.data?.errors as Record<string, string[]> | undefined;
    if (!errors) return;
    const fieldMap: Record<string, string> = {
      assigned_to: "employee",
      project_id:  "project",
      task_date:   "taskDate",
    };
    Object.entries(errors).forEach(([key, val]) => {
      const field = fieldMap[key] ?? key;
      setError(field, { type: "server", message: val[0] });
    });
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-0 sm:p-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[{
          label:   t("addTask"),
          icon:    Plus,
          onClick: () => setIsModalOpen(true),
          variant: "solid",
        }]}
      />

      <StatsGrid stats={statItems} cols={3} />

      <div
        className="rounded-2xl ds-bg-form flex flex-col"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div
          className="p-4 sm:p-6 border-b"
          style={{ borderColor: "var(--color-border-form)" }}
        >
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

        <div
          className="p-4 border-t flex justify-end"
          style={{ borderColor: "var(--color-border-form)" }}
        >
          <Pagination
            currentPage={currentPage}
            data={Array(res?.total ?? 0).fill(0)}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Add Modal */}
      <AddTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={createTask.isPending}
        onSubmit={(v, setError) => {
          createTask.mutate(buildPayload(v), {
            onSuccess: () => setIsModalOpen(false),
            onError:   (err) => handleServerErrors(err, setError),
          });
        }}
      />

      {/* Delete Modal */}
      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Task"}
        itemName={selectedRow?.title}
        isLoading={deleteTask.isPending}
        onConfirm={() => {
          if (!selectedRow?.id) return;
          deleteTask.mutate(selectedRow.id, {
            onSuccess: () => closeModal(),
          });
        }}
      />

      {/* View Modal */}
      <ViewTaskModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      {/* Edit Modal */}
      <EditTaskModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        isLoading={updateTask.isPending}
        onUpdate={(id, v, setError) => {
          updateTask.mutate(
            {
              id,
              data: buildPayload(
                v,
                selectedRow?.task_date ?? selectedRow?.taskDate
              ),
            },
            {
              onSuccess: () => closeModal(),
              onError:   (err) => handleServerErrors(err, setError),
            }
          );
        }}
      />
    </div>
  );
}