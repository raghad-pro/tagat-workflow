"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
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
import {
  useRoles,
  useRoleStats,
  useDeleteRole,
  useCreateRole,
  useUpdateRole,
} from "../hooks/useRoles";
import { ShieldCheck, Users } from "@/assets/icons/icons";
import { Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { isBaseRole, type Role, type RolePayload } from "../types/roles.types";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { ViewRoleModal, permissionSummary } from "./ViewRoleModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";

const PAGE_SIZE = 8;

export default function RolesManagementPage() {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const { user } = useAuth();
  const { can } = usePermission();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: statsData } = useRoleStats();
  const { data: rolesData, isLoading, isFetching } = useRoles({
    search,
    page,
    per_page: PAGE_SIZE,
  });
  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } =
    useActionModals<Role>();

  const deleteRoleMutation = useDeleteRole();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const rows = rolesData?.data ?? [];
  const total = rolesData?.meta?.total ?? rows.length;

  const columns: TableColumn<Role>[] = useMemo(() => {
    const base: TableColumn<Role>[] = [
      {
        key: "name",
        header: t("columns.roleName"),
        isPrimary: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <ClientAvatar name={row.name} size="md" />
            <div className="flex flex-col">
              <Text size="sm" weight="medium" tag="span">{row.name}</Text>
              {isBaseRole(row.id) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded w-fit bg-primary/10 text-[var(--color-primary)]">
                  {t("types.system")}
                </span>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "permissions",
        header: t("columns.permissions"),
        hideOnMobile: true,
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full ds-bg-primary-200 ds-text-brand shrink-0">
              {row.permissions?.length ?? 0}
            </span>
            <Text size="sm" tag="span" className="ds-text-gray-200 capitalize">
              {permissionSummary(row)}
            </Text>
          </div>
        ),
      },
    ];

    if (isSuperAdmin) {
      base.push({
        key: "company",
        header: t("columns.company"),
        hideOnMobile: true,
        render: (row) => (
          <Text size="sm" tag="span">{row.company?.name ?? t("allCompanies")}</Text>
        ),
      });
    }

    return base;
  }, [t, isSuperAdmin]);

  const actions: TableAction<Role>[] = useMemo(
    () => [
      { icon: Eye, label: tCommon("view"), colorScheme: "send", onClick: openView },
      {
        icon: Edit2,
        label: tCommon("edit"),
        colorScheme: "edit",
        onClick: openEdit,
        // Base roles are shared across every account — editing one would
        // change what `employee` means for everybody.
        disabled: (row) => isBaseRole(row.id),
        hidden: () => !can("roles.update"),
      },
      {
        icon: Trash2,
        label: tCommon("delete"),
        colorScheme: "delete",
        onClick: openDelete,
        hidden: (row) => isBaseRole(row.id) || !can("roles.delete"),
      },
    ],
    [tCommon, openView, openEdit, openDelete, can]
  );

  const handleAddRole = (payload: RolePayload) => {
    createRoleMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(t("toast.created"));
        setIsModalOpen(false);
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || t("toast.createFailed"));
      },
    });
  };

  const handleUpdateRole = (id: number, payload: RolePayload) => {
    updateRoleMutation.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          toast.success(t("toast.updated"));
          closeModal();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || t("toast.updateFailed"));
        },
      }
    );
  };

  const handleDeleteRole = () => {
    if (!selectedRow?.id) return;
    deleteRoleMutation.mutate(selectedRow.id, {
      onSuccess: () => {
        toast.success(t("toast.deleted"));
        closeModal();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || err?.message || t("toast.deleteFailed"));
      },
    });
  };

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={
            can("roles.create")
              ? [{ label: t("add"), onClick: () => setIsModalOpen(true) }]
              : []
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={Users}
            value={statsData?.customRoles ?? 0}
            label={t("stats.custom")}
            iconColor="var(--color-status-pending)"
            iconBg="var(--color-status-pending-bg)"
          />
          <StatCard
            icon={ShieldCheck}
            value={statsData?.total ?? 0}
            label={t("stats.total")}
            iconColor="var(--color-primary)"
            iconBg="var(--color-bg-primary-200)"
          />
          <StatCard
            icon={ShieldCheck}
            value={statsData?.systemRoles ?? 0}
            label={t("stats.system")}
            iconColor="var(--color-status-active)"
            iconBg="var(--color-status-active-bg)"
          />
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={rows}
              actions={actions}
              actionsHeader={tCommon("actions")}
              isLoading={isFetching}
            />
          </PageCardBody>

          <PageCardFooter>
            <Pagination
              currentPage={page}
              data={Array(total).fill(0)}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </PageCardFooter>
        </PageCard>
      </PageContainer>

      <AddRoleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddRole}
        isSubmitting={createRoleMutation.isPending}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={t("deleteRole")}
        itemName={selectedRow?.name}
        isLoading={deleteRoleMutation.isPending}
        onConfirm={handleDeleteRole}
      />

      <ViewRoleModal isOpen={activeModal === "view"} onClose={closeModal} data={selectedRow} />

      <EditRoleModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={handleUpdateRole}
        isSubmitting={updateRoleMutation.isPending}
      />
    </>
  );
}
