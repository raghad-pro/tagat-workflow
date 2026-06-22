// ─── Raw API Types (ما يرجعه الـ API) ────────────────────────────────────────
export interface ApiLatestCompany {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiLatestProject {
  id: number;
  company_id: number;
  client_id: number;
  currency_id: number;
  title: string;
  description: string;
  budget: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiLatestInvoice {
  id: number;
  company_id: number;
  client_id: number;
  project_id: number;
  currency_id: number;
  invoice_date: string;
  due_date: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ApiDashboardData {
  companiesCount: number;
  projectsCount: number;
  clientsCount: number;
  employeesCount: number;
  totalInvoices: string;
  totalPayments: string;
  latestCompanies: ApiLatestCompany[];
  latestProjects: ApiLatestProject[];
  latestInvoices: ApiLatestInvoice[];
}

export interface ApiDashboardResponse {
  success: boolean;
  message: string;
  data: ApiDashboardData;
}

// ─── UI Types (اللي تستخدمها الـ components) ─────────────────────────────────
export interface DashboardStats {
  mrr: number;
  mrrTrend: string;
  companiesActive: number;
  companiesTotal: number;
  engagementRate: string;
  invoicesAmount: number;
  invoicesOverdue: number;
  pending: number;
}

export interface CashFlowPoint {
  month: string;
  revenue: number;
  expenses: number;
}

export interface ChurnPoint {
  month: string;
  new: number;
  cancelled: number;
}

export interface PackageDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RecentCompany {
  name: string;
  date: string;
  plan: "Basic" | "Pro" | "Enterprise";
  amount: string;
}

export interface DashboardRequest {
  id: string;
  priority: "High" | "Medium" | "Low";
  company: string;
  sub: string;
  date: string;
}

// ─── النوع النهائي اللي يرجعه الـ service للـ components ─────────────────────
export interface DashboardResponse {
  stats: DashboardStats;
  cashFlow: CashFlowPoint[];
  churn: ChurnPoint[];
  packageDistribution: PackageDistribution[];
  recentCompanies: RecentCompany[];
  recentRequests: DashboardRequest[];
}