"use client";

import { useState, useMemo } from "react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { PageHeader } from "@/components/molecules/Pageheader";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn, type TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { PageContainer } from "@/components/template/PageContainer";
import type { Payment } from "../types/payments.types";
import { Download, Plus, Eye, Edit2, Trash2, TrendingUp, Clock, FileText } from "@/assets/icons/icons";
import { ArrowUp } from "lucide-react";

const PAGE_SIZE = 4;

const MOCK_DATA = [
  { id: "1", invoice: "#PAY-78945", company: "Advanced Tech Company", date: "2026-06-06 10:30", method: "Stripe", wallet: "Stripe", amount: 1500 },
  { id: "2", invoice: "#INV-2026-0234", company: "Advanced Tech Company", date: "2026-06-06 10:30", method: "PayPal", wallet: "PayPal", amount: 1500 },
  { id: "3", invoice: "#INV-2026-0235", company: "Green Energy Solutions", date: "2026-06-07 14:15", method: "Credit Card", wallet: "Credit Card", amount: 3200 },
  { id: "4", invoice: "#INV-2026-0236", company: "Urban Design Studios", date: "2026-06-08 09:45", method: "Bank Transfer", wallet: "Bank Transfer", amount: 950 },
] as Payment[];

export default function PaymentRecordsPage() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const columns: TableColumn<Payment>[] = useMemo(() => [
    {
      key: "invoice",
      header: "Invoice",
      isPrimary: true,
      render: (row) => (
        <Text size="sm" weight="medium" color="brand" tag="p">
          {row.invoice}
        </Text>
      ),
    },
    {
      key: "company",
      header: "Company",
      render: (row) => <Text size="sm" weight="medium" tag="p">{row.company}</Text>,
    },
    {
      key: "date",
      header: "Date",
      render: (row) => <Text size="sm" color="gray-100" tag="p">{row.date}</Text>,
    },
    {
      key: "method",
      header: "Method",
      render: (row) => <Text size="sm" tag="p">{row.method}</Text>,
    },
    {
      key: "wallet",
      header: "Wallet",
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-gray-400" />
          <Text size="sm" tag="p">{row.wallet}</Text>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <Text size="sm" weight="medium" tag="p">${row.amount.toLocaleString('en-US')}</Text>
      ),
    },
  ], []);

  const actions: TableAction<Payment>[] = useMemo(() => [
    { icon: Eye, label: "View", colorScheme: "send", onClick: () => {} },
    { icon: Edit2, label: "Edit", colorScheme: "edit", onClick: () => {} },
    { icon: Trash2, label: "Delete", colorScheme: "delete", onClick: () => {} },
  ], []);

  return (
    <PageContainer isLoading={false} skeletonVariant="dashboard">
      <PageHeader
        title="Payment Records"
        subtitle="Track, manage, and audit all incoming and outgoing transactions."
        actions={[
          {
            label: "Export Report",
            onClick: () => {},
            icon: Download,
            variant: "outline",
          },
          {
            label: "Add Payment",
            onClick: () => {},
            icon: Plus,
          },
        ]}
      />

      {/* Custom Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex flex-col rounded-2xl px-5 py-4 ds-bg-form ds-border-form" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-green-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-green-500" />
            </div>
            <Text size="sm" color="gray-200" tag="p" className="uppercase tracking-wide font-semibold text-xs">Total Revenue</Text>
          </div>
          <Text size="xl" weight="bold" tag="p" className="mb-3">$1,245,890.00</Text>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              <ArrowUp size={12} /> 12.5%
            </span>
            <Text size="sm" color="gray-200" tag="span">vs last month</Text>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl px-5 py-4 ds-bg-form ds-border-form" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-yellow-50 flex items-center justify-center">
              <Clock size={16} className="text-yellow-500" />
            </div>
            <Text size="sm" color="gray-200" tag="p" className="uppercase tracking-wide font-semibold text-xs">Pending Payments</Text>
          </div>
          <Text size="xl" weight="bold" tag="p" className="mb-3">$45,230.50</Text>
          <Text size="sm" color="gray-200" tag="p">24 invoices awaiting clearance</Text>
        </div>

        <div className="flex flex-col rounded-2xl px-5 py-4 ds-bg-form ds-border-form" style={{ boxShadow: "var(--shadow-sm)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-8 h-8 rounded bg-blue-50 flex items-center justify-center">
              <FileText size={16} className="text-blue-500" />
            </div>
            <Text size="sm" color="gray-200" tag="p" className="uppercase tracking-wide font-semibold text-xs">Transaction Volume</Text>
          </div>
          <Text size="xl" weight="bold" tag="p" className="mb-3">8,432</Text>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
              <ArrowUp size={12} /> 5.2%
            </span>
            <Text size="sm" color="gray-200" tag="span">vs last month</Text>
          </div>
        </div>
      </div>

      <PageCard>
        <PageCardSection>
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => setSearch(v)}
            searchPlaceholder="Searching...."
          />
        </PageCardSection>

        <PageCardBody>
          <DataTable
            columns={columns}
            data={MOCK_DATA}
            actions={actions}
            actionsHeader="Actions"
            isLoading={false}
            emptyMessage="No payments found."
          />
        </PageCardBody>

        <PageCardFooter>
          <Pagination
            currentPage={currentPage}
            data={Array(12).fill(0)} // mock total 12 for 3 pages
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </PageCardFooter>
      </PageCard>
    </PageContainer>
  );
}
