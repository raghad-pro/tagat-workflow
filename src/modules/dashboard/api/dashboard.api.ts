import type {
  DashboardResponse,
  DashboardStats,
  CashFlowPoint,
  ChurnPoint,
  PackageDistribution,
  RecentCompany,
  DashboardRequest,
  ApiInvoice,
  ApiTask,
  ApiPayment,
  ApiCompany,
  ApiTimesheet,
  ApiResponse,
  ApiInvoicesResponse,
  ApiTasksResponse,
  ApiPaymentsResponse,
  ApiTimesheetsResponse,
  EmployeeDashboardData,
  EmployeeTaskDisplay,
  SplitBarData,
  ClientStatCards,
} from "../types/dashboard.types";

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://workflow.aliservice.site/api/v1";

// ─── HTTP helper ──────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status} — ${path}`);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// ─── Month label helper ───────────────────────────────────────────────────────
function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", { month: "short" });
}

// ─── Calculate working hours from tasks start_time / end_time ────────────────
function calcWorkingHours(tasks: ApiTask[]): string {
  let totalMinutes = 0;
  for (const t of tasks) {
    if (!t.start_time || !t.end_time) continue;
    const [sh, sm] = t.start_time.split(":").map(Number);
    const [eh, em] = t.end_time.split(":").map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) totalMinutes += diff;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

// ─── Map ApiTask → EmployeeTaskDisplay ───────────────────────────────────────
function buildTaskDisplay(tasks: ApiTask[]): EmployeeTaskDisplay[] {
  return tasks.slice(0, 10).map((t) => {
    let duration = "—";
    if (t.start_time && t.end_time) {
      const [sh, sm] = t.start_time.split(":").map(Number);
      const [eh, em] = t.end_time.split(":").map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff > 0) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        duration = h > 0 ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`;
      }
    }
    return {
      name: t.title,
      duration,
      status: t.status === "completed" ? "Completed" : "In Progress",
    };
  });
}

// ─── Build salary split from timesheets ──────────────────────────────────────
// The API doesn't expose a salary amount directly — we count approved vs pending
// timesheets and show them as proportional values.
// If your backend later exposes salary amounts, replace the .length with real amounts.
function buildSalaryData(timesheets: ApiTimesheet[]): SplitBarData {
  const approved = timesheets.filter((t) => t.status === "approved").length;
  const pending  = timesheets.filter((t) => t.status === "pending").length;
  const rejected = timesheets.filter((t) => t.status === "rejected").length;

  return {
    paid:         approved,
    unpaid:       pending + rejected,
    paidLabel:    "Approved Timesheets",
    unpaidLabel:  "Pending / Rejected",
    paidTag:      "From Approved Timesheets",
    unpaidTag:    "Pending Timesheets",
  };
}

// ─── Aggregate invoices into monthly cash-flow buckets ───────────────────────
function buildCashFlow(invoices: ApiInvoice[], payments: ApiPayment[]): CashFlowPoint[] {
  const buckets: Record<string, { revenue: number; expenses: number }> = {};

  for (const inv of invoices) {
    const m = monthLabel(inv.invoice_date);
    if (!buckets[m]) buckets[m] = { revenue: 0, expenses: 0 };
    buckets[m].revenue += parseFloat(inv.amount);
  }

  for (const pay of payments) {
    const m = monthLabel(pay.payment_date);
    if (!buckets[m]) buckets[m] = { revenue: 0, expenses: 0 };
    buckets[m].expenses += parseFloat(pay.amount);
  }

  return Object.entries(buckets)
    .slice(-6)
    .map(([month, vals]) => ({ month, ...vals }));
}

// ─── Build task activity chart (pending/in_progress vs completed) ─────────────
function buildChurn(tasks: ApiTask[]): ChurnPoint[] {
  const buckets: Record<string, { new: number; cancelled: number }> = {};
  for (const t of tasks) {
    const m = monthLabel(t.task_date);
    if (!buckets[m]) buckets[m] = { new: 0, cancelled: 0 };
    if (t.status === "pending" || t.status === "in_progress") buckets[m].new += 1;
    if (t.status === "completed") buckets[m].cancelled += 1;
  }
  return Object.entries(buckets)
    .slice(-6)
    .map(([month, vals]) => ({ month, ...vals }));
}

// ─── Map raw invoices to RecentRequests ──────────────────────────────────────
function buildRecentRequests(invoices: ApiInvoice[]): DashboardRequest[] {
  return invoices.slice(0, 5).map((inv) => ({
    id: `#INV-${inv.id}`,
    priority: parseFloat(inv.amount) > 1000 ? "High" : parseFloat(inv.amount) > 500 ? "Medium" : "Low",
    company: `Company #${inv.company_id}`,
    sub: `Invoice — $${parseFloat(inv.amount).toLocaleString()}`,
    date: inv.invoice_date,
  }));
}

