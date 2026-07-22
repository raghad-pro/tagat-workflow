"use client";

import React, { useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn, type TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import {
  useEmployees,
  useEmployeeStats,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
} from "../hooks/useEmployees";
import { Users, CheckCircle2, Sun, Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import AddEmployeeModal from "./AddEmployeeModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { ViewEmployeeModal } from "./ViewEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import type { Employee, EmployeeStatus } from "../types/employees.types";
import type { AddEmployeeFormValues } from "./AddEmployeeModal";
import type { EditEmployeeFormValues } from "./EditEmployeeModal";
import { UseFormSetError } from "react-hook-form";
import { StatusBadge } from "@/components/atoms/Statusbadge";

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getEmployeeName(row: Employee): string {
  return (
    row.employee_name ??
    row.employeeName  ??
    row.name          ??
    row.user?.name    ??
    (row.user?.first_name
      ? `${row.user.first_name} ${row.user.last_name ?? ""}`.trim()
      : null) ??
    "-"
  );
}

function getCompanyName(row: Employee): string {
  if (!row.company) return "-";
  return typeof row.company === "object" ? row.company.name : row.company;
}

function getCurrencyName(row: Employee): string {
  if (!row.currency) return "-";
  return typeof row.currency === "object"
    ? row.currency.name || row.currency.code
    : row.currency;
}

function getSalary(row: any): string {
  const val = row.salary ?? row.hourly_rate ?? row.hourlyRate ?? row.rate;
  if (val === null || val === undefined || val === "") return "-";
  return String(val);
}

function getPaymentType(row: Employee): string {
  return row.paymentType ?? row.payment_type ?? "-";
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function EmpStatCard({
  icon: Icon,
  value,
  label,
  iconColor,
  iconBg,
}: {
  icon:      React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  value:     number;
  label:     string;
  iconColor: string;
  iconBg:    string;
}) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-5 rounded-2xl ds-bg-form"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={20} style={{ color: iconColor }} />
      </div>
      <div>
        <p className="text-2xl font-bold ds-text-primary leading-none">{value}</p>
        <p className="text-sm ds-text-gray-200 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function EmployeeAvatar({ name }: { name: string }) {
  const safeName = name || "U";
  const colors   = ["#0ea5e9", "#6366f1", "#22c55e", "#eab308", "#ec4899", "#f97316"];
  const color    = colors[safeName.charCodeAt(0) % colors.length];
  const initials = safeName.split(" ")[0]?.[0]?.toUpperCase() ?? "U";

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

function PaymentBadge({ type }: { type: string }) {
  const isMonthly = type?.toLowerCase() === "monthly";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
        isMonthly
          ? "text-green-600 bg-green-50 dark:bg-green-900/20"
          : "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          isMonthly ? "bg-green-500" : "bg-blue-400"
        )}
      />
      {type || "-"}
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function EmployeesManagementPage() {
  const t       = useTranslations("employee");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]     = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: statsData }                        = useEmployeeStats();
  const { data: empData, isLoading, isFetching }   = useEmployees({ per_page: 1000 } as any);
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } =
    useActionModals<Employee>();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const STATUS_OPTIONS = useMemo(() => [
    { value: "all",        label: tCommon("all") || "All Statuses" },
    { value: "active",     label: tCommon("active") || "Active" },
    { value: "onboarding", label: tCommon("onboarding") || "Onboarding" },
    { value: "inactive",   label: tCommon("inactive") || "Inactive" },
  ], [tCommon]);

  const allEmployees = useMemo(() => {
    let list = empData?.data ?? [];
    if (!Array.isArray(list)) list = [];
    
    // Sort by id desc so new employees show first
    list = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

    return list.filter((emp: Employee) => {
      if (statusFilter !== "all") {
        const empStatus = (emp.status || "active").toLowerCase();
        if (empStatus !== statusFilter.toLowerCase()) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = getEmployeeName(emp).toLowerCase();
        const email = (emp.email || "").toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      return true;
    });
  }, [empData?.data, search, statusFilter]);

  const total     = allEmployees.length;
  const employees = allEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const statsItems = useMemo(() => [
    {
      icon:      Users,
      value:     statsData?.total      ?? 0,
      label:     t("stats.total"),
      iconColor: "#0ea5e9",
      iconBg:    "rgba(14,165,233,0.12)",
    },
    {
      icon:      CheckCircle2,
      value:     statsData?.active     ?? 0,
      label:     t("stats.active"),
      iconColor: "#25c6da",
      iconBg:    "rgba(37,198,218,0.12)",
    },
    {
      icon:      Sun,
      value:     statsData?.onboarding ?? 0,
      label:     t("stats.onLeave") || "Onboarding",
      iconColor: "#f59e0b",
      iconBg:    "rgba(245,158,11,0.12)",
    },
  ], [statsData, t]);

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<Employee>[]>(() => {
    const cols: TableColumn<Employee>[] = [
      {
        key:       "name",
        header:    t("columns.employee"),
        isPrimary: true,
        render: (row) => {
          const name = getEmployeeName(row);
          return (
            <div className="flex items-center gap-3">
              <EmployeeAvatar name={name} />
              <Text size="sm" weight="medium" tag="span">{name}</Text>
            </div>
          );
        },
      },
      {
        key:          "job",
        header:       t("columns.job"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" tag="span">
            {row.job_title ?? row.jobTitle ?? row.job ?? "-"}
          </Text>
        ),
      },
      {
        key:          "currency",
        header:       t("columns.currency"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" tag="span">{getCurrencyName(row)}</Text>
        ),
      },
      {
        key:    "salary",
        header: t("columns.salary"),
        render: (row) => (
          <Text size="sm" tag="span">{getSalary(row)}</Text>
        ),
      },
      {
        key:    "paymentType",
        header: t("columns.paymentType"),
        render: (row) => <PaymentBadge type={getPaymentType(row)} />,
      },
      {
        key:    "status",
        header: tCommon("status") || "Status",
        render: (row) => (
          <StatusBadge status={row.status || "active"} />
        ),
      },
    ];

    if (isSuperAdmin) {
      cols.splice(1, 0, {
        key:    "company",
        header: t("columns.company"),
        render: (row) => (
          <Text size="sm" tag="span">{getCompanyName(row)}</Text>
        ),
      });
    }

    return cols;
  }, [isSuperAdmin, t]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const actions = useMemo<TableAction<Employee>[]>(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView   },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit   },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreate = useCallback((
    v: AddEmployeeFormValues,
    setError: UseFormSetError<AddEmployeeFormValues>
  ) => {
    const payload: Record<string, unknown> = {
      name:        v.employeeName,
      email:       v.email,
      payment_type: v.paymentType,
      job_title:   v.jobTitle,
      password:    v.password,
      salary:      v.hourlyRate,
      hourly_rate: v.hourlyRate,
      currency_id: v.currency,
    };
    if (v.company) payload.company_id = v.company;

    createEmployee.mutate(payload as Partial<Employee>, {
      onSuccess: () => {
        toast.success("Employee added successfully");
        setIsModalOpen(false);
      },
      onError: (err: any) => {
        const errors = err?.response?.data?.errors;
        if (errors?.email) {
          setError("email", { type: "server", message: errors.email[0] });
        }
        const msg =
          errors
            ? (Object.values(errors)[0] as string[])[0]
            : err?.response?.data?.message ?? "Failed to add employee";
        toast.error(msg);
      },
    });
  }, [createEmployee]);

  const handleUpdate = useCallback((
    id: number,
    v: EditEmployeeFormValues,
    setError: UseFormSetError<EditEmployeeFormValues>
  ) => {
    const payload: Record<string, unknown> = {
      name:        v.employeeName,
      email:       v.email,
      payment_type: v.paymentType,
      job_title:   v.jobTitle,
      salary:      v.hourlyRate,
      hourly_rate: v.hourlyRate,
      currency_id: v.currency,
    };
    if (v.password) payload.password    = v.password;
    if (v.company)  payload.company_id  = v.company;

    updateEmployee.mutate({ id, data: payload as Partial<Employee> }, {
      onSuccess: () => {
        toast.success("Employee updated successfully");
        closeModal();
      },
      onError: (err: any) => {
        const errors = err?.response?.data?.errors;
        if (errors?.email) {
          setError("email", { type: "server", message: errors.email[0] });
        }
        const msg =
          errors
            ? (Object.values(errors)[0] as string[])[0]
            : err?.response?.data?.message ?? "Failed to update employee";
        toast.error(msg);
      },
    });
  }, [updateEmployee, closeModal]);

  const handleDelete = useCallback(() => {
    if (!selectedRow?.id) return;
    deleteEmployee.mutate(selectedRow.id, {
      onSuccess: () => {
        toast.success("Employee deleted successfully");
        closeModal();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message ?? "Failed to delete employee");
      },
    });
  }, [selectedRow, deleteEmployee, closeModal]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      <PageContainer
        isLoading={isLoading}
        skeletonVariant="dashboard"
        skeletonRows={PAGE_SIZE}
      >
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{ label: t("add"), onClick: () => setIsModalOpen(true) }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {statsItems.map((s) => (
            <EmpStatCard key={s.label} {...s} />
          ))}
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder={t("searchPlaceholder")}
              filters={[
                {
                  value: statusFilter,
                  onChange: (v) => { setStatusFilter(v); setPage(1); },
                  options: STATUS_OPTIONS,
                },
              ]}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={employees}
              actions={actions}
              actionsHeader={tCommon("actions")}
              isLoading={isFetching}
            />
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

      <AddEmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Employee"}
        itemName={getEmployeeName(selectedRow ?? {} as Employee)}
        isLoading={deleteEmployee.isPending}
        onConfirm={handleDelete}
      />

      <ViewEmployeeModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditEmployeeModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={handleUpdate}
      />
    </>
  );
}