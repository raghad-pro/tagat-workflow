"use client";

import React, { useState, useMemo } from "react";
import toast from "react-hot-toast"; // ✅ إضافة الـ import
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
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Users } from "@/assets/icons/icons";
import { Eye, Edit2, Trash2 } from "@/assets/icons/icons";
import { Role } from "../types/roles.types";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { ViewRoleModal } from "./ViewRoleModal";
import { Text } from "@/components/atoms/Text";
import { ClientAvatar } from "@/components/atoms/Clientavatar";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";

const PAGE_SIZE = 4;

export default function RolesManagementPage() {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const [search, setSearch]           = useState("");
  const [page, setPage]               = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: statsData }                          = useRoleStats();
  const queryClient                                  = useQueryClient();
  const { data: rolesData, isLoading, isFetching }  = useRoles({ search, page, per_page: PAGE_SIZE });
  const { activeModal, selectedRow, openEdit, openDelete, closeModal } = useActionModals<Role>();

  const deleteRoleMutation = useDeleteRole();
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const rolesDataRaw = rolesData?.data ?? [];
  const total = rolesData?.meta?.total ?? rolesDataRaw.length;

  const roles = useMemo(() => {
    // If the API didn't paginate (returned all items), paginate locally
    if (rolesDataRaw.length > PAGE_SIZE && rolesDataRaw.length === total) {
      const startIndex = (page - 1) * PAGE_SIZE;
      return rolesDataRaw.slice(startIndex, startIndex + PAGE_SIZE);
    }
    return rolesDataRaw;
  }, [rolesDataRaw, page, total]);

  const columns: TableColumn<Role>[] = useMemo(() => [
    {
      key: "name",
      header: t("columns.roleName") || "Role Name",
      isPrimary: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <ClientAvatar name={row.name} size="md" />
          <Text size="sm" weight="medium" tag="span">{row.name}</Text>
        </div>
      ),
    },
  ], [t]);

  const actions: TableAction<Role>[] = useMemo(() => [
    { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit   },
    { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
  ], [tCommon, openEdit, openDelete]);

  const handleAddRole = (data: Partial<Role>) => {
    const tempId = Date.now();

    // Optimistic update
    queryClient.setQueryData(
      ["roles", { search, page, per_page: PAGE_SIZE }],
      (old: any) => {
        if (!old) return old;
        const newRole = {
          id: tempId,
          name: data.name,
          description: data.description,
          usersCount: 0,
          type: "custom",
          createdAt: new Date().toISOString().split("T")[0],
        };
        return { ...old, data: [newRole, ...old.data] };
      }
    );

    setIsModalOpen(false);

    createRoleMutation.mutate(data, {
      onSuccess: (newRoleFromApi: any) => {
        queryClient.setQueryData(
          ["roles", { search, page, per_page: PAGE_SIZE }],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((r: any) =>
                r.id === tempId ? { ...r, ...newRoleFromApi } : r
              ),
            };
          }
        );
        toast.success("Role added successfully");
      },
      onError: (err: any) => {
        // Revert optimistic update
        queryClient.invalidateQueries({ queryKey: ["roles"] });
        toast.error(err?.response?.data?.message || "Failed to save role");
      },
    });
  };

  const handleUpdateRole = (id: number, data: Partial<Role>) => {
    updateRoleMutation.mutate(
      { id, data },
      {
        onSuccess: () => {
          queryClient.setQueryData(
            ["roles", { search, page, per_page: PAGE_SIZE }],
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                data: old.data.map((r: any) =>
                  r.id === id ? { ...r, ...data } : r
                ),
              };
            }
          );
          closeModal();
          toast.success("Role updated successfully");
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to update role");
        },
      }
    );
  };

  const handleDeleteRole = () => {
    if (!selectedRow?.id) return;
    deleteRoleMutation.mutate(selectedRow.id, {
      onSuccess: () => {
        closeModal();
        toast.success("Role deleted successfully");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to delete role");
      },
    });
  };

  return (
    <>
      <PageContainer isLoading={isLoading} skeletonVariant="dashboard" skeletonRows={PAGE_SIZE}>
        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{ label: t("add"), onClick: () => setIsModalOpen(true) }]}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard
            icon={Users}
            value={statsData?.customRoles ?? 0}
            label={t("stats.custom") || "CUSTOM ROLES"}
            iconColor="var(--color-status-pending)"
            iconBg="var(--color-status-pending-bg)"
          />
          <StatCard
            icon={ShieldCheck}
            value={statsData?.total ?? 0}
            label={t("stats.total") || "TOTAL ROLES"}
            iconColor="var(--color-primary)"
            iconBg="var(--color-bg-primary-200)"
          />
          <StatCard
            icon={ShieldCheck}
            value={statsData?.systemRoles ?? 0}
            label={t("stats.system") || "SYSTEM ROLES"}
            iconColor="var(--color-status-active)"
            iconBg="var(--color-status-active-bg)"
          />
        </div>

        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder={t("searchPlaceholder") || "Search roles..."}
            />
          </PageCardSection>

          <PageCardBody>
            <DataTable
              columns={columns}
              data={roles}
              actions={actions}
              actionsHeader="Actions"
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
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Role"}
        itemName={selectedRow?.name}
        isLoading={deleteRoleMutation.isPending}
        onConfirm={handleDeleteRole}
      />

      <ViewRoleModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      <EditRoleModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        onUpdate={handleUpdateRole}
      />
    </>
  );
}