// ─── Map raw companies to RecentCompanies ────────────────────────────────────
function buildRecentCompanies(companies: ApiCompany[], invoices: ApiInvoice[]): RecentCompany[] {
  return companies.slice(0, 5).map((c) => {
    const total = invoices
      .filter((inv) => inv.company_id === c.id)
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    return {
      name: c.name,
      date: new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      plan: "Basic" as const,
      amount: `$${total.toLocaleString()}`,
    };
  });
}

// ─── Package distribution from invoice statuses ───────────────────────────────
function buildPackageDistribution(invoices: ApiInvoice[]): PackageDistribution[] {
  const paid   = invoices.filter((i) => i.status === "paid").length;
  const unpaid = invoices.filter((i) => i.status === "unpaid").length;
  return [
    { name: "Paid",   value: paid,   color: "var(--color-chart-new)"      },
    { name: "Unpaid", value: unpaid, color: "var(--color-chart-cancelled)" },
  ];
}

// ═════════════════════════════════════════════════════════════════════════════
// ROLE-BASED FETCHERS
// ═════════════════════════════════════════════════════════════════════════════

// ─── Super Admin ─────────────────────────────────────────────────────────────
async function fetchSuperAdminDashboard(token: string): Promise<DashboardResponse> {
  const [invoicesRes, paymentsRes, tasksRes, timesheetsRes] = await Promise.all([
    apiFetch<ApiInvoicesResponse>("/super_admin/invoices?page=1", token),
    apiFetch<ApiPaymentsResponse>("/super_admin/payments?page=1", token),
    apiFetch<ApiTasksResponse>("/super_admin/tasks?month=current", token),
    apiFetch<ApiTimesheetsResponse>("/timesheets?status=pending&page=1", token),
  ]);

  const invoices   = invoicesRes.data   ?? [];
  const payments   = paymentsRes.data   ?? [];
  const tasks      = tasksRes.data      ?? [];
  const timesheets = timesheetsRes.data ?? [];

  const totalInvoices = invoices.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPayments = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const overdueCount  = invoices.filter((i) => i.status === "unpaid" && new Date(i.due_date) < new Date()).length;

  const stats: DashboardStats = {
    mrr:             Math.round(totalPayments),
    mrrTrend:        "↑ +8%",
    companiesActive: 0,
    companiesTotal:  0,
    engagementRate:  "—",
    invoicesAmount:  Math.round(totalInvoices),
    invoicesOverdue: overdueCount,
    pending:         timesheets.filter((t) => t.status === "pending").length,
  };

  return {
    stats,
    cashFlow:            buildCashFlow(invoices, payments),
    churn:               buildChurn(tasks),
    packageDistribution: buildPackageDistribution(invoices),
    recentCompanies:     [],
    recentRequests:      buildRecentRequests(invoices),
  };
}

