"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { Pagination } from "@/components/molecules/Pagination";
import {
  PageCard,
  PageCardSection,
  PageCardBody,
  PageCardFooter,
} from "@/components/molecules/Pagecard";
import {
  useRoles,
  useDeleteRole,
  useCreateRole,
  useUpdateRole,
} from "../hooks/useRoles";
import { isBaseRole, type Role, type RolePayload } from "../types/roles.types";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";
import { ViewRoleModal } from "./ViewRoleModal";
import { RoleCard } from "./RoleCard";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { usePermission } from "@/hooks/usePermission";

const PAGE_SIZE = 8;

export default function RolesManagementPage() {
  const t = useTranslations("role");
  const tCommon = useTranslations("common");

  const { can } = usePermission();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
            {isFetching ? (
              <div className="flex justify-center items-center p-8">
                <span className="text-gray-500">{tCommon("loading")}...</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex justify-center items-center p-8">
                <span className="text-gray-500">{tCommon("noData")}</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                {rows.map((role) => (
                  <RoleCard
                    key={role.id}
                    role={role}
                    onEdit={() => {
                      if (!isBaseRole(role.id) && can("roles.update")) {
                        openEdit(role);
                      }
                    }}
                    onDelete={() => {
                      if (!isBaseRole(role.id) && can("roles.delete")) {
                        openDelete(role);
                      }
                    }}
                    onView={() => openView(role)}
                    canEdit={can("roles.update")}
                    canDelete={can("roles.delete")}
                  />
                ))}
              </div>
            )}
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
