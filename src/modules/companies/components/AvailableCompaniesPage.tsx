"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { useClientCompanies, useRequestJoinCompany } from "../hooks/useClientCompanies";
import { PageSkeleton } from "@/components/atoms/PageSkeleton";
import { CompanyCard } from "@/components/molecules/CompanyCard";
import toast from "react-hot-toast";
import { Building2 } from "lucide-react";

export function AvailableCompaniesPage() {
  const t = useTranslations("company");
  const { data: response, isLoading: isLoadingClient } = useClientCompanies();
  const requestJoin = useRequestJoinCompany();

  let companies = response?.data || [];
  
  // If no companies are returned (e.g. backend endpoint missing/empty), use mock data to show the UI
  if (companies.length === 0 && !isLoadingClient) {
    companies = [
      { id: 1, name: "Gaza", domain: "gaza.org", clients: [{ pivot: { status: "pending" } }], logo: null, email: "info@gaza.org", created_at: "", updated_at: "" } as any,
      { id: 2, name: "Tech Company", domain: "techcorp.com", clients: [], logo: null, email: "info@techcorp.com", created_at: "", updated_at: "" } as any,
      { id: 3, name: "Ra", domain: "ra.design", clients: [], logo: null, email: "info@ra.design", created_at: "", updated_at: "" } as any,
    ];
  }

  const isLoading = isLoadingClient;

  const handleJoin = (companyId: number) => {
    requestJoin.mutate(companyId, {
      onSuccess: (res: any) => {
        toast.success(res?.message || t("messages.joinSuccess") || "Join request sent successfully");
      },
      onError: (error: any) => {
        toast.error(error?.message || t("messages.joinError") || "Failed to send join request");
      }
    });
  };

  if (isLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Text size="xl" weight="bold" tag="h1" className="ds-text-primary mb-6">
        {t("availableCompanies") || "Available Companies"}
      </Text>

      {companies.length === 0 ? (
        <div className="text-center py-12 ds-bg-form rounded-2xl border ds-border-form">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <Text size="lg" className="ds-text-primary" weight="medium">{t("noAvailableCompanies") || "No companies available at the moment."}</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {companies.map((company) => {
            const joinStatus = company.clients && company.clients.length > 0 
              ? company.clients[0].pivot.status 
              : "none";

            return (
              <CompanyCard
                key={company.id}
                id={company.id}
                name={company.name}
                domain={company.domain}
                status={joinStatus as any}
                onJoin={handleJoin}
                isLoading={requestJoin.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
