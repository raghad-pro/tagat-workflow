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
} from "../types/dashboard.types";

// ─── Constants ─────────────────────────────────────────────────────────────────
const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://workflow.aliservice.site/api/v1";

const EMPTY_DASHBOARD: DashboardResponse = {
  stats: {
    mrr: 0,
    mrrTrend: "",
    companiesActive: 0,
    companiesTotal: 0,
    engagementRate: "—",
    invoicesAmount: 0,
    invoicesOverdue: 0,
    pending: 0,
  },
  cashFlow: [],
  churn: [],
  packageDistribution: [],
  recentCompanies: [],
  recentRequests: [],
};

// ─── HTTP helper ───────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API error ${res.status} — ${path}`);

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// ─── Safe fetch — returns fallback on failure ──────────────────────────────────
async function safeFetch<T>(
  path: string,
  token: string,
  fallback: T
): Promise<T> {
  try {
    return await apiFetch<T>(path, token);
  } catch {
    return fallback;
  }
}

// ─── Data builders ─────────────────────────────────────────────────────────────
function monthLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", { month: "short" });
}

function buildCashFlow(
  invoices: ApiInvoice[],
  payments: ApiPayment[]
): CashFlowPoint[] {
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

function buildChurn(tasks: ApiTask[]): ChurnPoint[] {
  const buckets: Record<string, { new: number; cancelled: number }> = {};

  for (const t of tasks) {
    const m = monthLabel(t.task_date);
    if (!buckets[m]) buckets[m] = { new: 0, cancelled: 0 };
    if (t.status === "pending" || t.status === "in_progress")
      buckets[m].new += 1;
    if (t.status === "completed") buckets[m].cancelled += 1;
  }

  return Object.entries(buckets)
    .slice(-6)
    .map(([month, vals]) => ({ month, ...vals }));
}

function buildRecentRequests(invoices: ApiInvoice[]): DashboardRequest[] {
  return invoices.slice(0, 5).map((inv) => ({
    id: `#INV-${inv.id}`,
    priority:
      parseFloat(inv.amount) > 1000
        ? "High"
        : parseFloat(inv.amount) > 500
        ? "Medium"
        : "Low",
    company: `Company #${inv.company_id}`,
    sub: `Invoice — $${parseFloat(inv.amount).toLocaleString()}`,
    date: inv.invoice_date,
  }));
}

function buildPackageDistribution(
  invoices: ApiInvoice[]
): PackageDistribution[] {
  const paid = invoices.filter((i) => i.status === "paid").length;
  const unpaid = invoices.filter((i) => i.status === "unpaid").length;
  return [
    { name: "Paid", value: paid, color: "var(--color-chart-new)" },
    { name: "Unpaid", value: unpaid, color: "var(--color-chart-cancelled)" },
  ];
}

// ─── Super Admin: يجلب قائمة الشركات أولاً ثم بيانات كل شركة بـ ID ────────────
async function fetchSuperAdminDashboard(
  token: string
): Promise<DashboardResponse> {
  // 1. Fetch dashboard stats and latest data from /super_admin/dashboard
  const rawDashboardData = await safeFetch<any>(
    "/super_admin/dashboard",
    token,
    {}
  );

  // 2. Fetch payments from /super_admin/payments to compute monthly payments chart
  const paymentsRes = await safeFetch<ApiPaymentsResponse>(
    "/super_admin/payments?page=1",
    token,
    { data: [] }
  );
  const payments = paymentsRes.data ?? [];

  // Group payments by month
  const paymentsBuckets: Record<string, number> = {};
  for (const p of payments) {
    const m = monthLabel(p.payment_date);
    if (!paymentsBuckets[m]) paymentsBuckets[m] = 0;
    paymentsBuckets[m] += parseFloat(p.amount);
  }
  const monthlyPayments = Object.entries(paymentsBuckets)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));
  
  const superAdminData: any = {
    companiesCount: rawDashboardData?.companiesCount ?? 0,
    projectsCount: rawDashboardData?.projectsCount ?? 0,
    clientsCount: rawDashboardData?.clientsCount ?? 0,
    employeesCount: rawDashboardData?.employeesCount ?? 0,
    totalInvoices: Number(rawDashboardData?.totalInvoices ?? 0),
    totalPayments: Number(rawDashboardData?.totalPayments ?? 0),
    latestCompanies: rawDashboardData?.latestCompanies ?? [],
    latestProjects: rawDashboardData?.latestProjects ?? [],
    latestInvoices: rawDashboardData?.latestInvoices ?? [],
    monthlyPayments,
  };

  // 3. Fallback: If latestInvoices is empty, fetch invoices from /super_admin/invoices?page=1
  let latestInvoices = superAdminData.latestInvoices;
  let rawInvoicesList: any[] = [];
  if (!latestInvoices || latestInvoices.length === 0) {
    const invoicesRes = await safeFetch<any>(
      "/super_admin/invoices?page=1",
      token,
      { data: [] }
    );
    const invoicesList = invoicesRes?.data?.data || invoicesRes?.data || invoicesRes || [];
    if (Array.isArray(invoicesList)) {
      latestInvoices = invoicesList.slice(0, 5);
      rawInvoicesList = invoicesList;
    }
  } else {
    rawInvoicesList = latestInvoices;
  }

  superAdminData.latestInvoices = latestInvoices;

  // Group invoices by month for the chart
  const invoicesBuckets: Record<string, number> = {};
  for (const inv of rawInvoicesList) {
    const m = monthLabel(inv.invoice_date || inv.created_at);
    if (!invoicesBuckets[m]) invoicesBuckets[m] = 0;
    invoicesBuckets[m] += parseFloat(inv.amount || "0");
  }
  const monthlyInvoices = Object.entries(invoicesBuckets)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  superAdminData.monthlyInvoices = monthlyInvoices;

  const stats: DashboardStats = {
    mrr: superAdminData.totalPayments,
    mrrTrend: "—",
    companiesActive: superAdminData.companiesCount,
    companiesTotal: superAdminData.companiesCount,
    engagementRate: "100%",
    invoicesAmount: superAdminData.totalInvoices,
    invoicesOverdue: 0,
    pending: 0,
  };

  return {
    stats,
    cashFlow: [],
    churn: [],
    packageDistribution: [],
    recentCompanies: [],
    recentRequests: [],
    superAdminData,
  };
}

