"use client";

import Link from "next/link";
import { Text } from "@/components/atoms/Text";
import { DashboardStatsRow } from "../DashboardStatsRow";
import { CashFlowChart, CashFlowLegend } from "../CashFlowChart";
import { ChurnChart, ChurnLegend } from "../ChurnChart";
import { PackageDistributionCard } from "../PackageDistributionCard";
import { RecentCompaniesList } from "../RecentCompaniesList";
import { RecentRequestsList } from "../RecentRequestsList";
import { DashboardCard, ShowAll } from "../DashboardCard";
import type { DashboardResponse } from "../../types/dashboard.types";

interface Props {
  data: DashboardResponse;
}

export function SuperAdminDashboard({ data }: Props) {
  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Text size="xl" weight="bold" tag="h1">Dashboard</Text>
          <Text size="sm" color="gray-200" tag="p" className="mt-0.5">
            Platform performance overview
          </Text>
        </div>
        <div className="flex items-center gap-3">
          <Text size="sm" color="gray-200" tag="span">Last updated: now</Text>
          <Link
            href="/companies/add"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 ds-bg-primary ds-text-button"
          >
            + New Company
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          <DashboardStatsRow stats={data.stats} />

          <DashboardCard title="Monthly Cash Flow" action={<CashFlowLegend />}>
            <CashFlowChart data={data.cashFlow} />
          </DashboardCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard title="Subscriber Growth vs Churn Rate" action={<ChurnLegend />}>
              <ChurnChart data={data.churn} />
            </DashboardCard>

            <DashboardCard title="Package Distribution">
              <PackageDistributionCard data={data.packageDistribution} />
            </DashboardCard>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <DashboardCard
            title="Latest Registered Companies"
            action={<ShowAll href="/companies" />}
          >
            <RecentCompaniesList companies={data.recentCompanies} />
          </DashboardCard>

          <DashboardCard
            title="Latest Subscriber Requests"
            action={<ShowAll href="/company-requests" />}
          >
            <RecentRequestsList requests={data.recentRequests} />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}
