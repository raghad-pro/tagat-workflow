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
  useAllEmployees,
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
import { getEmployeeEmail, getEmployeeStatus } from "../types/employees.types";
import type { AddEmployeeFormValues } from "./AddEmployeeModal";
import type { EditEmployeeFormValues } from "./EditEmployeeModal";
import { UseFormSetError } from "react-hook-form";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { getExtraRole } from "@/modules/access/hooks/useAccess";
import { usePermission } from "@/hooks/usePermission";

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
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>;
  value: number;
  label: string;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white dark:bg-card rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all min-w-0">
      <div className="flex items-center gap-4 min-w-0 w-full">
        <div
          className="w-[48px] h-[48px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={24} style={{ color: iconColor }} />
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300 truncate leading-[20px]">
            {label}
          </span>
          <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px] truncate tracking-tight">
            {value}
          </span>
        </div>
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
  const { can } = usePermission();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage]     = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: statsData }                        = useEmployeeStats();
  // Every page, not `per_page: 1000` — the endpoint caps a page at 10 rows and
  // ignores `per_page`, so the old call silently showed only the first ten
  // while the search, filter and pager all worked off that truncated set.
  const { data: empData, isLoading, isFetching }   = useAllEmployees();
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } =
    useActionModals<Employee>();

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  // Only two states are derivable: `user.is_active` is 1 or 0. "Onboarding"
  // was never populated by anything, so offering it filtered to an empty table.
  const STATUS_OPTIONS = useMemo(() => [
    { value: "all",      label: tCommon("all") },
    { value: "active",   label: tCommon("active") },
    { value: "inactive", label: tCommon("inactive") },
  ], [tCommon]);

  const allEmployees = useMemo(() => {
    let list = empData?.data ?? [];
    if (!Array.isArray(list)) list = [];
    
    // Sort by id desc so new employees show first
    list = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));

    return list.filter((emp: Employee) => {
      // `emp.status` does not exist on the API record, so the old comparison
      // ran against `undefined` for every row: "active" matched everyone via
      // the `|| "active"` default and the other two matched no one.
      if (statusFilter !== "all" && getEmployeeStatus(emp) !== statusFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = getEmployeeName(emp).toLowerCase();
        // The email is nested under `user`; `emp.email` was always undefined,
        // so searching by email never matched anything.
        const email = getEmployeeEmail(emp).toLowerCase();
        const job = (emp.job_title ?? emp.jobTitle ?? "").toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !job.includes(q)) return false;
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
      value:     statsData?.inactive ?? 0,
      // Was "On Leave" — nothing in the data distinguishes leave from any
      // other reason an account is switched off.
      label:     t("stats.inactive"),
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
        // Surfaced here as well as on the access screen: this is where people
        // already come to look someone up, and a granted role is not obvious
        // from anything else on the row.
        key:          "extraRole",
        header:       t("columns.extraRole"),
        hideOnMobile: true,
        render: (row) => {
          const extra = getExtraRole(row);
          return extra ? (
            <span className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand">
              {extra.name}
            </span>
          ) : (
            <Text size="sm" tag="span" className="ds-text-gray-200">—</Text>
          );
        },
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
          <StatusBadge status={getEmployeeStatus(row)} />
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
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit,   hidden: () => !can("employees.update") },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete, hidden: () => !can("employees.delete") },
  ], [tCommon, openView, openEdit, openDelete, can]);

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
      hourly_rate: v.paymentType === 'hourly' ? Number(v.hourlyRate) : null,
      monthly_salary: v.paymentType === 'monthly' ? Number(v.hourlyRate) : null,
      currency_id: v.currency ? Number(v.currency) : null,
    };
    if (v.company) payload.company_id = Number(v.company);

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
      hourly_rate: v.paymentType === 'hourly' ? Number(v.hourlyRate) : null,
      monthly_salary: v.paymentType === 'monthly' ? Number(v.hourlyRate) : null,
      currency_id: v.currency ? Number(v.currency) : null,
    };
    if (v.password) payload.password    = v.password;
    if (v.company)  payload.company_id  = Number(v.company);

    // `PUT /employees/{id}` treats an absent `role_id` exactly like `null` and
    // detaches whatever extra role the employee has. This form does not edit
    // roles — that lives on the access screen — so it has to carry the current
    // one through, or saving an unrelated field here would revoke their access.
    const currentExtraRole = getExtraRole(selectedRow);
    payload.role_id = currentExtraRole?.id ?? null;

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
  }, [updateEmployee, closeModal, selectedRow]);

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
          actions={
            can("employees.create")
              ? [{ label: t("add"), onClick: () => setIsModalOpen(true) }]
              : []
          }
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