// ─── Company Admin: الـ backend يحدد الـ company من الـ token تلقائياً ──────────
async function fetchCompanyDashboard(
  token: string
): Promise<DashboardResponse> {
  // الـ company admin لا يحتاج يرسل company_id — الـ backend يعرفه من الـ token
  const [
    invoicesResult,
    paymentsResult,
    tasksResult,
    timesheetsResult,
    dashboardResult,
    projectsResult,
    clientsResult,
    employeesResult,
    walletsResult
  ] = await Promise.allSettled([
    safeFetch<ApiInvoicesResponse>("/company/invoices?page=1", token, { data: [] }),
    safeFetch<ApiPaymentsResponse>("/company/payments?page=1", token, { data: [] }),
    safeFetch<ApiTasksResponse>("/company/tasks?month=current", token, { data: [] }),
    safeFetch<ApiTimesheetsResponse>("/timesheets?status=pending&page=1", token, { data: [] }),
    safeFetch<any>("/company/dashboard", token, {}),
    safeFetch<any>("/company/projects", token, { data: [] }),
    safeFetch<any>("/company/clients", token, { data: [] }),
    safeFetch<any>("/company/employees", token, { data: [] }),
    safeFetch<any>("/company/wallets", token, { data: [] }),
  ]);

  const invoices = invoicesResult.status === "fulfilled" ? invoicesResult.value.data ?? [] : [];
  const payments = paymentsResult.status === "fulfilled" ? paymentsResult.value.data ?? [] : [];
  const tasks = tasksResult.status === "fulfilled" ? tasksResult.value.data ?? [] : [];
  const timesheets = timesheetsResult.status === "fulfilled" ? timesheetsResult.value.data ?? [] : [];

  const totalInvoices = invoices.reduce((s, i) => s + parseFloat(i.amount || "0"), 0);
  const totalPayments = payments.reduce((s, p) => s + parseFloat(p.amount || "0"), 0);
  const overdueCount = invoices.filter(
    (i) => i.status === "unpaid" && new Date(i.due_date) < new Date()
  ).length;

  const stats: DashboardStats = {
    mrr: Math.round(totalPayments),
    mrrTrend: "",
    companiesActive: 0,
    companiesTotal: 0,
    engagementRate: "—",
    invoicesAmount: Math.round(totalInvoices),
    invoicesOverdue: overdueCount,
    pending: timesheets.filter((t) => t.status === "pending").length,
  };

  // الـ pending invoices للـ company (unpaid) — لعرضها في Pending Approvals
  const pendingInvoices: DashboardRequest[] = invoices
    .filter((i) => i.status === "unpaid")
    .slice(0, 5)
    .map((inv) => ({
      id: `#INV-${inv.id}`,
      priority:
        parseFloat(inv.amount || "0") > 1000
          ? "High"
          : parseFloat(inv.amount || "0") > 500
          ? "Medium"
          : "Low",
      company: `Client #${inv.client_id}`,
      sub: `Invoice — $${parseFloat(inv.amount || "0").toLocaleString()}`,
      date: inv.invoice_date,
    }));

  const dashboardData =
    dashboardResult.status === "fulfilled" ? dashboardResult.value?.data || dashboardResult.value || {} : {};
  
  // Projects
  const _projectsData =
    projectsResult.status === "fulfilled" ? projectsResult.value?.data || projectsResult.value || [] : [];
  let projectsArray = Array.isArray(_projectsData) ? _projectsData : (Array.isArray(_projectsData.data) ? _projectsData.data : []);

  // Clients
  const _clientsData =
    clientsResult.status === "fulfilled" ? clientsResult.value?.data || clientsResult.value || [] : [];
  let clientsArray = Array.isArray(_clientsData) ? _clientsData : (Array.isArray(_clientsData.data) ? _clientsData.data : []);

  // Employees
  const _employeesData =
    employeesResult.status === "fulfilled" ? employeesResult.value?.data || employeesResult.value || [] : [];
  let employeesArray = Array.isArray(_employeesData) ? _employeesData : (Array.isArray(_employeesData.data) ? _employeesData.data : []);

  // Wallets
  const _walletsData =
    walletsResult.status === "fulfilled" ? walletsResult.value?.data || walletsResult.value || [] : [];
  let walletsArray = Array.isArray(_walletsData) ? _walletsData : (Array.isArray(_walletsData.data) ? _walletsData.data : []);

  const totalWalletBalance = walletsArray.reduce((sum: number, w: any) => sum + (parseFloat(w.balance || "0") || 0), 0);

  const latestProjects = projectsArray.slice(0, 5);

  // Group invoices by month for the chart
  const invoicesBuckets: Record<string, number> = {};
  for (const inv of invoices) {
    const m = monthLabel(inv.invoice_date || inv.created_at);
    if (!invoicesBuckets[m]) invoicesBuckets[m] = 0;
    invoicesBuckets[m] += parseFloat(inv.amount || "0");
  }
  const monthlyInvoices = Object.entries(invoicesBuckets)
    .slice(-6)
    .map(([month, amount]) => ({ month, amount }));

  const companyData = {
    projectsCount: dashboardData.projectsCount ?? dashboardData.projects_count ?? projectsArray.length,
    clientsCount: dashboardData.clientsCount ?? dashboardData.clients_count ?? clientsArray.length,
    employeesCount: dashboardData.employeesCount ?? dashboardData.employees_count ?? employeesArray.length,
    walletBalance: dashboardData.walletBalance ?? dashboardData.total_balance ?? dashboardData.totalBalance ?? totalWalletBalance,
    latestProjects,
    latestTasks: tasks.slice(0, 5),
    monthlyInvoices,
  };

  return {
    stats,
    cashFlow: buildCashFlow(invoices, payments),
    churn: buildChurn(tasks),
    packageDistribution: buildPackageDistribution(invoices),
    recentCompanies: [],
    recentRequests: buildRecentRequests(invoices),
    pendingInvoices,
    companyData,
  };
}

