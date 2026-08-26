"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

export const DeleteAccountSection = () => {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const { mutate: deleteAccount, isPending } = useDeleteAccount();
  const [confirmChecked, setConfirmChecked] = useState(false);

  const handleDelete = () => {
    if (confirmChecked) {
      deleteAccount();
    }
  };

  return (
    <div className="ds-bg-form p-6 rounded-lg shadow-sm border border-red-100 dark:border-red-500/25 mt-6">
      <h2 className="text-xl font-bold mb-2">{t("deleteAccount")}</h2>
      <p className="text-sm text-gray-500 mb-6">{t("deleteAccountSubtitle")}</p>
      
      <div className="bg-red-50 p-4 rounded-md border border-red-100 flex items-start gap-3 mb-6">
        <span className="text-red-500 mt-0.5">⚠️</span>
        <div>
          <h4 className="font-semibold text-red-600">{t("dangerZone")}</h4>
          <p className="text-sm text-red-500/80 mt-1">
            {t("deleteWarning")}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-8">
        <input 
          type="checkbox" 
          id="confirmDelete" 
          className="rounded border-gray-300 text-teal-500 focus:ring-teal-500 w-4 h-4"
          checked={confirmChecked}
          onChange={(e) => setConfirmChecked(e.target.checked)}
        />
        <label
          htmlFor="confirmDelete"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {t("confirmDeletion")}
          <p className="text-xs font-normal text-gray-500 mt-1">
            {t("deletionUnderstood")}
          </p>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline">{tc("cancel")}</Button>
        <Button 
          disabled={!confirmChecked || isPending} 
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white min-w-[100px]"
        >
          {isPending ? tc("deleting") : tc("delete")}
        </Button>
      </div>
    </div>
  );
};
