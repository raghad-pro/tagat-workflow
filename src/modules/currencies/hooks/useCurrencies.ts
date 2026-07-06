import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { currencyApi } from "../api/currencies.api";
import { useAuth } from "@/providers/AuthProvider";

interface UseCurrenciesOptions {
  search?: string;
  page?: number;
  per_page?: number;
}

export const useCurrencies = (options?: UseCurrenciesOptions) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["currencies", role, options?.search, options?.page, options?.per_page],
    queryFn: () => currencyApi.getAll(role, options),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });
};
