"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatCard } from "@/components/atoms/Statcard";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import { useAuth } from "@/providers/AuthProvider";
import { useCompanies } from "@/modules/companies/hooks/useCompanies";
import { getEmployeeStatus } from "@/modules/employees/types/employees.types";
import AssignRoleModal from "./AssignRoleModal";
import {
  getBaseRole,
  getExtraRole,
  useAllEmployees,
  useAssignRole,
  useBulkAssignRole,
} from "../hooks/useAccess";

const PAGE_SIZE = 8;
const ALL = "all";

export default function AccessManagementPage() {
  const t = useTranslations("access");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState(ALL);
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<(number | string)[]>([]);
  const [assigning, setAssigning] = useState<any[] | null>(null);

  /**
   * Everything is fetched once and filtered client-side. The list endpoint has
   * no role filter, and filtering a server-paginated slice would show the
   * wrong counts — this screen exists to see who has what.
   */
  const { data: employees, isLoading, isFetching } = useAllEmployees();
  const { data: companiesData } = useCompanies({ per_page: 100 });

  const assignRole = useAssignRole();
  const bulkAssignRole = useBulkAssignRole();

  const companies: any[] = Array.isArray(companiesData?.data?.data)
    ? companiesData.data.data
    : Array.isArray(companiesData?.data)
      ? companiesData.data
      : [];

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (companyFilter !== ALL && String(employee?.company_id ?? "") !== companyFilter) {
        return false;
      }

      const extra = getExtraRole(employee);
      if (roleFilter === "with" && !extra) return false;
      if (roleFilter === "without" && extra) return false;

      if (!needle) return true;
      const haystack = [
        employee?.user?.name,
        employee?.user?.email,
        employee?.job_title,
        extra?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [employees, search, companyFilter, roleFilter]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const selectedEmployees = useMemo(
    () => employees.filter((e) => selectedIds.some((id) => String(id) === String(e.id))),
    [employees, selectedIds]
  );

  /**
   * Roles belong to one company, and the assignment endpoint does not check
   * that — it will happily attach company A's role to company B's employee.
   * Restricting bulk to a single company is what keeps that from happening.
   */
  const selectedCompanyIds = useMemo(
    () => Array.from(new Set(selectedEmployees.map((e) => String(e?.company_id ?? "")))),
    [selectedEmployees]
  );
  const bulkBlocked = selectedCompanyIds.length > 1;

  const withRole = employees.filter((e) => getExtraRole(e)).length;

  const resetFilters = (fn: () => void) => {
    fn();
    setPage(1);
    setSelectedIds([]);
  };

  const columns: TableColumn<any>[] = useMemo(() => {
    const cols: TableColumn<any>[] = [
      {
        key: "employee",
        header: t("columns.employee"),
        isPrimary: true,
        render: (row) => {
          const isActive = getEmployeeStatus(row) === "active";
          return (
            <div className={`flex items-center gap-3 ${!isActive ? "opacity-50 grayscale" : ""}`}>
              <ClientAvatar name={row?.user?.name ?? "?"} size="md" />
              <div className="flex flex-col min-w-0">
                <Text size="sm" weight="medium" tag="span">{row?.user?.name ?? "—"}</Text>
                <Text size="sm" className="ds-text-gray-200 truncate">
                  {row?.job_title || row?.user?.email || ""}
                </Text>
              </div>
            </div>
          );
        },
      },
      {
        key: "baseRole",
        header: t("columns.baseRole"),
        hideOnMobile: true,
        render: (row) => {
          const isActive = getEmployeeStatus(row) === "active";
          return (
            <div className={!isActive ? "opacity-50 grayscale" : ""}>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-[var(--color-primary)]">
                {getBaseRole(row)?.name ?? "—"}
              </span>
            </div>
          );
        }
      },
      {
        key: "extraRole",
        header: t("columns.extraRole"),
        render: (row) => {
          const isActive = getEmployeeStatus(row) === "active";
          const extra = getExtraRole(row);
          return (
            <div className={!isActive ? "opacity-50 grayscale" : ""}>
              {extra ? (
                <span className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand">
                  {extra.name}
                </span>
              ) : (
                <Text size="sm" className="ds-text-gray-200">{t("noRole")}</Text>
              )}
            </div>
          );
        },
      },
    ];

    if (isSuperAdmin) {
      cols.push({
        key: "company",
        header: t("columns.company"),
        hideOnMobile: true,
        render: (row) => {
          const isActive = getEmployeeStatus(row) === "active";
          return (
            <div className={!isActive ? "opacity-50 grayscale" : ""}>
              <Text size="sm" tag="span">{row?.company?.name ?? "—"}</Text>
            </div>
          );
        },
      });
    }

    return cols;
  }, [t, isSuperAdmin]);

  const actions: TableAction<any>[] = useMemo(
    () => [
      {
        icon: KeyRound,
        label: t("manageAccess"),
        colorScheme: "edit",
        onClick: (row) => setAssigning([row]),
      },
    ],
    [t]
  );

  const handleConfirm = (roleId: number | null) => {
    if (!assigning?.length) return;

    if (assigning.length === 1) {
      assignRole.mutate(
        { employee: assigning[0], roleId },
        {
          onSuccess: () => {
            toast.success(roleId ? t("toast.assigned") : t("toast.cleared"));
            setAssigning(null);
            setSelectedIds([]);
          },
          onError: (err: any) =>
            toast.error(err?.response?.data?.message || err?.message || t("toast.failed")),
        }
      );
      return;
    }

    bulkAssignRole.mutate(
      { employees: assigning, roleId },
      {
        onSuccess: ({ total, failed }) => {
          if (failed.length === 0) {
            toast.success(t("toast.bulkDone", { count: total }));
          } else {
            // Report the real outcome rather than a blanket success or failure.
            toast.error(
              t("toast.bulkPartial", { done: total - failed.length, failed: failed.length })
            );
          }
          setAssigning(null);
          setSelectedIds([]);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.message || err?.message || t("toast.failed")),
      }
    );
  };

  const filters = [
    ...(isSuperAdmin
      ? [
          {
            value: companyFilter,
            onChange: (v: string) => resetFilters(() => setCompanyFilter(v)),
            options: [
              { value: ALL, label: t("filters.allCompanies") },
              ...companies.map((c: any) => ({ value: String(c.id), label: c.name })),
            ],
          },
        ]
      : []),
    {
      value: roleFilter,
      onChange: (v: string) => resetFilters(() => setRoleFilter(v)),
      options: [
        { value: ALL, label: t("filters.allEmployees") },
        { value: "with", label: t("filters.withRole") },
        { value: "without", label: t("filters.withoutRole") },
      ],
    },
  ];

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader title={t("title")} subtitle={t("subtitle")} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={ShieldCheck}
            value={withRole}
            label={t("stats.withRole")}
            iconColor="var(--color-status-active)"
            iconBg="var(--color-status-active-bg)"
          />
          <StatCard
            icon={ShieldOff}
            value={Math.max(employees.length - withRole, 0)}
            label={t("stats.withoutRole")}
            iconColor="var(--color-status-pending)"
            iconBg="var(--color-status-pending-bg)"
          />
          <StatCard
            icon={KeyRound}
            value={employees.length}
            label={t("stats.total")}
            iconColor="var(--color-primary)"
            iconBg="var(--color-bg-primary-200)"
          />
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => resetFilters(() => setSearch(v))}
              filters={filters}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          {/* ── Bulk bar — only once something is picked ────────────────────── */}
          {selectedIds.length > 0 && (
            <PageCardSection>
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl p-3 ds-bg-primary-200">
                <Text size="sm" weight="medium" tag="span">
                  {t("selectedCount", { count: selectedIds.length })}
                </Text>

                <div className="flex items-center gap-2 flex-wrap">
                  {bulkBlocked && (
                    <Text size="sm" className="ds-text-error">{t("bulkBlocked")}</Text>
                  )}
                  <Button
                    variant="solid"
                    size="sm"
                    disabled={bulkBlocked}
                    onClick={() => setAssigning(selectedEmployees)}
                  >
                    {t("assignSelected")}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                    {tCommon("cancel")}
                  </Button>
                </div>
              </div>
            </PageCardSection>
          )}

          <PageCardBody>
            <DataTable
              columns={columns}
              data={pageRows}
              actions={actions}
              actionsHeader={tCommon("actions")}
              isLoading={isFetching && employees.length === 0}
              selection={{ selectedIds, onChange: setSelectedIds }}
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={page}
              data={Array(filtered.length).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </PageCardFooter>
        </PageCard>
      </PageContainer>

      <AssignRoleModal
        isOpen={!!assigning?.length}
        onClose={() => setAssigning(null)}
        employees={assigning ?? []}
        companyId={assigning?.[0]?.company_id ?? user?.company_id ?? null}
        onConfirm={handleConfirm}
        isSubmitting={assignRole.isPending || bulkAssignRole.isPending}
      />
    </>
  );
}
