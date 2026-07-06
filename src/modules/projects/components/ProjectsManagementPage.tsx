// "use client";

// import React, { useState, useMemo } from "react";
// import { useTranslations } from "next-intl";
// import { Plus, Eye, Edit2, Trash2, Folder, Clock, CheckSquare } from "lucide-react";
// import { PageHeader } from "@/components/molecules/Pageheader";
// import { StatsGrid } from "@/components/molecules/Statsgrid";
// import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
// import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
// import { Pagination } from "@/components/molecules/Pagination";
// import { Text } from "@/components/atoms/Text";
// import { StatusBadge } from "@/components/atoms/Statusbadge";
// import toast from "react-hot-toast";
// import {
//   useProjects,
//   useProjectStats,
//   useCreateProject,
//   useUpdateProject,
//   useDeleteProject,
// } from "../hooks/useProjects";
// import { useEmployees } from "@/modules/employees/hooks/useEmployees";
// import { useQueryClient } from "@tanstack/react-query";
// import { DUMMY_STATS } from "../data/mockData";
// import { Project } from "../types/projects.types";
// import { useActionModals } from "@/hooks/useActionModals";
// import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
// import { ViewProjectModal } from "./ViewProjectModal";
// import EditProjectModal from "./EditProjectModal";
// import AddProjectModal from "./AddProjectModal";
// import { useAuth } from "@/providers/AuthProvider";

// const PAGE_SIZE = 4;

// export function ProjectsManagementPage() {
//   const t = useTranslations("project");
//   const tCommon = useTranslations("common");

//   const { user } = useAuth();
//   const isCompanyAdmin = user?.role === "company";

//   const { data: employeesResponse } = useEmployees({ page: 1, per_page: 100 });
//   const employeesList = employeesResponse?.data?.data || employeesResponse?.data || [];

//   const columns: TableColumn<Project>[] = useMemo(() => {
//     const cols: TableColumn<Project>[] = [
//       {
//         key: "title",
//         header: t("columns.title"),
//         isPrimary: true,
//         render: (row) => <Text size="sm" weight="medium">{row.title}</Text>,
//       },
//       {
//         key: "client",
//         header: t("columns.client"),
//         hideOnMobile: true,
//         render: (row) => {
//           const clientName = typeof row.client === 'object' ? (row.client as any)?.name : row.client;
//           return <Text size="sm" color="gray-200">{clientName || "-"}</Text>;
//         },
//       },
//       {
//         key: "budget",
//         header: t("columns.budget"),
//         render: (row) => <Text size="sm" color="gray-200">{row.budget}</Text>,
//       },
//       {
//         key: "employees",
//         header: t("columns.employees"),
//         render: (row: any) => {
//           let empList = "-";
          
//           // Helper to resolve single employee ID or object
//           const resolveEmp = (e: any) => {
//             if (typeof e === "object") {
//               const name = e.name || e.employee_name || e.user?.name || (e.user?.first_name ? `${e.user.first_name} ${e.user.last_name || ""}`.trim() : null) || e.employeeName;
//               if (name) return name;
//             }
//             const rawId = typeof e === "object" ? String(e.id || e.user_id || "") : String(e);
//             const found = employeesList.find((emp: any) => emp.id?.toString() === rawId || emp.user_id?.toString() === rawId);
//             return found?.name || found?.employee_name || found?.user?.name || rawId || "Unknown";
//           };

//           if (Array.isArray(row.employees) && row.employees.length > 0) {
//             empList = row.employees.map(resolveEmp).join(", ");
//           } else if (Array.isArray(row.users) && row.users.length > 0) {
//             empList = row.users.map(resolveEmp).join(", ");
//           } else if (typeof row.employees === "string" && row.employees.trim() !== "") {
//             // Attempt to resolve string if it's an ID
//             empList = resolveEmp(row.employees);
//           } else if (typeof row.employees === "number") {
//             empList = resolveEmp(row.employees);
//           }
//           return <Text size="sm" color="gray-200">{empList}</Text>;
//         },
//       },
//       {
//         key: "status",
//         header: t("columns.status"),
//         render: (row) => <StatusBadge status={row.status} withDot />,
//       },
//     ];

