"use client";

import React, { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { PageContainer } from "@/components/template/PageContainer";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { Clock, CheckCircle2, Wallet, LayoutGrid, Plus, XCircle } from "lucide-react";
import { Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { useTranslations, useLocale } from "next-intl";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { useAuth } from "@/providers/AuthProvider";
import AddTimesheetModal from "./AddTimesheetModal";
import EditTimesheetModal from "./EditTimesheetModal";
import { ViewTimesheetModal } from "./ViewTimesheetModal";

import { useTimesheets, useApproveTimesheet, useRejectTimesheet } from "../hooks/useTimesheets";



const PAGE_SIZE = 10;

function EmployeeAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 1).toUpperCase();
  const colors = ["#0ea5e9", "#0ea5e9", "#06b6d4", "#06b6d4"];
  const color = colors[name.charCodeAt(0) % colors.length];
  
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-cyan-50 text-cyan-600 border border-cyan-100">
      {initials}
    </div>
  );
}



export default function TimesheetsPage() {
  const t = useTranslations("timesheets");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company";
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: TimesheetsResponse, isLoading } = useTimesheets({ 
    search, 
    status: statusFilter !== "all" ? statusFilter : undefined, 
    month: monthFilter !== "all" ? monthFilter : undefined, 
    page,
    per_page: PAGE_SIZE
  } as any);
  
  let Timesheets = TimesheetsResponse?.data || [];
  const totalItems = TimesheetsResponse?.total || 0;

  // Local filtering fallback in case the backend ignores the query params
  if (monthFilter !== "all") {
    Timesheets = Timesheets.filter((t: any) => {
      const dString = t.date || t.created_at;
      if (!dString) return false;
      const m = dString.split('-')[1];
      return m === monthFilter;
    });
  }

  if (statusFilter !== "all") {
    Timesheets = Timesheets.filter((t: any) => t.status === statusFilter);
  }

  const approvedCount = Timesheets.filter((t: any) => t.status === "approved").length;
  const pendingCount = Timesheets.filter((t: any) => t.status === "pending").length;
  const totalHoursNum = Timesheets.reduce((sum: number, t: any) => sum + (Number(t.hours) || 0), 0);
  const totalHours = `${Math.floor(totalHoursNum / 60)}h ${Math.round(totalHoursNum % 60)}m`;
  const totalSalaries = Timesheets.reduce((sum: number, t: any) => {
    const emp = t.user?.employee;
    const isMonthly = emp?.payment_type === "monthly" || emp?.paymentType === "monthly";
    const val = isMonthly ? (emp?.salary || emp?.hourly_rate || emp?.hourlyRate || 0) : t.total;
    return sum + (Number(val) || 0);
  }, 0).toFixed(2);

  const approveTimesheet = useApproveTimesheet();
  const rejectTimesheet = useRejectTimesheet();

  const monthOptions = useMemo(() => {
    const options = [{ value: "all", label: t("filter.month") }];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = new Intl.DateTimeFormat(locale, { month: 'long' }).format(d);
      // Try zero-padded month number "07", "06", "05" which is standard for APIs
      const value = String(d.getMonth() + 1).padStart(2, '0');
      options.push({ value, label: monthName });
    }
    return options;
  }, [locale, t]);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<any>();

  const columns: TableColumn<any>[] = useMemo(() => {
    const isSuperAdmin = user?.role === "super_admin";
    const isEmployee = user?.role === "employee";

    const cols: TableColumn<any>[] = [];

    if (!isEmployee) {
      cols.push({
        key: "employee",
        header: t("columns.employee"),
        isPrimary: true,
        render: (row) => {
          const empName = row.user?.name || '-';
          return (
            <div className="flex items-center gap-3">
              <EmployeeAvatar name={empName} />
              <Text size="sm" weight="medium" tag="span" className="ds-text-primary">
                {empName}
              </Text>
            </div>
          );
        },
      });
    }

    if (isSuperAdmin) {
      cols.push({
        key: "company",
        header: t("columns.company"),
        hideOnMobile: true,
        render: (row) => {
          const compName = row.user?.company?.name || '-';
          return <Text size="sm" tag="span">{compName}</Text>;
        },
      });
    }

    cols.push(
      {
        key: "date",
        header: t("columns.date"),
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.date || row.created_at?.split('T')[0] || '-'}</Text>,
      },
      {
        key: "hours",
        header: t("columns.hours"),
        render: (row) => {
          const num = Number(row.hours);
          if (isNaN(num) || row.hours === null || row.hours === undefined) {
            return <Text size="sm" className="ds-text-gray-200">{row.hours || '-'}</Text>;
          }
          const h = Math.floor(num / 60);
          const m = Math.round(num % 60);
          return <Text size="sm" className="ds-text-gray-200">{`${h}h ${m}m`}</Text>;
        },
      },
      {
        key: "rateHr",
        header: t("columns.rate"),
        render: (row) => {
          const emp = row.user?.employee;
          const currency = emp?.currency?.symbol || "";
          const isMonthly = emp?.payment_type === "monthly" || emp?.paymentType === "monthly";
          const val = isMonthly ? (emp?.salary ?? emp?.hourly_rate ?? emp?.hourlyRate) : row.rate;
          return <Text size="sm" className="ds-text-gray-200">{val || '-'} {currency}</Text>;
        }
      },
      {
        key: "rateTotal",
        header: t("columns.rateTotal"),
        render: (row) => {
          const emp = row.user?.employee;
          const currency = emp?.currency?.symbol || "";
          const isMonthly = emp?.payment_type === "monthly" || emp?.paymentType === "monthly";
          const val = isMonthly ? (emp?.salary ?? emp?.hourly_rate ?? emp?.hourlyRate) : row.total;
          return <Text size="sm" weight="bold" className="ds-text-gray-200">{val || '-'} {currency}</Text>;
        }
      },
      {
        key: "status",
        header: t("columns.status"),
        render: (row) => <StatusBadge status={row.status as any} withDot />,
      }
    );

    return cols;
  }, [t, user?.role]);

  const actions: TableAction<any>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { 
      icon: CheckCircle2, 
      label: tCommon("approve") || "Approve", 
      colorScheme: "edit",   
      onClick: (row) => approveTimesheet.mutate(row.id),
      hidden: (row) => row.status === "approved"
    },
    { 
      icon: XCircle, 
      label: tCommon("reject") || "Reject", 
      colorScheme: "delete", 
      onClick: (row) => rejectTimesheet.mutate(row.id),
      hidden: (row) => row.status === "rejected"
    }
  ], [tCommon, openView, approveTimesheet, rejectTimesheet]);

  return (
    <PageContainer isLoading={false} skeletonVariant="dashboard">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 mt-6">
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">{approvedCount}</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.approved")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500">
            <Clock size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">{pendingCount}</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.pending")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500">
            <LayoutGrid size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">{totalHours}</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.totalHours")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500" style={{ backgroundColor: '#f5f5f5' }}>
            <Wallet size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">{totalSalaries}</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.totalSalaries")}</Text>
          </div>
        </div>
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
                onChange: setStatusFilter,
                options: [
                  { value: "all", label: t("filter.allStatus") },
                  { value: "pending", label: "Pending" },
                  { value: "approved", label: "Approved" },
                  { value: "rejected", label: "Rejected" }
                ]
              },
              {
                value: monthFilter,
                onChange: setMonthFilter,
                options: monthOptions
              }
            ]}
          />
        </PageCardSection>

        <PageCardBody>
          <div className="overflow-x-auto w-full">
            <DataTable
              columns={columns}
              data={Timesheets}
              actions={actions}
              actionsHeader={tCommon("actions")}
              emptyMessage={tCommon("noDataFound") || "No time logs found."}
              isLoading={isLoading}
            />
          </div>
        </PageCardBody>

        <PageCardFooter>
          <Pagination
            currentPage={page}
            data={Array(totalItems).fill(0)}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </PageCardFooter>
      </PageCard>

      <AddTimesheetModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <ViewTimesheetModal isOpen={activeModal === "view"} onClose={closeModal} data={selectedRow} />
      <EditTimesheetModal isOpen={activeModal === "edit"} onClose={closeModal} data={selectedRow} />
    </PageContainer>
  );
}