// ─── Company Admin ────────────────────────────────────────────────────────────
async function fetchCompanyDashboard(token: string): Promise<DashboardResponse & {
  pendingInvoices: DashboardRequest[];
}> {
  const [invoicesRes, paymentsRes, tasksRes, timesheetsRes] = await Promise.all([
    apiFetch<ApiInvoicesResponse>("/company/invoices?page=1", token),
    apiFetch<ApiPaymentsResponse>("/company/payments?page=1", token),
    apiFetch<ApiTasksResponse>("/company/tasks?month=current", token),
    apiFetch<ApiTimesheetsResponse>("/timesheets?status=pending&page=1", token),
  ]);

  const invoices   = invoicesRes.data   ?? [];
  const payments   = paymentsRes.data   ?? [];
  const tasks      = tasksRes.data      ?? [];
  const timesheets = timesheetsRes.data ?? [];

  const totalInvoices = invoices.reduce((s, i) => s + parseFloat(i.amount), 0);
  const totalPayments = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const overdueCount  = invoices.filter((i) => i.status === "unpaid" && new Date(i.due_date) < new Date()).length;

  // Pending timesheets → shown as "Pending Approvals"
  const pendingTimesheetItems: DashboardRequest[] = timesheets
    .filter((t) => t.status === "pending")
    .slice(0, 5)
    .map((t) => ({
      id:       `#TS-${t.id}`,
      priority: "Medium" as const,
      company:  "Timesheet",
      sub:      `Submitted ${new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      date:     t.created_at,
    }));

  const stats: DashboardStats = {
    mrr:             Math.round(totalPayments),
    mrrTrend:        "↑ +8%",
    companiesActive: 0,
    companiesTotal:  0,
    engagementRate:  "—",
    invoicesAmount:  Math.round(totalInvoices),
    invoicesOverdue: overdueCount,
    pending:         timesheets.filter((t) => t.status === "pending").length,
  };

  return {
    stats,
    cashFlow:            buildCashFlow(invoices, payments),
    churn:               buildChurn(tasks),
    packageDistribution: buildPackageDistribution(invoices),
    recentCompanies:     [],
    recentRequests:      buildRecentRequests(invoices),
    pendingInvoices:     pendingTimesheetItems,
  };
}

// ─── Employee ─────────────────────────────────────────────────────────────────
async function fetchEmployeeDashboard(token: string): Promise<DashboardResponse & {
  employeeData: EmployeeDashboardData;
}> {
  const [tasksRes, timesheetsRes] = await Promise.all([
    apiFetch<ApiTasksResponse>("/employee/tasks?month=current", token),
    apiFetch<ApiTimesheetsResponse>("/timesheets?page=1", token),
  ]);

  const tasks      = tasksRes.data      ?? [];
  const timesheets = timesheetsRes.data ?? [];

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks   = tasks.filter((t) => t.status === "pending" || t.status === "in_progress").length;
  const workingHours   = calcWorkingHours(tasks);

  const stats: DashboardStats = {
    mrr:             0,
    mrrTrend:        "",
    companiesActive: 0,
    companiesTotal:  0,
    engagementRate:  "—",
    invoicesAmount:  0,
    invoicesOverdue: 0,
    pending:         timesheets.filter((t) => t.status === "pending").length,
  };

  const employeeData: EmployeeDashboardData = {
    employeeStats: {
      totalTasks:        tasks.length,
      completedTasks,
      pendingTimesheets: timesheets.filter((t) => t.status === "pending").length,
      workingHours,
    },
    tasks:  buildTaskDisplay(tasks),
    salary: buildSalaryData(timesheets),
    cashFlow: [],
  };

  return {
    stats,
    cashFlow: [],
    churn:    buildChurn(tasks),
    packageDistribution: [
      { name: "Completed",   value: completedTasks, color: "var(--color-chart-new)"      },
      { name: "In Progress", value: pendingTasks,   color: "var(--color-chart-expenses)" },
    ],
    recentCompanies: [],
    recentRequests:  [],
    employeeData,
  };
}

// ─── Client ───────────────────────────────────────────────────────────────────
async function fetchClientDashboard(token: string): Promise<DashboardResponse & {
  clientStats: ClientStatCards;
}> {
  const invoicesRes = await apiFetch<ApiInvoicesResponse>("/client/invoices?page=1", token);
  const invoices    = invoicesRes.data ?? [];

  const totalInvoices = invoices.reduce((s, i) => s + parseFloat(i.amount), 0);
  const paidCount     = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount   = invoices.filter((i) => i.status === "unpaid").length;

  const stats: DashboardStats = {
    mrr:             0,
    mrrTrend:        "",
    companiesActive: 0,
    companiesTotal:  0,
    engagementRate:  "—",
    invoicesAmount:  Math.round(totalInvoices),
    invoicesOverdue: unpaidCount,
    pending:         unpaidCount,
  };

  const clientStats: ClientStatCards = {
    totalInvoicesAmount: `$${Math.round(totalInvoices).toLocaleString()}`,
    totalInvoicesTrend:  invoices.length > 0 ? `${invoices.length} invoices total` : "No invoices",
    paidCount,
    unpaidCount,
  };

  return {
    stats,
    cashFlow:            [],
    churn:               [],
    packageDistribution: buildPackageDistribution(invoices),
    recentCompanies:     [],
    recentRequests:      buildRecentRequests(invoices),
    clientStats,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLIC API OBJECT
// ═════════════════════════════════════════════════════════════════════════════

export type DashboardRole = "super_admin" | "company_admin" | "employee" | "client";

export const dashboardApi = {
  getDashboard:         (role: DashboardRole, token: string) => {
    switch (role) {
      case "super_admin":   return fetchSuperAdminDashboard(token);
      case "company_admin": return fetchCompanyDashboard(token);
      case "employee":      return fetchEmployeeDashboard(token);
      case "client":        return fetchClientDashboard(token);
    }
  },

  // Typed accessors for role-specific data
  getCompanyDashboard:  (token: string) => fetchCompanyDashboard(token),
  getEmployeeDashboard: (token: string) => fetchEmployeeDashboard(token),
  getClientDashboard:   (token: string) => fetchClientDashboard(token),
};