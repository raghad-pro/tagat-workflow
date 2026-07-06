"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader }     from "@/components/molecules/Pageheader";
import { PageContainer }  from "@/components/template/PageContainer";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { Pagination }      from "@/components/molecules/Pagination";
import { DataTable, type TableColumn } from "@/components/molecules/Datatable";
import { Text }            from "@/components/atoms/Text";
import { StatusBadge }     from "@/components/atoms/Statusbadge";
import { ClientAvatar }    from "@/components/atoms/Clientavatar";
import { CheckCircle2, X } from "lucide-react";
import { useJoinRequests }       from "../hooks/useJoinrequests";
import { useApproveJoinRequest } from "../hooks/useApprovejoinrequest";
import { useRejectJoinRequest }  from "../hooks/useRejectjoinrequest";
import { useAuth }               from "@/providers/AuthProvider";
import { JOIN_REQUEST_STATUS_MAP } from "../types/company-requests.types";
import type {
  JoinRequestClient,
  JoinRequestCompany,
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
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
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
  const t       = useTranslations("companyRequest");
  const tCommon = useTranslations("common");

  const [search, setSearch]       = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const role = user?.role ?? "super_admin";
  const isSuperAdmin = role === "super_admin";

  const { data, isLoading } = useJoinRequests({
    search: search || undefined,
    page: 1,
    per_page: 1000, 
  });

  const { mutate: approve } = useApproveJoinRequest();
  const { mutate: reject }  = useRejectJoinRequest();

  // Flatten and filter data
  const flatRequests = useMemo(() => {
    const raw = data?.raw ?? [];
    const flat: FlatJoinRequest[] = [];
    raw.forEach((client) => {
      client.companies.forEach((company) => {
        // Hide other companies' requests from the current company admin
        if (!isSuperAdmin && company.id !== user?.company_id && company.email !== user?.email) {
          return;
        }
        
        flat.push({
          id: `${client.id}-${company.id}`,
          client,
          company,
        });
      });
    });

    if (!search.trim()) return flat;
    const q = search.trim().toLowerCase();
    return flat.filter(
      (r) =>
        r.client.name.toLowerCase().includes(q) ||
        r.company.name.toLowerCase().includes(q) ||
        r.company.email.toLowerCase().includes(q)
    );
  }, [data?.raw, search]);

  const pagedRequests = flatRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };

  // ─── Table Columns ──────────────────────────────────────────────────────────
  const columns = useMemo<TableColumn<FlatJoinRequest>[]>(() => {
    const cols: TableColumn<FlatJoinRequest>[] = [
      {
        key: "clientName",
        header: "Client Name",
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
        header: "Company",
        render: (row) => (
          <Text size="sm" tag="p">
            {row.company.name}
          </Text>
        ),
      });
    }

    cols.push({
      key: "email",
      header: "Email",
      render: (row) => (
        <Text size="sm" color="gray-200" tag="p">
          {row.company.email}
        </Text>
      ),
    });

    cols.push({
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge
          status={JOIN_REQUEST_STATUS_MAP[row.company.pivot.status as JoinRequestStatus]}
        />
      ),
    });

    cols.push({
      key: "actions",
      header: "Actions",
      render: (row) => {
        const isPending = row.company.pivot.status === "pending";
        if (!isPending) return null;
        
        return (
          <div className="flex items-center justify-start gap-1">
            <ActionBtn
              title="Approve"
              bg="rgba(34,197,94,0.15)"
              color="#22c55e"
              onClick={() =>
                approve({ role, clientId: row.client.id, companyId: row.company.id })
              }
            >
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </ActionBtn>
            <ActionBtn
              title="Reject"
              bg="rgba(239,68,68,0.15)"
              color="#ef4444"
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
  }, [isSuperAdmin, approve, reject, role]);

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="table" skeletonRows={PAGE_SIZE}>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-6">
        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={handleSearch}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody className="!p-0">
            <DataTable
              columns={columns}
              data={pagedRequests}
              emptyMessage={t("noRequests")}
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={currentPage}
              data={Array(flatRequests.length).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </PageCardFooter>
        </PageCard>
      </div>
    </PageContainer>
  );
}