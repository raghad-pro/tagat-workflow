// "use client";

// import { useRouter } from "next/navigation";
// import { Text } from "@/components/atoms/Text";
// import { PageContainer } from "@/components/template/PageContainer";
// import { PageHeader } from "@/components/molecules/Pageheader";
// import { useTranslations } from "next-intl";
// import { useDashboard } from "../hooks/useDashboard";
// import { DashboardStatsRow } from "./DashboardStatsRow";
// import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
// import { ChurnChart, ChurnLegend } from "./ChurnChart";
// import { PackageDistributionCard } from "./PackageDistributionCard";
// import { RecentCompaniesList } from "./RecentCompaniesList";
// import { RecentRequestsList } from "./RecentRequestsList";
// import { DashboardCard, ShowAll } from "./DashboardCard";
// import { Plus } from "lucide-react";

// export function SuperAdminDashboard() {
//   const t = useTranslations("dashboard");
//   const { data, isLoading } = useDashboard();
//   const router = useRouter();

//   return (
//     <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
//       <div className="flex flex-col gap-6">

//         {/* Header */}
//         <PageHeader 
//           title={t("title")} 
//           subtitle={t("subtitle")}
//           actions={[
//             {
//               label: t("newCompany"),
//               icon: Plus,
//               variant: "solid",
//               onClick: () => router.push("/companies/add"),
//             }
//           ]}
//         />

//         {/* Main grid */}
//         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

//           {/* Left column */}
//           <div className="xl:col-span-2 flex flex-col gap-6">
//             {data && <DashboardStatsRow stats={data.stats} />}

//             <DashboardCard title={t("monthlyCashFlow")} action={<CashFlowLegend />}>
//               {data && <CashFlowChart data={data.cashFlow} />}
//             </DashboardCard>

//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <DashboardCard title={t("subscriberGrowth")} action={<ChurnLegend />}>
//                 {data && <ChurnChart data={data.churn} />}
//               </DashboardCard>

//               <DashboardCard title={t("packageDistribution")}>
//                 {data && <PackageDistributionCard data={data.packageDistribution} />}
//               </DashboardCard>
//             </div>
//           </div>

//           {/* Right column */}
//           <div className="flex flex-col gap-5">
//             <DashboardCard
//               title={t("recentCompanies")}
//               action={<ShowAll href="/companies" />}
//             >
//               {data && <RecentCompaniesList companies={data.recentCompanies} />}
//             </DashboardCard>

//             <DashboardCard
//               title={t("recentRequests")}
//               action={<ShowAll href="/company-requests" />}
//             >
//               {data && <RecentRequestsList requests={data.recentRequests} />}
//             </DashboardCard>
//           </div>
//         </div>
//       </div>
//     </PageContainer>
//   );
// }
"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import type { DashboardRole } from "../api/dashboard.api";
import { PageContainer } from "@/components/template/PageContainer";
import { PageHeader } from "@/components/molecules/Pageheader";
import { DashboardCard, ShowAll } from "./DashboardCard";
import { DashboardStatsRow } from "./DashboardStatsRow";
import { CashFlowChart, CashFlowLegend } from "./CashFlowChart";
import { ChurnChart, ChurnLegend } from "./ChurnChart";
import { PackageDistributionCard } from "./PackageDistributionCard";
import { RecentCompaniesList } from "./RecentCompaniesList";
import { RecentRequestsList } from "./RecentRequestsList";

interface Props { role: DashboardRole; token: string }

export function SuperAdminDashboard({ role, token }: Props) {
  const t = useTranslations("dashboard");
  const { data, isLoading } = useDashboard(role, token);
  const router = useRouter();

  return (
    <PageContainer isLoading={isLoading} skeletonVariant="dashboard">
      <div className="flex flex-col gap-6">

        <PageHeader
          title={t("title")}
          subtitle={t("subtitle")}
          actions={[{
            label: t("newCompany"),
            icon: Plus,
            variant: "solid",
            onClick: () => router.push("/companies/add"),
          }]}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

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

          <div className="flex flex-col gap-5">
            <DashboardCard title={t("recentCompanies")} action={<ShowAll href="/companies" />}>
              {data && <RecentCompaniesList companies={data.recentCompanies} />}
            </DashboardCard>

            <DashboardCard title={t("recentRequests")} action={<ShowAll href="/company-requests" />}>
              {data && <RecentRequestsList requests={data.recentRequests} />}
            </DashboardCard>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}