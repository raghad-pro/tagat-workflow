import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currencyApi } from "../api/currencies.api";
import { useAuth } from "@/providers/AuthProvider";
import type { CurrencyRequest } from "../types/currencies.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useUpdateCurrency = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const t = useTranslations("common");

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: CurrencyRequest }) =>
      currencyApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      queryClient.invalidateQueries({ queryKey: ["companyCurrencies"] });
      toast.success(t("updateSuccess"));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || t("updateError");
      toast.error(msg);
    },
  });
};
