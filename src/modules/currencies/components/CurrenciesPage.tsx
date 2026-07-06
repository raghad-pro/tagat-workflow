"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, Edit2, Trash2, Folder, Clock, CreditCard } from "lucide-react";
import { StatsGrid, StatItem } from "@/components/molecules/Statsgrid";
import { SearchFilterBar } from "@/components/molecules/Searchfilterbar";
import { DataTable, TableColumn, TableAction } from "@/components/molecules/Datatable";
import { PageHeader } from "@/components/molecules/Pageheader";
import { PageContainer } from "@/components/template/PageContainer";
import { PageCard, PageCardSection, PageCardBody, PageCardFooter } from "@/components/molecules/Pagecard";
import { Pagination } from "@/components/molecules/Pagination";
import { DeleteConfirmationModal } from "@/components/molecules/DeleteConfirmationModal";
import { Text } from "@/components/atoms/Text";
import { useActionModals } from "@/hooks/useActionModals";
import { useAuth } from "@/providers/AuthProvider";

import { useCurrencies } from "../hooks/useCurrencies";
import { useCreateCurrency } from "../hooks/useCreateCurrency";
import { useUpdateCurrency } from "../hooks/useUpdateCurrency";
import { useDeleteCurrency } from "../hooks/useDeleteCurrency";
import type { Currency } from "../types/currencies.types";
import { AddCurrencyModal } from "./AddCurrencyModal";
import { EditCurrencyModal } from "./EditCurrencyModal";

const PAGE_SIZE = 10;

function CurrencyAvatar({ name }: { name: string }) {
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-primary)] text-xs font-bold flex-shrink-0 bg-[var(--color-bg-primary-200)] border border-[var(--color-primary-400)]">
      {initials}
    </div>
  );
}

export function CurrenciesPage() {
  const t = useTranslations("currencies");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: currenciesData, isLoading, isFetching } = useCurrencies({
    page: 1,
    per_page: 50,
  });

  const { mutateAsync: createCurrency, isPending: isCreating, error: createError } = useCreateCurrency();
  const { mutateAsync: updateCurrency, isPending: isUpdating, error: updateError } = useUpdateCurrency();
  const { mutateAsync: deleteCurrency, isPending: isDeleting } = useDeleteCurrency();

  const { activeModal, selectedRow, openEdit, openDelete, closeModal } = useActionModals<Currency>();

  const paginatedData = currenciesData;
  const rawCurrencies = Array.isArray(paginatedData?.data) ? paginatedData.data : [];
  
  // Local Search Filtering
  const filteredCurrencies = rawCurrencies.filter((currency: Currency) => {
    if (!search) return true;
    const lowerSearch = search.toLowerCase();
    return (
      currency.name.toLowerCase().includes(lowerSearch) ||
      currency.code.toLowerCase().includes(lowerSearch) ||
      (currency.company?.name || "").toLowerCase().includes(lowerSearch)
    );
  });

  const total = filteredCurrencies.length;
  const currencies = filteredCurrencies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstCurrency = currencies.length > 0 ? currencies[0] : null;

  const activeRegionsCount = new Set(rawCurrencies.filter(c => c.company_id).map(c => c.company_id)).size;

  const stats: StatItem[] = [
    {
      label: t("totalCurrencies"),
      value: total.toString(),
      icon: Folder,
      iconBg: "var(--color-icon-indigo-bg)",
      iconColor: "var(--color-icon-indigo)",
    },
    {
      label: t("activeRegions"),
      value: activeRegionsCount.toString(),
      icon: Clock,
      iconBg: "var(--color-icon-warning-bg)",
      iconColor: "var(--color-icon-warning)",
    },
    {
      label: t("primaryCurrency"),
      value: firstCurrency ? firstCurrency.code : "-",
      icon: CreditCard,
      iconBg: "var(--color-icon-success-bg)",
      iconColor: "var(--color-icon-success)",
    },
  ];

  const columns = useMemo<TableColumn<Currency>[]>(() => {
    const cols: TableColumn<Currency>[] = [
      {
        key: "name",
        header: t("name"),
        isPrimary: true,
        render: (row) => (
          <div className="flex items-center gap-3">
            <CurrencyAvatar name={row.name} />
            <Text size="sm" weight="bold" tag="p" className="truncate">
              {row.name}
            </Text>
          </div>
        ),
      },
    ];

    if (isSuperAdmin) {
      cols.push({
        key: "company",
        header: t("company"),
        render: (row) => (
          <Text size="sm" tag="p">
            {row.company?.name || "-"}
          </Text>
        ),
      });
    }

    cols.push(
      {
        key: "symbol",
        header: t("symbol"),
        render: (row) => (
          <Text size="sm" color="gray-200" tag="p">
            {row.symbol}
          </Text>
        ),
      },
      {
        key: "code",
        header: t("code"),
        render: (row) => (
          <Text size="sm" color="gray-200" tag="p">
            {row.code}
          </Text>
        ),
      }
    );

    return cols;
  }, [t, isSuperAdmin]);

  const actions = useMemo<TableAction<Currency>[]>(() => [
    {
      key: "edit",
      icon:Edit2,
      label: t("editCurrency"),
      colorScheme: "edit",
      onClick: (row) => openEdit(row),
    },
    {
      key: "delete",
      icon:Trash2 ,
      label: tCommon("delete"),
      colorScheme: "delete",
      onClick: (row) => openDelete(row),
    },
  ], [t, tCommon, openEdit, openDelete]);

  const handleAdd = async (data: any) => {
    await createCurrency(data);
    setIsAddModalOpen(false);
  };

  const handleEdit = async (data: any) => {
    if (selectedRow) {
      await updateCurrency({ id: selectedRow.id, data });
      closeModal();
    }
  };

  const handleDelete = async () => {
    if (selectedRow) {
      await deleteCurrency(selectedRow.id);
      closeModal();
    }
  };

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="table" skeletonRows={PAGE_SIZE}>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={[
          {
            label: t("addCurrency"),
            onClick: () => setIsAddModalOpen(true),
            icon: Plus,
          }
        ]}
      />

      <div className="mt-6">
        <StatsGrid stats={stats} />
      </div>

      <div className="mt-6">
        <PageCard>
          <PageCardSection>
            <SearchFilterBar
              search={search}
              onSearchChange={(val) => { setSearch(val); setPage(1); }}
              searchPlaceholder={t("searchPlaceholder")}
            />
          </PageCardSection>

          <PageCardBody className="!p-0">
            <DataTable
              columns={columns}
              data={currencies}
              actions={actions}
              isLoading={isFetching}
              emptyMessage={t("noCurrencies")}
            />
          </PageCardBody>

          {total > PAGE_SIZE && (
            <PageCardFooter>
              <Pagination
                currentPage={page}
                data={Array(total).fill(0)}
                pageSize={PAGE_SIZE}
                onPageChange={(p) => setPage(p)}
              />
            </PageCardFooter>
          )}
        </PageCard>
      </div>

      <AddCurrencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAdd}
        isLoading={isCreating}
        serverError={createError?.response?.data?.errors}
      />

      <EditCurrencyModal
        isOpen={activeModal === "edit"}
        onClose={closeModal}
        onSave={handleEdit}
        isLoading={isUpdating}
        serverError={updateError?.response?.data?.errors}
        initialData={selectedRow}
      />

      <DeleteConfirmationModal
        isOpen={activeModal === "delete"}
        onClose={closeModal}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={t("deleteTitle")}
        message={t("confirmDelete")}
      />
    </PageContainer>
  );
}
