"use client";

import Link from "next/link"; 
import { Text } from "@/components/atoms/Text";
import { PageContainer } from "@/components/template/PageContainer";
import { useTranslations } from "next-intl";
import { useDashboard } from "../hooks/useDashboard";
import { DashboardStatsRow } from "./DashboardStatsRow";
import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
import { ChurnChart, ChurnLegend } from "./ChurnChart";
import { PackageDistributionCard } from "./PackageDistributionCard";
import { RecentCompaniesList } from "./RecentCompaniesList";
import { RecentRequestsList } from "./RecentRequestsList";
import { DashboardCard, ShowAll } from "./DashboardCard";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { data, isLoading } = useDashboard();

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Text size="xl" weight="bold" tag="h1">{t("title")}</Text>
            <Text size="sm" color="gray-200" tag="p" className="mt-0.5">
              {t("subtitle")}
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Text size="sm" color="gray-200" tag="span">{t("lastUpdated")}</Text>
            <Link
              href="/companies/add"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ds-bg-primary ds-text-button"
            >
              {t("newCompany")}
            </Link>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {data && <DashboardStatsRow stats={data.stats} />}

            <DashboardCard title={t("monthlyCashFlow")} action={<CashFlowLegend />}>
              {data && <CashFlowChart data={data.cashFlow} />}
            </DashboardCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard title={t("subscriberGrowth")} action={<ChurnLegend />}>
                {data && <ChurnChart data={data.churn} />}
              </DashboardCard>

              <DashboardCard title={t("packageDistribution")}>
                {data && <PackageDistributionCard data={data.packageDistribution} />}
              </DashboardCard>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">
            <DashboardCard
              title={t("recentCompanies")}
              action={<ShowAll href="/companies" />}
            >
              {data && <RecentCompaniesList companies={data.recentCompanies} />}
            </DashboardCard>

            <DashboardCard
              title={t("recentRequests")}
              action={<ShowAll href="/company-requests" />}
            >
              {data && <RecentRequestsList requests={data.recentRequests} />}
            </DashboardCard>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