//     if (!isCompanyAdmin) {
//       cols.splice(1, 0, {
//         key: "company",
//         header: t("columns.company"),
//         render: (row) => {
//           const companyName = typeof row.company === 'object' ? (row.company as any)?.name : row.company;
//           return <Text size="sm" weight="bold">{companyName || "-"}</Text>;
//         },
//       });
//     }

//     return cols;
//   }, [t, isCompanyAdmin, employeesList]);

//   const [search, setSearch]       = useState("");
//   const [currentPage, setPage]    = useState(1);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } = useActionModals<Project>();
//   const createProjectMutation = useCreateProject();
//   const updateProjectMutation = useUpdateProject();
//   const deleteProjectMutation = useDeleteProject();

//   const actions: TableAction<Project>[] = useMemo(() => [
//     { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView },
//     { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit },
//     { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
//   ], [tCommon, openView, openEdit, openDelete]);

//   const queryClient = useQueryClient();
//   const { data: res, isLoading }  = useProjects({ search, page: currentPage, per_page: PAGE_SIZE });
//   const { data: statsData }       = useProjectStats();
//   const stats                     = statsData || DUMMY_STATS;

//   const statItems = [
//     {
//       icon: CheckSquare,
//       value: stats.completed.value,
//       label: t("stats.completed"),
//       iconColor: "#4CAF50",
//       iconBg:    "#EDF7EE",
//     },
//     {
//       icon: Folder,
//       value: stats.totalProjects.value,
//       label: t("stats.active"),
//       iconColor: "#25C6DA",
//       iconBg:    "#E9F9FB",
//     },
//     {
//       icon: Clock,
//       value: stats.inProgress.value,
//       label: t("stats.delayed"),
//       iconColor: "#E8D636",
//       iconBg:    "#FFFDEB",
//     },
//   ];

//   return (
//     <div className="p-0 sm:p-4">
//       <PageHeader
//         title={t("title")}
//         subtitle={t("subtitle")}
//         actions={[{
//           label: t("add"),
//           icon: Plus,
//           onClick: () => setIsModalOpen(true),
//           variant: "solid",
//         }]}
//       />

//       <StatsGrid stats={statItems} cols={3} />

//       <div className="rounded-2xl ds-bg-form flex flex-col" style={{ boxShadow: "var(--shadow-sm)" }}>
//         <div className="p-4 sm:p-6 border-b" style={{ borderColor: "var(--color-border-form)" }}>
//           <SearchFilterBar
//             search={search}
//             onSearchChange={(v) => { setSearch(v); setPage(1); }}
//             searchPlaceholder={t("searchPlaceholder")}
//           />
//         </div>

//         <DataTable
//           columns={columns}
//           data={res?.data ?? []}
//           actions={actions}
//           actionsHeader={tCommon("actions")}
//           isLoading={isLoading}
//         />

//         <div className="p-4 border-t flex justify-end" style={{ borderColor: "var(--color-border-form)" }}>
//           <Pagination
//             currentPage={currentPage}
//             data={Array(res?.total ?? 0).fill(0)}
//             pageSize={PAGE_SIZE}
//             onPageChange={setPage}
//           />
//         </div>
//       </div>

//       <AddProjectModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         isLoading={createProjectMutation.isPending}
//         onSubmit={(v, setError) => { 
//           const payload = { ...v } as any;
//           if (payload.company) {
//             payload.company_id = payload.company;
//             delete payload.company;
//           }
//           if (payload.currency) {
//             payload.currency_id = payload.currency;
//             delete payload.currency;
//           }
//           if (payload.employees) {
//             payload.employees = Array.isArray(payload.employees) 
//               ? payload.employees.map((id: any) => parseInt(id, 10))
//               : [parseInt(payload.employees, 10)];
//           }
//           createProjectMutation.mutate(payload, {
//             onSuccess: () => setIsModalOpen(false),
//             onError: (err: any) => {
//               const message = err?.response?.data?.message || "حدث خطأ غير متوقع";
//               toast.error(message);
//               const errors = err?.response?.data?.errors as Record<string, string[]> | undefined;
//               if (errors) {
//                 Object.entries(errors).forEach(([key, val]) => {
//                   setError(key, { type: "server", message: val[0] });
//                 });
//               }
//             }
//           });
//         }}
//       />

