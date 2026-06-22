import type { DashboardResponse } from "@/modules/dashboard/types/dashboard.types";

const MOCK_DASHBOARD: DashboardResponse = {
  stats: {
    mrr: 67000,
    mrrTrend: "↑ +15.3%",
    companiesActive: 124,
    companiesTotal: 132,
    engagementRate: "94%",
    invoicesAmount: 12450,
    invoicesOverdue: 12,
    pending: 37,
  },
  cashFlow: [
    { month: "Jan", revenue: 40000, expenses: 28000 },
    { month: "Feb", revenue: 52000, expenses: 32000 },
    { month: "Mar", revenue: 38000, expenses: 25000 },
    { month: "Apr", revenue: 61000, expenses: 40000 },
    { month: "May", revenue: 55000, expenses: 35000 },
    { month: "Jun", revenue: 67000, expenses: 42000 },
  ],
  churn: [
    { month: "Jan", new: 40, cancelled: 10 },
    { month: "Feb", new: 30, cancelled: 25 },
    { month: "Mar", new: 20, cancelled: 30 },
    { month: "Apr", new: 50, cancelled: 38 },
    { month: "May", new: 35, cancelled: 20 },
    { month: "Jun", new: 45, cancelled: 15 },
  ],
  packageDistribution: [
    { name: "Basic", value: 74, color: "var(--color-plan-basic)" },
    { name: "Pro", value: 38, color: "var(--color-primary)" },
    { name: "Enterprise", value: 12, color: "var(--color-plan-enterprise)" },
  ],
  recentCompanies: [
    { name: "Advanced Tech Company", date: "2026-06-05", plan: "Enterprise", amount: "$1,500" },
    { name: "Innovation Institute", date: "2026-06-04", plan: "Pro", amount: "$499" },
    { name: "Smart Solutions Company", date: "2026-06-03", plan: "Basic", amount: "$99" },
    { name: "Development Group", date: "2026-06-02", plan: "Pro", amount: "$499" },
    { name: "Future Company", date: "2026-06-01", plan: "Enterprise", amount: "$2,000" },
  ],
  recentRequests: [
    { id: "#REQ-1247", priority: "High", company: "Advanced Tech Company", sub: "Plan Upgrade", date: "2026-06-05 16:00" },
    { id: "#REQ-1246", priority: "Medium", company: "Innovation Institute", sub: "Advanced Technical Support", date: "2026-06-05 14:20" },
    { id: "#REQ-1245", priority: "Low", company: "Smart Solutions Company", sub: "Custom Feature Request", date: "2026-06-05 09:15" },
  ],
};

const delay = (ms = 400) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function mockGetDashboard(): Promise<DashboardResponse> {
  await delay();
  return MOCK_DASHBOARD;
}