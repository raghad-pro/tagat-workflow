"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { useEmployees, useEmployeeStats, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "../hooks/useEmployees";
import { Users, CheckCircle2, Sun, Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { Employee } from "../types/employees.types";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import AddEmployeeModal from "./AddEmployeeModal";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { ViewEmployeeModal } from "./ViewEmployeeModal";
import EditEmployeeModal from "./EditEmployeeModal";
import { useAuth } from "@/providers/AuthProvider";

const PAGE_SIZE = 4;

function EmpStatCard({ icon: Icon, value, label, iconColor, iconBg }: { icon: React.ElementType; value: number; label: string; iconColor: string; iconBg: string; }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5 rounded-2xl ds-bg-form" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
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
  const initials = (name || "U").split(" ").slice(0, 1).map((w) => w[0]).join("").toUpperCase();
  const colors = ["#0ea5e9", "#6366f1", "#22c55e", "#eab308", "#ec4899", "#f97316"];
  const color = colors[(name || "U").charCodeAt(0) % colors.length];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: color }}>
      {initials}
    </div>
  );
}

function PaymentBadge({ type }: { type: string }) {
  const isMonthly = type === "Monthly" || type?.toLowerCase() === "monthly";
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold", isMonthly ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-blue-500 bg-blue-50 dark:bg-blue-900/20")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", isMonthly ? "bg-green-500" : "bg-blue-400")} />
      {type || "-"}
    </span>
  );
}

