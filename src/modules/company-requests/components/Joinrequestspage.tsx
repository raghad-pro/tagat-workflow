"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/molecules/Pageheader";
import { PageContainer } from "@/components/template/PageContainer";
import { StatsGrid, type StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, type TableColumn } from "@/components/molecules/Datatable";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import { CheckCircle2, X, Users, Building2, Clock, Check } from "lucide-react";
import { useJoinRequests } from "../hooks/useJoinrequests";
import { useApproveJoinRequest } from "../hooks/useApprovejoinrequest";
import { useRejectJoinRequest } from "../hooks/useRejectjoinrequest";
import { useAuth } from "@/providers/AuthProvider";
import { JOIN_REQUEST_STATUS_MAP } from "../types/company-requests.types";
import type {
  JoinRequestClient,
  JoinRequestCompany,
  JoinRequestsQueryParams,
  JoinRequestStatus,
} from "../types/company-requests.types";

const PAGE_SIZE = 10;

interface FlatJoinRequest {
  id: string;
  client: JoinRequestClient;
  company: JoinRequestCompany;
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  title,
  bg,
  color,
  children,
}: {
  onClick: () => void;
  title: string;
  bg: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:opacity-80 cursor-pointer"
      style={{
        background: bg,
        color: color,
      }}
    >
      {children}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function JoinRequestsPage() {
  const t = useTranslations("companyRequest");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const role = user?.role ?? "super_admin";
  const isSuperAdmin = role === "super_admin";

  const { data, isLoading, isError, error, refetch } = useJoinRequests({
    search: search || undefined,
    status: (status || undefined) as JoinRequestsQueryParams["status"],
  });

  const { mutate: approve } = useApproveJoinRequest();
  const { mutate: reject } = useRejectJoinRequest();

  // Flatten and filter data
  const flatRequests = useMemo(() => {
    const raw = data?.raw ?? [];
    const flat: FlatJoinRequest[] = [];
    raw.forEach((client: JoinRequestClient) => {
      if (!client || !Array.isArray(client.companies)) return;
      client.companies.forEach((company: JoinRequestCompany) => {
        if (!company) return;
        // Hide other companies' requests from the current company admin. Only
        // when there is something to compare against — a company account with
        // no `company_id` and a different contact email would otherwise be
        // filtered down to an empty table.
        const canScope = user?.company_id != null || !!user?.email;
        if (
          !isSuperAdmin &&
          canScope &&
          company.id !== user?.company_id &&
          company.email !== user?.email
        ) {
          return;
        }

        flat.push({
          id: `${client.id}-${company.id}`,
          client,
          company,
        });
      });
    });

    const byStatus = status
      ? flat.filter((r) => (r.company.pivot?.status || "pending") === status)
      : flat;

    if (!search.trim()) return byStatus;
    const q = search.trim().toLowerCase();
    return byStatus.filter(
      (r) =>
        r.client.name.toLowerCase().includes(q) ||
        r.company.name.toLowerCase().includes(q) ||
        r.company.email.toLowerCase().includes(q)
    );
  }, [data?.raw, search, status, isSuperAdmin, user?.company_id, user?.email]);

  const pagedRequests = flatRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };

  const handleStatus = (v: string) => {
    setStatus(v);
    setCurrentPage(1);
  };

  // Stats
  const stats: StatItem[] = useMemo(() => {
    const total = flatRequests.length;
    const pending = flatRequests.filter((r) => r.company.pivot?.status === "pending").length;
    const approved = flatRequests.filter((r) => r.company.pivot?.status === "approved").length;
    const rejected = flatRequests.filter((r) => r.company.pivot?.status === "rejected").length;

    return [
      {
        label: t("stats.total"),
        value: total,
        icon: Users,
        iconBg: "#E6F6FE",
        iconColor: "#03A9F4",
      },
      {
        label: t("stats.pending"),
        value: pending,
        icon: Clock,
        iconBg: "#FFFDEB",
        iconColor: "#E8D636",
      },
      {
        label: t("stats.approved") || "Approved",
        value: approved,
        icon: Check,
        iconBg: "#EDF7EE",
        iconColor: "#4CAF50",
      },
      {
        label: t("stats.rejected") || "Rejected",
        value: rejected,
        icon: X,
        iconBg: "#FEECEB",
        iconColor: "#F44336",
      },
    ];
  }, [flatRequests, t]);

  // ─── Table Columns ──────────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<FlatJoinRequest>[]>(() => {
    const cols: TableColumn<FlatJoinRequest>[] = [
      {
        key: "clientName",
        header: t("columns.clientName") || "Client Name",
        isPrimary: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <ClientAvatar name={row.client.name} size="sm" />
            <Text size="sm" weight="bold" tag="p" className="truncate">
              {row.client.name}
            </Text>
          </div>
        ),
      },
    ];

    if (isSuperAdmin) {
      cols.push({
        key: "company",
        header: t("columns.company") || "Company",
        render: (row) => (
          <Text size="sm" tag="p">
            {row.company.name}
          </Text>
        ),
      });
    }

    cols.push({
      key: "email",
      header: t("columns.email") || "Email",
      render: (row) => (
        <Text size="sm" color="gray-200" tag="p">
          {row.company.email}
        </Text>
      ),
    });

    cols.push({
      key: "status",
      header: t("columns.status") || "Status",
      render: (row) => {
        const rawStatus = (row.company.pivot?.status as JoinRequestStatus) || "pending";
        const mappedStatus = JOIN_REQUEST_STATUS_MAP[rawStatus] || "pending";
        return (
          <StatusBadge
            status={mappedStatus}
            label={t(`statusOptions.${mappedStatus}`) || mappedStatus}
          />
        );
      },
    });

    cols.push({
      key: "actions",
      header: t("columns.actions") || "Actions",
      render: (row) => {
        const isPending = row.company.pivot?.status === "pending";
        if (!isPending) return <span className="text-xs text-muted-foreground">-</span>;

        return (
          <div className="flex items-center justify-start gap-1.5">
            <ActionBtn
              title="Approve"
              bg="#EDF7EE"
              color="#4CAF50"
              onClick={() =>
                approve({ role, clientId: row.client.id, companyId: row.company.id })
              }
            >
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </ActionBtn>
            <ActionBtn
              title="Reject"
              bg="#FEECEB"
              color="#F44336"
              onClick={() =>
                reject({ role, clientId: row.client.id, companyId: row.company.id })
              }
            >
              <X size={18} strokeWidth={2.5} />
            </ActionBtn>
          </div>
        );
      },
    });

    return cols;
  }, [isSuperAdmin, approve, reject, role, t]);

  return (
    <PageContainer
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={refetch}
      skeletonVariant="table"
      skeletonRows={PAGE_SIZE}
    >
      <PageHeader
        title={t("title") || "Company Requests"}
        subtitle={t("subtitle") || "Manage and review client join requests to companies"}
      />

      {/* Stats Cards */}
      <StatsGrid stats={stats} cols={4} />

      {/* Search Bar */}
      <div className="mb-4">
        <SearchFilterBar
          search={search}
          onSearchChange={handleSearch}
          searchPlaceholder={t("searchPlaceholder") || "Searching..."}
          filters={[
            {
              value: status,
              onChange: handleStatus,
              options: [
                { value: "", label: t("filter.all") },
                { value: "pending", label: t("statusOptions.pending") },
                { value: "approved", label: t("statusOptions.approved") },
                { value: "rejected", label: t("statusOptions.rejected") },
              ],
            },
          ]}
        />
      </div>

      {/* Data Table */}
      <div className="rounded-2xl bg-card shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] overflow-hidden">
        <DataTable
          columns={columns}
          data={pagedRequests}
          emptyMessage={t("noRequests") || "No join requests found."}
          pagination={{
            currentPage,
            pageSize: PAGE_SIZE,
            totalItems: flatRequests.length,
            onPageChange: setCurrentPage,
          }}
        />
      </div>
    </PageContainer>
  );
}