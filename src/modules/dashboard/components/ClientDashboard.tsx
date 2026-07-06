"use client";

import { useTranslations } from "next-intl";
import { FolderKanban, FileText, Wallet } from "lucide-react";
import { dashboardApi } from "../api/dashboard.api";
import type { DashboardRole } from "../api/dashboard.api";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard } from "./DashboardCard";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { cn } from "@/lib/utils";
import { DataTable, TableColumn } from "@/components/molecules/Datatable";

interface Props { role: DashboardRole; token: string }

function StatusBox({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="rounded-xl p-4 flex flex-col items-center justify-center gap-1 ds-bg">
      <Text size="sm" color="gray-200" className="text-[11px]">{label}</Text>
      <Text size="xl" weight="bold" className={cn("text-2xl", colorClass)}>{value}</Text>
    </div>
  );
}

export function ClientDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "client"],
    queryFn: () => dashboardApi.getDashboard("client", token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const c = data?.clientData;

  const projectsTotal = c?.projectsCount ?? 0;
  const projectsCompleted = c?.projectsCompleted ?? 0;
  const projectsInProgress = c?.projectsInProgress ?? 0;
  const projectsPending = c?.projectsPending ?? 0;

  const totalInvoices = c?.totalInvoicesAmount ?? 0;
  const paidAmount = c?.paidAmount ?? 0;
  const remainingAmount = c?.remainingAmount ?? 0;

  const companies = c?.linkedCompanies ?? [];
  const invoices = c?.latestInvoices ?? [];

  const statCards = [
    { icon: FolderKanban, label: "My Projects", value: String(projectsTotal) },
    {
      icon: FileText,
      label: "Total Invoices",
      value: totalInvoices.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    },
    {
      icon: Wallet,
      label: "Paid Amount",
      value: paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 }),
    },
  ];

  const companiesColumns: TableColumn<any>[] = [
    { key: "name", header: "Company" },
    {
      key: "status",
      header: "Status",
      render: (co) => (
        <StatusBadge
          status={co.status === "approved" ? "active" : co.status === "rejected" ? "rejected" : "pending"}
          label={co.status.charAt(0).toUpperCase() + co.status.slice(1)}
        />
      ),
    },
    { key: "request_date", header: "Request Date", render: (co) => co.request_date || "—" },
  ];

  const invoicesColumns: TableColumn<any>[] = [
    { key: "id", header: "#", render: (inv) => inv.invoice_number || `#${inv.id}` },
    {
      key: "amount",
      header: "Amount",
      render: (inv) => Number(inv.amount).toLocaleString("en-US", { minimumFractionDigits: 2 }),
    },
    { key: "invoice_date", header: "Date", render: (inv) => inv.invoice_date || "—" },
  ];

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        <PageHeader
          title={t("title")}
          subtitle="Overview of your projects, invoices, and linked companies."
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl p-5 flex flex-col gap-1 ds-bg-form ds-border-form ds-shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ds-bg-primary-200">
                  <Icon size={14} className="ds-text-brand" />
                </div>
                <Text size="sm" color="gray-200" className="text-[11px] uppercase tracking-wide">{label}</Text>
              </div>
              <Text size="xl" weight="bold" className="text-2xl leading-tight">{value}</Text>
            </div>
          ))}
        </div>

        <DashboardCard title="Project Status">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusBox label="Completed" value={projectsCompleted} colorClass="ds-text-success" />
            <StatusBox label="In Progress" value={projectsInProgress} colorClass="ds-text-priority-medium" />
            <StatusBox label="Pending" value={projectsPending} colorClass="ds-text-priority-high" />
            <StatusBox label="Total" value={projectsTotal} colorClass="ds-text-brand" />
          </div>
        </DashboardCard>

        <DashboardCard title="Financial Summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center py-2">
            <div>
              <Text size="sm" color="gray-200" tag="p" className="mb-1">Total Invoices</Text>
              <Text size="xl" weight="bold" tag="p" className="text-2xl">
                {totalInvoices.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div>
              <Text size="sm" color="gray-200" tag="p" className="mb-1">Remaining Amount</Text>
              <Text size="xl" weight="bold" tag="p" className="text-2xl ds-text-priority-high">
                {remainingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Linked Companies">
          {companies.length === 0 ? (
            <Text size="sm" color="gray-200" className="text-center py-6">
              No linked companies found.
            </Text>
          ) : (
            <DataTable columns={companiesColumns} data={companies} />
          )}
        </DashboardCard>

        <DashboardCard title="Latest Invoices">
          {invoices.length === 0 ? (
            <Text size="sm" color="gray-200" className="text-center py-6">
              No invoices found.
            </Text>
          ) : (
            <DataTable columns={invoicesColumns} data={invoices} />
          )}
        </DashboardCard>

      </div>
    </PageContainer>
  );
}