"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDeleteAccount } from "../hooks/useDeleteAccount";

export const DeleteAccountSection = () => {
  const { mutate: deleteAccount, isPending } = useDeleteAccount();
  const [confirmChecked, setConfirmChecked] = useState(false);

  const handleDelete = () => {
    if (confirmChecked) {
      deleteAccount();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-red-100 mt-6">
      <h2 className="text-xl font-bold mb-2">Delete Account</h2>
      <p className="text-sm text-gray-500 mb-6">Permanently remove your account and all associated data.</p>
      
      <div className="bg-red-50 p-4 rounded-md border border-red-100 flex items-start gap-3 mb-6">
        <span className="text-red-500 mt-0.5">⚠️</span>
        <div>
          <h4 className="font-semibold text-red-600">Danger Zone</h4>
          <p className="text-sm text-red-500/80 mt-1">
            Are you sure you want to delete your account? This action cannot be undone. All your projects,
            files, and settings will be permanently erased from our servers immediately.
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
          Confirm deletion
          <p className="text-xs font-normal text-gray-500 mt-1">
            I understand that my data cannot be recovered after this point.
          </p>
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline">
          Cancel
        </Button>
        <Button 
          disabled={!confirmChecked || isPending} 
          onClick={handleDelete}
          className="bg-red-500 hover:bg-red-600 text-white min-w-[100px]"
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
};
