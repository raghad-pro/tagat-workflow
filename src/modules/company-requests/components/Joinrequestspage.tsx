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

const PAGE_SIZE = 6;

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  title,
  hoverBg,
  hoverColor,
  children,
}: {
  onClick: () => void;
  title: string;
  hoverBg: string;
  hoverColor: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-lg ds-text-gray-200 transition-all"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = hoverBg;
        el.style.color = hoverColor;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.background = "transparent";
        el.style.color = "";
      }}
    >
      {children}
    </button>
  );
}

// ─── Company Sub-Row ──────────────────────────────────────────────────────────
function CompanySubRow({
  company,
  clientId,
  role,
  onApprove,
  onReject,
  isLast,
}: {
  company: JoinRequestCompany;
  clientId: number;
  role: string;
  onApprove: (p: { role: string; clientId: number; companyId: number }) => void;
  onReject:  (p: { role: string; clientId: number; companyId: number }) => void;
  isLast: boolean;
}) {
  const isPending = company.pivot.status === "pending";

  return (
    <div
      className="grid items-center gap-4 px-4 py-2.5 transition-colors hover:bg-[var(--color-bg)]"
      style={{
        gridTemplateColumns: "2fr 2fr 130px 80px",
        borderBottom: !isLast ? "1px solid var(--color-border-form)" : "none",
      }}
    >
      <Text size="sm" tag="p" className="truncate ps-2">{company.name}</Text>

      <Text size="sm" color="gray-200" tag="p" className="truncate">{company.email}</Text>

      <div>
        <StatusBadge
          status={JOIN_REQUEST_STATUS_MAP[company.pivot.status as JoinRequestStatus]}
          label={company.pivot.status.charAt(0).toUpperCase() + company.pivot.status.slice(1)}
        />
      </div>

      <div className="flex items-center gap-1">
        {isPending && (
          <>
            <ActionBtn
              title="Approve"
              hoverBg="rgba(34,197,94,0.10)"
              hoverColor="#15803d"
              onClick={() => onApprove({ role, clientId, companyId: company.id })}
            >
              <CheckCircle2 size={15} />
            </ActionBtn>
            <ActionBtn
              title="Reject"
              hoverBg="rgba(239,68,68,0.10)"
              hoverColor="#dc2626"
              onClick={() => onReject({ role, clientId, companyId: company.id })}
            >
              <X size={15} />
            </ActionBtn>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Client Row ───────────────────────────────────────────────────────────────
function ClientRow({
  client,
  role,
  onApprove,
  onReject,
  isLast,
}: {
  client: JoinRequestClient;
  role: string;
  onApprove: (p: { role: string; clientId: number; companyId: number }) => void;
  onReject:  (p: { role: string; clientId: number; companyId: number }) => void;
  isLast: boolean;
}) {
  const pendingCount = client.companies.filter((co) => co.pivot.status === "pending").length;

  return (
    <div style={{ borderBottom: !isLast ? "2px solid var(--color-border-form)" : "none" }}>

      {/* ── Client header ── */}
      <div
        className="grid items-center gap-4 px-4 py-3"
        style={{ gridTemplateColumns: "2fr 6fr 80px" }}
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-2.5">
          <ClientAvatar name={client.name} size="sm" />
          <Text size="sm" weight="bold" tag="p" className="truncate">
            {client.name}
          </Text>
        </div>

        {/* Company chips */}
        <div className="flex flex-wrap gap-1.5">
          {client.companies.map((co) => (
            <span
              key={co.id}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--color-bg-primary-200)",
                color: "var(--color-primary)",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {co.name}
            </span>
          ))}
        </div>

        {/* Pending badge */}
        <div>
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap"
              style={{ background: "rgba(251,191,36,0.15)", color: "#d97706" }}
            >
              {pendingCount} pending
            </span>
          )}
        </div>
      </div>

      {/* ── Sub-table header ── */}
      <div
        className="grid gap-4 px-4 py-1.5"
        style={{
          gridTemplateColumns: "2fr 2fr 130px 80px",
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border-form)",
          borderBottom: "1px solid var(--color-border-form)",
        }}
      >
        {["Company", "Email", "Status", "Actions"].map((h, i) => (
          <Text
            key={h}
            size="sm"
            color="gray-200"
            tag="p"
            className={`text-[11px] font-medium ${i === 0 ? "ps-2" : ""}`}
          >
            {h}
          </Text>
        ))}
      </div>

      {/* ── Company rows ── */}
      {client.companies.map((co, i) => (
        <CompanySubRow
          key={co.id}
          company={co}
          clientId={client.id}
          role={role}
          onApprove={onApprove}
          onReject={onReject}
          isLast={i === client.companies.length - 1}
        />
      ))}
    </div>
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

  const { data, isLoading } = useJoinRequests({
    search: search || undefined,
    page: 1,
    per_page: 100, // نجيب الكل ونعمل pagination client-side على مستوى العملاء
  });

  const { mutate: approve } = useApproveJoinRequest();
  const { mutate: reject }  = useRejectJoinRequest();

  // فلتر البحث client-side
  const clients = useMemo(() => {
    const raw = data?.raw ?? [];
    if (!search.trim()) return raw;
    const q = search.trim().toLowerCase();
    return raw.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.companies.some(
          (co) =>
            co.name.toLowerCase().includes(q) ||
            co.email.toLowerCase().includes(q)
        )
    );
  }, [data?.raw, search]);

  // Pagination على مستوى العملاء
  const pagedClients = clients.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSearch = (v: string) => {
    setSearch(v);
    setCurrentPage(1);
  };

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="table" skeletonRows={PAGE_SIZE}>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-6">
        <PageCard>
          {/* Search */}
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={handleSearch}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          {/* Main table header */}
          <div
            className="grid gap-4 px-4 py-3"
            style={{
              gridTemplateColumns: "2fr 6fr 80px",
              borderBottom: "1px solid var(--color-border-form)",
              background: "var(--color-bg)",
            }}
          >
            {["Client Name", "Companies", ""].map((h, i) => (
              <Text
                key={i}
                size="sm"
                color="gray-200"
                tag="p"
                className="text-[11px] font-medium uppercase tracking-wide"
              >
                {h}
              </Text>
            ))}
          </div>

          {/* Body */}
          <PageCardBody className="!px-0 !py-0">
            {pagedClients.length === 0 ? (
              <div className="py-16 text-center">
                <Text size="sm" color="gray-200" tag="p">{t("noRequests")}</Text>
              </div>
            ) : (
              pagedClients.map((client, i) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  role={role}
                  onApprove={approve}
                  onReject={reject}
                  isLast={i === pagedClients.length - 1}
                />
              ))
            )}
          </PageCardBody>

          {/* Pagination — بيستخدم data array كما هو في الـ component */}
          <PageCardFooter>
            <Pagination
              currentPage={currentPage}
              data={clients}
              pageSize={PAGE_SIZE}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </PageCardFooter>
        </PageCard>
      </div>
    </PageContainer>
  );
}