// ─── Employee: الـ backend يعرف الـ employee من الـ token ────────────────────────
async function fetchEmployeeDashboard(
  token: string
): Promise<DashboardResponse> {
  const [dashboardResult, tasksResult, timesheetsResult] = await Promise.allSettled([
    safeFetch<any>("/employee/dashboard", token, { myTasks: 0, myHours: "0", totalEarned: 0 }),
    safeFetch<ApiTasksResponse>("/employee/tasks?month=current", token, { data: [] } as any),
    safeFetch<ApiTimesheetsResponse>("/timesheets?page=1", token, { data: [] } as any),
  ]);

  const d = dashboardResult.status === "fulfilled" ? (dashboardResult.value || {}) : {};
  const tasks = tasksResult.status === "fulfilled" ? (tasksResult.value.data ?? []) : [];
  const timesheets = timesheetsResult.status === "fulfilled" ? (timesheetsResult.value.data ?? []) : [];

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  
  const employeeTasks = tasks.map((t) => {
    let durationStr = "0h 0m";
    if (t.start_time && t.end_time) {
      const [h1, m1] = t.start_time.split(":").map(Number);
      const [h2, m2] = t.end_time.split(":").map(Number);
      let diff = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0));
      if (diff < 0) diff += 24 * 60;
      durationStr = `${Math.floor(diff / 60)}h ${diff % 60}m`;
    }
    return {
      name: t.title,
      duration: durationStr,
      status: t.status === "completed" ? "Completed" : "In Progress",
    } as const;
  });

  const approvedTimesheets = timesheets.filter((t) => t.status === "approved").length;
  const pendingTimesheets = timesheets.filter((t) => t.status === "pending").length;

  // Calculate working hours trend for the last 7 days
  const last7Days: string[] = [];
  const trendBuckets: Record<string, number> = {};
  
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    last7Days.push(dateStr);
    trendBuckets[dateStr] = 0;
  }

  tasks.forEach(t => {
    // Determine the date of the task
    const rawDateStr = (t as any).date || (t as any).task_date || (t as any).taskDate || (t as any).created_at;
    const dString = typeof rawDateStr === 'string' ? rawDateStr.substring(0, 10) : undefined;
    if (dString && trendBuckets[dString] !== undefined) {
      // Calculate duration from start and end time
      let diffHours = 0;
      if (t.start_time && t.end_time) {
        const [h1, m1] = t.start_time.split(":").map(Number);
        const [h2, m2] = t.end_time.split(":").map(Number);
        let diff = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0));
        if (diff < 0) diff += 24 * 60; // handle cross midnight
        diffHours = diff / 60;
      } else if ((t as any).duration) {
        diffHours = Number((t as any).duration) || 0;
      }
      trendBuckets[dString] += diffHours;
    }
  });

  const workingHoursTrend = last7Days.map(dateStr => {
    const d = new Date(dateStr);
    return {
      day: d.toLocaleString("en-US", { weekday: "short" }),
      hours: Number(trendBuckets[dateStr].toFixed(1))
    };
  });

  return {
    ...EMPTY_DASHBOARD,
    employeeData: {
      employeeStats: {
        totalTasks: d.myTasks || 0,
        completedTasks: completedTasks,
        pendingTimesheets: pendingTimesheets,
        workingHours: String(d.myHours || "0"),
        totalEarned: d.totalEarned || 0,
      },
      tasks: employeeTasks,
      salary: {
        paid: approvedTimesheets,
        unpaid: pendingTimesheets,
        paidLabel: "Approved Timesheets",
        unpaidLabel: "Pending Timesheets",
        paidTag: "Approved",
        unpaidTag: "Pending",
      },
      cashFlow: [],
      workingHoursTrend,
    },
  };
}