//       <DeleteConfirmationModal
//         isOpen={activeModal === "delete"}
//         onClose={closeModal}
//         title={tCommon("delete") || "Delete Project"}
//         itemName={selectedRow?.title}
//         isLoading={deleteProjectMutation.isPending}
//         onConfirm={() => {
//           if (selectedRow?.id) {
//             deleteProjectMutation.mutate(selectedRow.id, {
//               onSuccess: () => closeModal(),
//             });
//           }
//         }}
//       />

//       <ViewProjectModal
//         isOpen={activeModal === "view"}
//         onClose={closeModal}
//         data={selectedRow}
//       />

//       <EditProjectModal
//         isOpen={activeModal === "edit"}
//         onClose={closeModal}
//         data={selectedRow}
//         isLoading={updateProjectMutation.isPending}
//         onUpdate={(id: number | string, data: any, setError: any) => { 
//           const payload = { ...data };
//           if (payload.company) {
//             payload.company_id = payload.company;
//             delete payload.company;
//           }
//           if (payload.currency) {
//             payload.currency_id = payload.currency;
//             delete payload.currency;
//           }
//           if (payload.employees) {
//             payload.employees = Array.isArray(payload.employees) 
//               ? payload.employees.map((id: any) => parseInt(id, 10))
//               : [parseInt(payload.employees, 10)];
//           }
//           updateProjectMutation.mutate({ id, data: payload }, {
//             onSuccess: () => closeModal(),
//             onError: (err: any) => {
//               const message = err?.response?.data?.message || "حدث خطأ غير متوقع";
//               toast.error(message);
//               const errors = err?.response?.data?.errors as Record<string, string[]> | undefined;
//               if (errors) {
//                 Object.entries(errors).forEach(([key, val]) => {
//                   setError(key, { type: "server", message: val[0] });
//                 });
//               }
//             }
//           });
//         }}
//       />
//     </div>
//   );
// }
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Eye, Edit2, Trash2, Folder, Clock, CheckSquare } from "lucide-react";
import { PageHeader } from "@/components/molecules/Pageheader";
import { StatsGrid } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { Pagination } from "@/components/molecules/Pagination";
import { Text } from "@/components/atoms/Text";
import { StatusBadge } from "@/components/atoms/Statusbadge";
import toast from "react-hot-toast";
import {
  useProjects,
  useProjectStats,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from "../hooks/useProjects";
import { useQueryClient } from "@tanstack/react-query";
import { DUMMY_STATS } from "../data/mockData";
import { Project } from "../types/projects.types";
import { useActionModals } from "@/hooks/useActionModals";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { ViewProjectModal } from "./ViewProjectModal";
import EditProjectModal from "./EditProjectModal";
import AddProjectModal from "./AddProjectModal";
import { useAuth } from "@/providers/AuthProvider";

const PAGE_SIZE = 4;

// ─── Payload builder ─────────────────────────────────────────────────────────

export function buildProjectPayload(values: Record<string, any>) {
  const payload = { ...values };

  if (payload.company) {
    payload.company_id = parseInt(payload.company, 10);
    delete payload.company;
  }
  if (payload.currency) {
    payload.currency_id = parseInt(payload.currency, 10);
    delete payload.currency;
  }
  if (payload.client_id) {
    payload.client_id = parseInt(payload.client_id, 10);
  }
  if (payload.budget) {
    payload.budget = parseFloat(payload.budget);
  }
  if (payload.notes !== undefined) {
    payload.description = payload.notes;
    delete payload.notes;
  }
  if (payload.employees) {
    payload.employees = Array.isArray(payload.employees)
      ? payload.employees.map((id: any) => parseInt(id, 10))
      : [parseInt(payload.employees, 10)];
  }

  return payload;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectsManagementPage() {
  const t       = useTranslations("project");
  const tCommon = useTranslations("common");

  const { user }       = useAuth();
  const isCompanyAdmin = user?.role === "company";
  const isEmployee     = user?.role === "employee";
  const isClient       = user?.role === "client";

  const columns: TableColumn<Project>[] = useMemo(() => {
    const cols: TableColumn<Project>[] = [
      {
        key: "title",
        header: t("columns.title"),
        isPrimary: true,
        render: (row) => (
          <Text size="sm" weight="medium">
            {row.title ?? (row as any).name}
          </Text>
        ),
      },
      {
        key: "client",
        header: t("columns.client"),
        hideOnMobile: true,
        render: (row) => {
          const clientName =
            typeof row.client === "object"
              ? (row.client as any)?.name
              : row.client;
          return <Text size="sm" color="gray-200">{clientName || "-"}</Text>;
        },
      },
      {
        key: "budget",
        header: t("columns.budget"),
        render: (row) => <Text size="sm" color="gray-200">{row.budget}</Text>,
      },
      {
        key: "employees",
        header: t("columns.employees"),
        render: (row: any) => {
          const resolveEmp = (e: any) => {
            if (typeof e === "object") {
              return (
                e.name ??
                e.employee_name ??
                e.user?.name ??
                (e.user?.first_name
                  ? `${e.user.first_name} ${e.user.last_name ?? ""}`.trim()
                  : null) ??
                e.employeeName ??
                String(e.id ?? "")
              );
            }
            return String(e);
          };

          let empList = "-";
          if (Array.isArray(row.employees) && row.employees.length > 0) {
            empList = row.employees.map(resolveEmp).join(", ");
          } else if (Array.isArray(row.users) && row.users.length > 0) {
            empList = row.users.map(resolveEmp).join(", ");
          } else if (
            typeof row.employees === "string" &&
            row.employees.trim() !== ""
          ) {
            empList = row.employees;
          } else if (typeof row.employees === "number") {
            empList = String(row.employees);
          }

          return <Text size="sm" color="gray-200">{empList}</Text>;
        },
      },
      {
        key: "status",
        header: t("columns.status"),
        render: (row) => <StatusBadge status={row.status} withDot />,
      },
    ];

    if (!isCompanyAdmin) {
      cols.splice(1, 0, {
        key: "company",
        header: t("columns.company"),
        render: (row) => {
          const companyName =
            typeof row.company === "object"
              ? (row.company as any)?.name
              : row.company;
          return <Text size="sm" weight="bold">{companyName || "-"}</Text>;
        },
      });
    }

    if (isClient) {
      return cols.filter((c) => c.key !== "budget" && c.key !== "client" && c.key !== "employees");
    }

    return cols;
  }, [t, isCompanyAdmin, isClient]);

  const [search, setSearch]           = useState("");
  const [currentPage, setPage]        = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setIsModalOpen(true);
      router.replace("/projects");
    }
  }, [searchParams, router]);

  const { activeModal, selectedRow, openView, openEdit, openDelete, closeModal } =
    useActionModals<Project>();

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const actions: TableAction<Project>[] = useMemo(
    () => {
      return [
        { icon: Eye,    label: tCommon("view"),   colorScheme: "send",   onClick: openView   },
        { icon: Edit2,  label: tCommon("edit"),   colorScheme: "edit",   onClick: openEdit   },
        { icon: Trash2, label: tCommon("delete"), colorScheme: "delete", onClick: openDelete },
      ];
    },
    [tCommon, openView, openEdit, openDelete]
  );

  const queryClient               = useQueryClient();
  const { data: res, isLoading }  = useProjects({ search, page: currentPage, per_page: PAGE_SIZE });
  const { data: statsData }       = useProjectStats();
  const stats                     = statsData ?? DUMMY_STATS;

  const statItems = [
    {
      icon:      CheckSquare,
      value:     stats.completed.value,
      label:     t("stats.completed"),
      iconColor: "#4CAF50",
      iconBg:    "#EDF7EE",
    },
    {
      icon:      Folder,
      value:     stats.totalProjects.value,
      label:     t("stats.active"),
      iconColor: "#25C6DA",
      iconBg:    "#E9F9FB",
    },
    {
      icon:      Clock,
      value:     stats.inProgress.value,
      label:     t("stats.delayed"),
      iconColor: "#E8D636",
      iconBg:    "#FFFDEB",
    },
  ];

  return (
    <div className="p-0 sm:p-4">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={isEmployee || isClient ? undefined : [{
          label:   t("add"),
          icon:    Plus,
          onClick: () => setIsModalOpen(true),
          variant: "solid",
        }]}
      />

      {!isClient && <StatsGrid stats={statItems} cols={3} />}

      <div
        className="rounded-2xl ds-bg-form flex flex-col"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        <div
          className="p-4 sm:p-6 border-b"
          style={{ borderColor: "var(--color-border-form)" }}
        >
          <SearchFilterBar
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            searchPlaceholder={t("searchPlaceholder")}
          />
        </div>

        <DataTable
          columns={columns}
          data={res?.data ?? []}
          actions={(!isClient && !isEmployee) ? actions : undefined}
          actionsHeader={(!isClient && !isEmployee) ? tCommon("actions") : undefined}
          isLoading={isLoading}
        />

        <div
          className="p-4 border-t flex justify-end"
          style={{ borderColor: "var(--color-border-form)" }}
        >
          <Pagination
            currentPage={currentPage}
            data={Array(res?.total ?? 0).fill(0)}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* ── Add Modal ───────────────────────────────────────────────────── */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={createProjectMutation.isPending}
        onSubmit={(v, setError) => {
          const payload = buildProjectPayload(v as any);
          createProjectMutation.mutate(payload, {
            onSuccess: () => setIsModalOpen(false),
            onError: (err: any) => {
              const message =
                err?.response?.data?.message || "حدث خطأ غير متوقع";
              toast.error(message);
              const errors = err?.response?.data?.errors as
                | Record<string, string[]>
                | undefined;
              if (errors) {
                Object.entries(errors).forEach(([key, val]) => {
                  setError(key, { type: "server", message: val[0] });
                });
              }
            },
          });
        }}
      />

      {/* ── Delete Modal ─────────────────────────────────────────────────── */}
      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        title={tCommon("delete") || "Delete Project"}
        itemName={selectedRow?.title ?? (selectedRow as any)?.name}
        isLoading={deleteProjectMutation.isPending}
        onConfirm={() => {
          if (selectedRow?.id) {
            deleteProjectMutation.mutate(selectedRow.id, {
              onSuccess: () => closeModal(),
            });
          }
        }}
      />

      {/* ── View Modal ───────────────────────────────────────────────────── */}
      <ViewProjectModal
        isOpen={activeModal === "view"}
        onClose={closeModal}
        data={selectedRow}
      />

      {/* ── Edit Modal ───────────────────────────────────────────────────── */}
      <EditProjectModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        data={selectedRow}
        isLoading={updateProjectMutation.isPending}
        onUpdate={(id, data, setError) => {
          const payload = buildProjectPayload(data);
          updateProjectMutation.mutate(
            { id, data: payload },
            {
              onSuccess: () => closeModal(),
              onError: (err: any) => {
                const message =
                  err?.response?.data?.message || "حدث خطأ غير متوقع";
                toast.error(message);
                const errors = err?.response?.data?.errors as
                  | Record<string, string[]>
                  | undefined;
                if (errors) {
                  Object.entries(errors).forEach(([key, val]) => {
                    setError(key, { type: "server", message: val[0] });
                  });
                }
              },
            }
          );
        }}
      />
    </div>
  );
}

