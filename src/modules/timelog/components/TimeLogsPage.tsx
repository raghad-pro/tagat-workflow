"use client";

import React, { useState, useMemo } from "react";
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
import AddTimeLogModal from "./AddTimeLogModal";
import EditTimeLogModal from "./EditTimeLogModal";
import { ViewTimeLogModal } from "./ViewTimeLogModal";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

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
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-cyan-50 text-cyan-600">
      {initials}
    </div>
  );
}

function CurrencyCard({ symbol, total, paid, pending, t }: { symbol: string, total: string, paid: string, pending: string, t: any }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm">
      <Text size="sm" weight="bold" className="ds-text-primary mb-6">{symbol}Currency</Text>
      
      <div className="text-center mb-8">
        <Text size="sm" className="ds-text-gray-200 mb-1">{t("total") || "Total"}</Text>
        <Text size="xl" weight="bold" className="ds-text-primary text-3xl">{total}</Text>
      </div>

      <div className="flex justify-between items-center mb-2">
        <div>
          <Text size="sm" className="ds-text-gray-200 text-xs">{t("paid") || "Paid"}</Text>
          <Text size="sm" weight="bold" className="ds-text-primary">{paid}</Text>
        </div>
        <div className="text-right">
          <Text size="sm" className="ds-text-gray-200 text-xs">{t("pending") || "Pending"}</Text>
          <Text size="sm" weight="bold" className="text-red-500">{pending}</Text>
        </div>
      </div>

      <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mb-2">
        <div className="bg-red-500 h-1.5 rounded-full w-0"></div>
      </div>
      <div className="flex justify-between items-center">
        <Text size="sm" className="ds-text-gray-200 text-xs">{t("completion") || "Completion"}</Text>
        <Text size="sm" className="ds-text-gray-200 text-xs">0%</Text>
      </div>
    </div>
  );
}

export default function TimeLogsPage() {
  const t = useTranslations("timeLog");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localData, setLocalData] = useState(MOCK_LOGS);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<typeof MOCK_LOGS[0]>();

  const columns: TableColumn<typeof MOCK_LOGS[0]>[] = useMemo(() => [
    {
      key: "employee",
      header: t("columns.employee") || "employee",
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <EmployeeAvatar name={row.employee} />
          <Text size="sm" weight="bold" tag="span" className="ds-text-primary">
            {row.employee}
          </Text>
        </div>
      ),
    },
    {
      key: "company",
      header: t("columns.company") || "Company",
      render: (row) => <Text size="sm" weight="bold" className="ds-text-primary">{row.company}</Text>,
    },
    {
      key: "date",
      header: t("columns.date") || "date",
      render: (row) => <Text size="sm" className="ds-text-gray-200">{row.date}</Text>,
    },
    {
      key: "hours",
      header: t("columns.hours") || "hours",
      render: (row) => <Text size="sm" className="ds-text-gray-200">{row.hours}</Text>,
    },
    {
      key: "rateHr",
      header: t("columns.rate") || "rate",
      render: (row) => <Text size="sm" className="ds-text-gray-200">{row.rateHr}</Text>,
    },
    {
      key: "rateTotal",
      header: t("columns.rate") || "rate",
      render: (row) => <Text size="sm" weight="bold" className="ds-text-gray-200">{row.rateTotal}</Text>,
    },
    {
      key: "status",
      header: t("columns.status") || "status",
      render: (row) => <StatusBadge status={row.status as any} withDot />,
    },
  ], [t]);

  const actions: TableAction<typeof MOCK_LOGS[0]>[] = useMemo(() => [
    { icon: Eye,    label: tCommon("actions.view") || "View",   colorScheme: "send",   onClick: openView },
    { icon: Edit2,  label: tCommon("actions.edit") || "Edit",   colorScheme: "edit",   onClick: openEdit },
    { icon: Trash2, label: tCommon("actions.delete") || "Delete", colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openView, openEdit, openDelete]);

  const filtered = localData.filter((r) => 
    r.employee.toLowerCase().includes(search.toLowerCase()) ||
    r.company.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <PageContainer isLoading={false} skeletonVariant="dashboard">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <Text size="xl" weight="bold" className="ds-text-primary text-2xl">Timesheets Dashboard</Text>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Add Time Log
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500">
              <LayoutGrid size={24} />
            </div>
            <div>
              <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">13h 43m</Text>
              <Text size="sm" className="ds-text-gray-200 text-xs">Total Hours</Text>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500">
              <Wallet size={24} />
            </div>
            <div>
              <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">2,022.41</Text>
              <Text size="sm" className="ds-text-gray-200 text-xs">Total Salaries</Text>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-50 dark:bg-green-900/20 text-green-500">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1">0</Text>
              <Text size="sm" className="ds-text-gray-200 text-xs">Approved</Text>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500">
              <Clock size={24} />
            </div>
            <div>
              <Text size="xl" weight="bold" className="ds-text-primary leading-none mb-1 text-2xl">6</Text>
              <Text size="sm" className="ds-text-gray-200 text-xs">Pending</Text>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border ds-border-form shadow-sm mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Text size="lg" weight="bold" className="ds-text-primary">Salaries by Currency</Text>
              <Text size="sm" className="ds-text-gray-200">Financial overview across currencies</Text>
            </div>
            <div className="px-3 py-1 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium rounded-full">
              Multi Currency
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CurrencyCard t={t} symbol="?" total="941.08" paid="0.00" pending="941.08" />
            <CurrencyCard t={t} symbol="$" total="1,081.33" paid="0.00" pending="1,081.33" />
          </div>
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder="Searching..."
              filters={[
                {
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: [
                    { value: "all", label: "All Status" },
                    { value: "pending", label: "Pending" },
                    { value: "completed", label: "Completed" }
                  ]
                },
                {
                  value: monthFilter,
                  onChange: setMonthFilter,
                  options: [
                    { value: "all", label: "Month" },
                    { value: "jan", label: "January" },
                    { value: "feb", label: "February" }
                  ]
                }
              ]}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={paginated}
              actions={actions}
              actionsHeader="Actions"
              emptyMessage="No time logs found."
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={page}
              data={filtered}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </PageCardFooter>
        </PageCard>
      </div>

      <AddTimeLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={(v) => {
          const newLog = {
            id: Date.now(),
            employee: v.employee,
            company: v.company,
            date: v.date,
            hours: v.hours,
            rateHr: v.rateHr,
            rateTotal: "?" + (parseFloat(v.hours) * parseFloat(v.rateHr.replace('₪','')) || 0).toFixed(2),
            status: "pending"
          };
          setLocalData([newLog, ...localData]);
          setIsModalOpen(false);
        }}
      />

      <ViewTimeLogModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />
      <EditTimeLogModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={(id, data) => { 
          setLocalData(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
          closeModal(); 
        }}
      />
      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title="Delete Time Log?"
        message="This action cannot be undone."
        onConfirm={() => { 
          setLocalData(prev => prev.filter(p => p.id !== selectedRow?.id));
          closeModal(); 
        }}
      />
    </PageContainer>
  );
}