// ─── Client: الـ backend يعرف الـ client من الـ token ────────────────────────────
async function fetchClientDashboard(
  token: string
): Promise<DashboardResponse> {
  const dashRes = await safeFetch<any>("/client/dashboard", token, {});
  const d = dashRes?.data ?? dashRes ?? {};

  const projectsCount = d.projectsCount ?? 0;
  const projectsCompleted = d.projectsCompleted ?? 0;
  const projectsInProgress = d.projectsInProgress ?? 0;
  const projectsPending =
    d.projectsPending ??
    Math.max(projectsCount - projectsCompleted - projectsInProgress, 0);

  const invoicesRes = await safeFetch<ApiInvoicesResponse>(
    "/client/invoices?page=1",
    token,
    { data: [] }
  );
  const invoices = invoicesRes.data ?? [];

  const totalInvoicesAmount =
    d.totalInvoices ?? invoices.reduce((s, i) => s + parseFloat(i.amount), 0);
  const paidAmount =
    d.paidAmount ??
    invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + parseFloat(i.amount), 0);
  const remainingAmount =
    d.remainingAmount ?? Math.max(totalInvoicesAmount - paidAmount, 0);

  const linkedCompanies = d.companies ?? d.linkedCompanies ?? [];

  const latestInvoices =
    d.latestInvoices ??
    invoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      invoice_number: `#INV-${inv.id}`,
      amount: inv.amount,
      invoice_date: inv.invoice_date,
    }));

  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const unpaidCount = invoices.filter((i) => i.status === "unpaid").length;
  const paidPct =
    invoices.length > 0 ? Math.round((paidCount / invoices.length) * 100) : 0;

  const stats: DashboardStats = {
    mrr: 0,
    mrrTrend: "",
    companiesActive: 0,
    companiesTotal: 0,
    engagementRate: "—",
    invoicesAmount: Math.round(Number(totalInvoicesAmount)),
    invoicesOverdue: unpaidCount,
    pending: unpaidCount,
  };

  return {
    stats,
    cashFlow: [],
    churn: [],
    packageDistribution: buildPackageDistribution(invoices),
    recentCompanies: [],
    recentRequests: buildRecentRequests(invoices),
    clientStats: {
      totalInvoicesAmount: `$${Number(totalInvoicesAmount).toLocaleString()}`,
      totalInvoicesTrend: `${paidPct}% paid`,
      paidCount,
      unpaidCount,
    },
    clientData: {
      projectsCount,
      projectsCompleted,
      projectsInProgress,
      projectsPending,
      totalInvoicesAmount: Number(totalInvoicesAmount),
      paidAmount: Number(paidAmount),
      remainingAmount: Number(remainingAmount),
      linkedCompanies,
      latestInvoices,
    },
  };
}

// ─── Public API ────────────────────────────────────────────────────────────────
export type DashboardRole =
  | "super_admin"
  | "company"
  | "employee"
  | "client";

export const dashboardApi = {
  getDashboard: async (
    role: DashboardRole,
    token: string
  ): Promise<DashboardResponse> => {
    try {
      switch (role) {
        case "super_admin":
          return await fetchSuperAdminDashboard(token);
        case "company":
          return await fetchCompanyDashboard(token);
        case "employee":
          return await fetchEmployeeDashboard(token);
        case "client":
          return await fetchClientDashboard(token);
        default:
          return EMPTY_DASHBOARD;
      }
    } catch {
      // لو فشل كل شي برجع empty dashboard بدل ما يكسر الصفحة
      return EMPTY_DASHBOARD;
    }
  },
};