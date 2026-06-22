"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/molecules/Pageheader";
import { PageContainer } from "@/components/template/PageContainer";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { Check, X } from "lucide-react";
import { useJoinRequests } from "../hooks/useJoinrequests";
import { useApproveJoinRequest } from "../hooks/useApprovejoinrequest";
import { useRejectJoinRequest } from "../hooks/useRejectjoinrequest";
import { useAuth } from "@/providers/AuthProvider";
import type { JoinRequest, JoinRequestsQueryParams } from "../types/company-requests.types";

const PAGE_SIZE = 10;

// ─── Avatar ───────────────────────────────────────────────────────────────────
function ClientAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 1).toUpperCase();
  const colors = ["#0ea5e9", "#6366f1", "#06b6d4", "#8b5cf6"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: `${color}1A`, color }}
    >
      {initials}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: JoinRequest["status"] }) {
  const styles: Record<JoinRequest["status"], string> = {
    pending:  "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    approved: "bg-green-100  dark:bg-green-900/30  text-green-700  dark:text-green-400",
    rejected: "bg-red-100    dark:bg-red-900/30    text-red-700    dark:text-red-400",
  };
  return (
    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
      {status}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function JoinRequestsPage() {
  const t       = useTranslations("companyRequest");
  const tCommon = useTranslations("common");

  const [params, setParams] = useState<JoinRequestsQueryParams>({
    search:   undefined,
    page:     1,
    per_page: PAGE_SIZE,
  });

  const { data, isLoading } = useJoinRequests(params);
  const { user } = useAuth();

  const resolvedRole   = user?.role ?? "super_admin";
  const isCompanyAdmin = resolvedRole === "company_admin";
  
  // بناءً على طلبك الأخير: إخفاء الطلب بعد القبول/الرفض لجميع الصلاحيات (بما فيها السوبر أدمن)
  const rows           = (data?.rows ?? []).filter(r => r.status === "pending");

  const { mutate: approve, isPending: isApproving } = useApproveJoinRequest();
  const { mutate: reject,  isPending: isRejecting  } = useRejectJoinRequest();

  // ─── Columns ─────────────────────────────────────────────────────────────────
  const columns: TableColumn<JoinRequest>[] = useMemo(() => {
    const base: TableColumn<JoinRequest>[] = [
      {
        key: "clientName",
        header: t("columns.customerName"),
        isPrimary: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <ClientAvatar name={row.clientName} />
            <Text size="sm" weight="medium" tag="span" className="ds-text-primary">
              {row.clientName}
            </Text>
          </div>
        ),
      },
      {
        key: "companyEmail",
        header: t("columns.email"),
        render: (row) => (
          <Text size="sm" className="ds-text-gray-200">{row.companyEmail}</Text>
        ),
      },
      {
        key: "status",
        header: t("columns.status"),
        render: (row) => <StatusBadge status={row.status} />,
      },
    ];

    // حقل الشركة بيختفي لـ company_admin
    if (!isCompanyAdmin) {
      base.splice(2, 0, {
        key: "companyName",
        header: t("columns.company"),
        render: (row) => (
          <Text size="sm" weight="medium" className="ds-text-primary">
            {row.companyName}
          </Text>
        ),
      });
    }

    return base;
  }, [t, isCompanyAdmin]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const actions: TableAction<JoinRequest>[] = useMemo(() => [
    {
      icon: Check,
      label: t("actions.accept"),
      colorScheme: "edit",
      onClick: (row) =>
        approve({ role: resolvedRole, clientId: row.clientId, companyId: row.companyId }),
      disabled: (row: JoinRequest) => row.status !== "pending" || isApproving,
    },
    {
      icon: X,
      label: t("actions.reject"),
      colorScheme: "delete",
      onClick: (row) =>
        reject({ role: resolvedRole, clientId: row.clientId, companyId: row.companyId }),
      disabled: (row: JoinRequest) => row.status !== "pending" || isRejecting,
    },
  ], [t, resolvedRole, approve, reject, isApproving, isRejecting]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <div className="mt-8">
        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={params.search ?? ""}
              onSearchChange={(v) =>
                setParams((prev) => ({ ...prev, search: v || undefined, page: 1 }))
              }
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={rows}
              actions={actions}
              actionsHeader={tCommon("actions")}
              emptyMessage={t("noRequests")}
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={params.page ?? 1}
              data={rows}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setParams((prev) => ({ ...prev, page: p }))}
            />
          </PageCardFooter>
        </PageCard>
      </div>
    </PageContainer>
  );
}