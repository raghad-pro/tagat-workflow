// ─── Shared API shape ─────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export interface ApiInvoice {
  id: number;
  company_id: number;
  client_id: number;
  project_id: number;
  currency_id: number;
  invoice_date: string;
  due_date: string;
  amount: string;
  status: "unpaid" | "paid";
  created_at: string;
  updated_at: string;
}

export interface ApiInvoicesResponse {
  data: ApiInvoice[];
  meta?: { total: number; current_page: number; last_page: number };
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export interface ApiTask {
  id: number;
  project_id: number;
  assigned_to: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  task_date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export interface ApiTasksResponse {
  data: ApiTask[];
  meta?: { total: number; current_page: number; last_page: number };
}

// ─── Timesheets ───────────────────────────────────────────────────────────────
export interface ApiTimesheet {
  id: number;
  status: "pending" | "approved" | "rejected";
  date?: string;
  hours?: string | number;
  total?: string | number;
  created_at: string;
  updated_at: string;
}

export interface ApiTimesheetsResponse {
  data: ApiTimesheet[];
  meta?: { total: number; current_page: number; last_page: number };
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export interface ApiPayment {
  id: number;
  invoice_id: number;
  company_id?: number;
  wallet_id: number;
  employee_id: number | null;
  amount: string;
  exchange_rate: string;
  payment_method: "cash" | "bank_transfer" | "card" | "online" | "stripe";
  payment_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiPaymentsResponse {
  data: ApiPayment[];
  meta?: { total: number; current_page: number; last_page: number };
}

// ─── Companies (super_admin only) ─────────────────────────────────────────────
export interface ApiCompany {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  created_at: string;
  updated_at: string;
}

// ─── UI Types (consumed by components) ───────────────────────────────────────

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

export interface WorkingHoursPoint {
  day: string;
  hours: number;
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

// ─── Employee-specific stats ──────────────────────────────────────────────────
export interface EmployeeStats {
  totalTasks: number;
  completedTasks: number;
  pendingTimesheets: number;
  workingHours: string;
  totalEarned?: number;
}

// ─── Employee task (derived from ApiTask for display) ────────────────────────
export interface EmployeeTaskDisplay {
  name: string;
  duration: string;
  status: "Completed" | "In Progress";
}

// ─── Salary/Bonus split data ─────────────────────────────────────────────────
export interface SplitBarData {
  paid: number;
  unpaid: number;
  paidLabel: string;
  unpaidLabel: string;
  paidTag: string;
  unpaidTag: string;
}

// ─── Extended DashboardResponse for employee ─────────────────────────────────
export interface EmployeeDashboardData {
  employeeStats: EmployeeStats;
  tasks: EmployeeTaskDisplay[];
  salary: SplitBarData;
  cashFlow: CashFlowPoint[];
  workingHoursTrend?: WorkingHoursPoint[];
}

// ─── Client invoice display ───────────────────────────────────────────────────
export interface ClientStatCards {
  totalInvoicesAmount: string;
  totalInvoicesTrend: string;
  paidCount: number;
  unpaidCount: number;
}

// ─── Super Admin Dashboard (من /super_admin/dashboard) ───────────────────────
export interface SuperAdminDashboardData {
  companiesCount: number;
  projectsCount: number;
  clientsCount: number;
  employeesCount: number;
  totalInvoices: number;
  totalPayments: number;
  latestCompanies: any[];
  latestProjects: any[];
  latestInvoices: any[];
  monthlyPayments?: { month: string; amount: number }[];
  monthlyInvoices?: { month: string; amount: number }[];
}

// ─── Client dashboard (من /client/dashboard) ─────────────────────────────────
export interface ClientCompanyLink {
  id: number;
  name: string;
  status: "pending" | "approved" | "rejected";
  request_date?: string;
}

export interface ClientInvoiceItem {
  id: number;
  invoice_number?: string;
  amount: number | string;
  invoice_date?: string;
}

export interface ClientDashboardData {
  projectsCount: number;
  projectsCompleted: number;
  projectsInProgress: number;
  projectsPending: number;
  totalInvoicesAmount: number;
  paidAmount: number;
  remainingAmount: number;
  linkedCompanies: ClientCompanyLink[];
  latestInvoices: ClientInvoiceItem[];
}

// ─── Company Dashboard ────────────────────────────────────────────────────────
export interface CompanyDashboardData {
  projectsCount: number;
  clientsCount: number;
  employeesCount: number;
  walletBalance: number;
  latestProjects: any[];
  latestTasks: any[];
  monthlyInvoices: { month: string; amount: number }[];
}

// ─── Final shape returned to components ──────────────────────────────────────
export interface DashboardResponse {
  stats: DashboardStats;
  cashFlow: CashFlowPoint[];
  churn: ChurnPoint[];
  packageDistribution: PackageDistribution[];
  recentCompanies: RecentCompany[];
  recentRequests: DashboardRequest[];

  // ── Role-specific extras (optional) ──────────────────────────────────────
  /** Company Admin: الـ invoices غير المدفوعة للعرض في Pending Approvals */
  pendingInvoices?: DashboardRequest[];

  /** Employee: البيانات الخاصة بالموظف */
  employeeData?: EmployeeDashboardData;

  /** Client: إحصائيات الـ invoices الخاصة بالعميل */
  clientStats?: ClientStatCards;

  /** Client: بيانات الداشبورد الخاص بالعميل من /client/dashboard */
  clientData?: ClientDashboardData;

  /** Super Admin: البيانات الخاصة بالـ super_admin من /super_admin/dashboard */
  superAdminData?: SuperAdminDashboardData;

  /** Company Admin: البيانات الخاصة بالـ company من /company/dashboard */
  companyData?: CompanyDashboardData;
}