export default function EmployeesManagementPage() {
  const t = useTranslations("employee");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";

  const { data: statsData } = useEmployeeStats();
  const { data: empData, isLoading, isFetching } = useEmployees({ search, page, per_page: PAGE_SIZE });

  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<any>();

  const employees = empData?.data ?? [];
  const total = empData?.meta?.total ?? 0;

  const statsItems = [
    { icon: Users, value: statsData?.total ?? 247, label: t("stats.total"), iconColor: "#0ea5e9", iconBg: "rgba(14,165,233,0.12)" },
    { icon: CheckCircle2, value: statsData?.active ?? 47, label: t("stats.active"), iconColor: "#25c6da", iconBg: "rgba(37,198,218,0.12)" },
    { icon: Sun, value: statsData?.onboarding ?? 6, label: t("stats.onLeave") || "Onboarding", iconColor: "#f59e0b", iconBg: "rgba(245,158,11,0.12)" },
  ];

  const columns = useMemo<TableColumn<any>[]>(() => {
    const cols: TableColumn<any>[] = [
      { key: "name", header: t("columns.employee"), isPrimary: true, render: (row) => {
        const empName = row.employee_name || row.employeeName || row.name || row.user?.name || (row.user?.first_name ? `${row.user.first_name} ${row.user.last_name || ''}` : null) || '-';
        return (<div className="flex items-center gap-3"><EmployeeAvatar name={empName} /><Text size="sm" weight="medium" tag="span">{empName}</Text></div>);
      } },
      { key: "job", header: t("columns.job"), hideOnMobile: true, render: (row) => <Text size="sm" tag="span">{row.job_title || row.jobTitle || row.job || '-'}</Text> },
      { key: "currency", header: t("columns.currency"), hideOnMobile: true, render: (row) => <Text size="sm" tag="span">{typeof row.currency === 'object' ? (row.currency?.name || row.currency?.code) : row.currency || '-'}</Text> },
      { key: "salary", header: t("columns.salary"), render: (row) => <Text size="sm" tag="span">{row.salary || row.hourly_rate || row.hourlyRate || '-'}</Text> },
      { key: "paymentType", header: t("columns.paymentType"), render: (row) => <PaymentBadge type={row.paymentType || row.payment_type} /> },
    ];
    if (!isCompanyAdmin) {
      cols.splice(1, 0, { key: "company", header: t("columns.company"), render: (row) => <Text size="sm" tag="span">{typeof row.company === 'object' ? row.company?.name : row.company || '-'}</Text> });
    }
    return cols;
  }, [t, isCompanyAdmin]);

  const actions = useMemo<TableAction<any>[]>(() => [
    { icon: Eye, label: tCommon("view"), colorScheme: "send", onClick: openView },
    { icon: Edit2, label: tCommon("edit"), colorScheme: "edit", onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const filterOptions = [
    { value: "all", label: t("filter.all") },
    { value: "active", label: t("filter.active") },
    { value: "onboarding", label: t("filter.onboarding") },
    { value: "inactive", label: t("filter.inactive") },
  ];

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader title={t("title")} subtitle={t("subtitle")} actions={[{ label: t("add"), onClick: () => setIsModalOpen(true) }]} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {statsItems.map((s) => <EmpStatCard key={s.label} {...s} />)}
        </div>
        <PageCard>
          <PageCardSection>
            <SearchFilterBar search={search} onSearchChange={(v) => { setSearch(v); setPage(1); }} searchPlaceholder={t("searchPlaceholder")} filters={[{ value: "all", onChange: () => {}, options: filterOptions }]} />
          </PageCardSection>
          <PageCardBody>
            <DataTable columns={columns} data={employees} actions={actions} actionsHeader={tCommon("actions")} isLoading={isFetching} />
          </PageCardBody>
          <PageCardFooter>
            <Pagination currentPage={page} data={Array(total).fill(0)} pageSize={PAGE_SIZE} onPageChange={setPage} />
          </PageCardFooter>
        </PageCard>
      </PageContainer>
      <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={(v, setError) => { 
        const payload: any = { name: v.employeeName, email: v.email, payment_type: v.paymentType, job_title: v.jobTitle, password: v.password, salary: v.hourlyRate, currency_id: v.currency };
        if (v.company) payload.company_id = v.company;
        createEmployee.mutate(payload, { 
          onSuccess: () => { toast.success("Employee added successfully"); setIsModalOpen(false); }, 
          onError: (err: any) => {
            console.error(err?.response?.data);
            let msg = err?.response?.data?.message || err?.message || "Failed to add employee";
            if (err?.response?.data?.errors) {
               const errors = err.response.data.errors;
               if (errors.email) {
                 setError("email", { type: "server", message: errors.email[0] });
               }
               const firstError = Object.values(errors)[0] as any;
               if (firstError && firstError.length) msg = firstError[0];
            }
            toast.error(msg); 
          }
        }); 
      }} />
      <DeleteConfirmationModal isOpen={activeModal === "delete"} onClose={closeModal} title={tCommon("delete") || "Delete Employee"} itemName={selectedRow?.employee_name || selectedRow?.employeeName || selectedRow?.name || selectedRow?.user?.name || "this employee"} onConfirm={() => { if (selectedRow?.id) { deleteEmployee.mutate(selectedRow.id, { onSuccess: () => { toast.success("Employee deleted successfully"); closeModal(); }, onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete employee") }); } }} />
      <ViewEmployeeModal isOpen={activeModal === "view"} onClose={closeModal} data={selectedRow} />
      <EditEmployeeModal isOpen={activeModal === "edit"} onClose={closeModal} data={selectedRow} onUpdate={(id, v, setError) => { 
        const payload: any = { name: v.employeeName, email: v.email, payment_type: v.paymentType, job_title: v.jobTitle, salary: v.hourlyRate, currency_id: v.currency };
        if (v.password) payload.password = v.password;
        if (v.company) payload.company_id = v.company;
        updateEmployee.mutate({ id, data: payload }, { 
          onSuccess: () => { toast.success("Employee updated successfully"); closeModal(); }, 
          onError: (err: any) => {
            console.error(err?.response?.data);
            let msg = err?.response?.data?.message || err?.message || "Failed to update employee";
            if (err?.response?.data?.errors) {
               const errors = err.response.data.errors;
               if (errors.email) {
                 setError("email", { type: "server", message: errors.email[0] });
               }
               const firstError = Object.values(errors)[0] as any;
               if (firstError && firstError.length) msg = firstError[0];
            }
            toast.error(msg); 
          }
        }); 
      }} />
    </>
  );
}

