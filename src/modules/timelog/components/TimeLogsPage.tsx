"use client";

import React, { useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { PageContainer } from "@/components/template/PageContainer";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { Clock, CheckCircle2, Wallet, LayoutGrid, Plus } from "lucide-react";
import { Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { useActionModals } from "@/hooks/useActionModals";
import { useAuth } from "@/providers/AuthProvider";
import AddTimeLogModal from "./AddTimeLogModal";
import EditTimeLogModal from "./EditTimeLogModal";
import { ViewTimeLogModal } from "./ViewTimeLogModal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

import { useTimelogs, useDeleteTimelog } from "../hooks/useTimelog";

// Mock data kept for stats placeholders if API doesn't return them yet
const MOCK_LOGS = [
  { id: 1, employee: "Ahmed Mohamed Al-Saeed", company: "Advanced Tech Company", date: "2026-06-01", hours: "3h49m", rateHr: "₪", rateTotal: "₪", status: "pending" },
  { id: 2, employee: "Basma Al-Harbi", company: "Innovatech Solutions", date: "2026-06-02", hours: "2h15m", rateHr: "₪", rateTotal: "₪", status: "completed" },
  { id: 3, employee: "Tariq Al-Farsi", company: "Green Energy Corp", date: "2026-06-03", hours: "4h30m", rateHr: "₪", rateTotal: "₪", status: "pending" },
  { id: 4, employee: "Thuraya Al-Najdi", company: "Creative Design Studio", date: "2026-06-04", hours: "1h20m", rateHr: "₪", rateTotal: "₪", status: "pending" },
];

const PAGE_SIZE = 4;

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

function CurrencyCard({ symbol, total, paid, pending, t }: { symbol: string, total: string, paid: string, pending: string, t: any }) {
  return (
    <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm">
      <Text size="sm" weight="bold" className="ds-text-primary mb-6">{symbol} Currency</Text>
      
      <div className="text-center mb-8">
        <Text size="sm" className="ds-text-gray-200 mb-1">{t("stats.total")}</Text>
        <Text size="xl" weight="bold" className="ds-text-primary text-3xl">{total}</Text>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.paid")}</Text>
          <Text size="sm" weight="bold" className="ds-text-primary">{paid}</Text>
        </div>
        <div className="text-right">
          <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.pending")}</Text>
          <Text size="sm" weight="bold" className="text-red-500">{pending}</Text>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mb-2">
        <div className="bg-red-500 h-1.5 rounded-full w-0"></div>
      </div>
      <div className="flex justify-between items-center">
        <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.completion")}</Text>
        <Text size="sm" className="ds-text-gray-200 text-xs">0%</Text>
      </div>
    </div>
  );
}

export default function TimeLogsPage() {
  const t = useTranslations("timeLog");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isCompanyAdmin = user?.role === "company_admin";
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: timelogsResponse, isLoading } = useTimelogs({ 
    search, 
    status: statusFilter !== "all" ? statusFilter : undefined, 
    month: monthFilter !== "all" ? monthFilter : undefined, 
    page 
  });
  
  const timelogs = timelogsResponse?.data || [];
  const totalItems = timelogsResponse?.total || 0;

  const deleteTimelog = useDeleteTimelog();

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<any>();

  const columns: TableColumn<any>[] = useMemo(() => {
    const cols: TableColumn<any>[] = [
      {
        key: "employee",
        header: t("columns.employee"),
        isPrimary: true,
        render: (row) => {
          let empName = typeof row.employee === 'object' ? (row.employee?.name || row.employee?.user?.name || '') : (row.employee || '');
          if (!empName && row.user) {
            empName = typeof row.user === 'object' ? (row.user?.name || '') : row.user;
          }
          return (
            <div className="flex items-center gap-3">
              <EmployeeAvatar name={empName || '?'} />
              <Text size="sm" weight="medium" tag="span" className="ds-text-primary">
                {empName || '-'}
              </Text>
            </div>
          );
        },
      },
      {
        key: "date",
        header: t("columns.date"),
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.date || row.created_at?.split('T')[0] || '-'}</Text>,
      },
      {
        key: "hours",
        header: t("columns.hours"),
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.hours || '-'}</Text>,
      },
      {
        key: "rateHr",
        header: t("columns.rate"),
        render: (row) => <Text size="sm" className="ds-text-gray-200">{row.rateHr || row.rate || '-'}</Text>,
      },
      {
        key: "rateTotal",
        header: t("columns.rate"),
        render: (row) => <Text size="sm" weight="bold" className="ds-text-gray-200">{row.rateTotal || row.total || '-'}</Text>,
      },
      {
        key: "status",
        header: t("columns.status"),
        render: (row) => <StatusBadge status={row.status as any} withDot />,
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("columns.company"),
        hideOnMobile: true,
        render: (row) => {
          const compName = typeof row.company === 'object' ? row.company?.name : row.project?.company?.name || row.task?.project?.company?.name || row.company;
          return <Text size="sm" tag="span">{compName || '-'}</Text>;
        },
      });
    }

    return cols;
  }, [t, isCompanyAdmin]);

  const actions: TableAction<typeof MOCK_LOGS[0]>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  return (
    <PageContainer isLoading={false} skeletonVariant="dashboard">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[
          {
            label: t("add"),
            onClick: () => setIsModalOpen(true),
            icon: Plus,
            variant: "solid"
          },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 mt-6">
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">0</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.approved")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500">
            <Clock size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">6</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.pending")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500">
            <LayoutGrid size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">13h 43m</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.totalHours")}</Text>
          </div>
        </div>
        <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
            <Wallet size={24} />
          </div>
          <div>
            <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">2,022.41</Text>
            <Text size="sm" className="ds-text-gray-200 text-xs">{t("stats.totalSalaries")}</Text>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[var(--color-bg-form)] rounded-2xl p-6 border ds-border-form shadow-sm mb-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <Text size="lg" weight="bold" className="ds-text-primary">{t("currencyCard.title")}</Text>
            <Text size="sm" className="ds-text-gray-200">{t("currencyCard.subtitle")}</Text>
          </div>
          <div className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium rounded-full">
            {t("currencyCard.badge")}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CurrencyCard t={t} symbol="$" total="1,081.33" paid="0.00" pending="1,081.33" />
          <CurrencyCard t={t} symbol="₪" total="941.08" paid="0.00" pending="941.08" />
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
                  { value: "pending", label: t("filter.pending") },
                  { value: "completed", label: t("filter.completed") }
                ]
              },
              {
                value: monthFilter,
                onChange: setMonthFilter,
                options: [
                  { value: "all", label: t("filter.month") },
                  { value: "jan", label: t("filter.jan") },
                  { value: "feb", label: t("filter.feb") }
                ]
              }
            ]}
          />
        </PageCardSection>

        <PageCardBody>
          <DataTable
            columns={columns}
            data={timelogs}
            actions={actions}
            actionsHeader={tCommon("actions")}
            emptyMessage={tCommon("noDataFound") || "No time logs found."}
            isLoading={isLoading}
          />
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

      <AddTimeLogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <DeleteConfirmationModal 
        isOpen={activeModal === "delete"} 
        onClose={closeModal} 
        title={tCommon("delete") || "Delete Time Log"} 
        itemName={selectedRow?.employee} 
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteTimelog.mutate(selectedRow.id, {
              onSuccess: () => closeModal()
            });
          }
        }} 
      />
      <ViewTimeLogModal isOpen={activeModal === "view"} onClose={closeModal} data={selectedRow} />
      <EditTimeLogModal isOpen={activeModal === "edit"} onClose={closeModal} data={selectedRow} />
    </PageContainer>
  );
}
