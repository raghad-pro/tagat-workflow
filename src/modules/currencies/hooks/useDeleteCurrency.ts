import { useMutation, useQueryClient } from "@tanstack/react-query";
import { currencyApi } from "../api/currencies.api";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useDeleteCurrency = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const t = useTranslations("common");

  return useMutation({
    mutationFn: (id: string | number) => currencyApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currencies"] });
      queryClient.invalidateQueries({ queryKey: ["companyCurrencies"] });
      toast.success(t("deleteSuccess"));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || t("deleteError");
      toast.error(msg);
    },
  });
};
