"use client";

import React from "react";
import { PaymentsManagementPage } from "./PaymentsManagementPage";
import { useAuth } from "@/providers/AuthProvider";

export function PaymentsWrapper() {
  const { user } = useAuth();

  if (!user || !["super_admin", "company", "client"].includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <PaymentsManagementPage />;
}
