export type TrendDirection = "up" | "down" | "neutral";

export interface KpiMetric<T = number> {
  value: T;
  previous: T | null;
  change_percentage: number | null;
  trend: TrendDirection;
}

export interface CurrencyKpiBreakdown {
  currency_id: number;
  code: string;
  symbol: string;
  invoiced: number;
  collected: number;
  outstanding: number;
}

export interface FinancialKpis {
  revenue: KpiMetric;
  invoiced: KpiMetric;
  expenses: KpiMetric;
  profit: KpiMetric;
  employee_payouts?: KpiMetric;
  multi_currency?: boolean;
  by_currency?: CurrencyKpiBreakdown[];
  expenses_currency_known?: boolean;
}

export interface InvoicesKpis {
  total: KpiMetric;
  paid_count: number;
  unpaid_count: number;
  overdue_count: number;
  invoiced_amount: KpiMetric;
  paid_amount: number;
  outstanding_amount: number;
}

export interface UsersKpis {
  total: KpiMetric;
  active: number;
  inactive: number;
  new?: KpiMetric;
  employees: KpiMetric;
  new_employees?: number;
}

export interface ProjectsKpis {
  total: KpiMetric;
  new?: KpiMetric;
  pending: number;
  in_progress: number;
  completed: number;
  completion_rate: number;
}

export interface TasksKpis {
  total: KpiMetric;
  new?: KpiMetric;
  completed: KpiMetric;
  by_status: {
    backlog?: number;
    todo?: number;
    in_progress?: number;
    in_review?: number;
    completed?: number;
    pending?: number;
  };
  completion_rate: number;
}

export interface ClientsKpis {
  total: KpiMetric;
  new?: KpiMetric;
  with_projects: number;
  without_projects: number;
}

export interface TimesheetsKpis {
  total: KpiMetric;
  hours: KpiMetric;
  approved_hours: number;
  pending_hours: number;
  rejected_hours: number;
  approved_amount?: number;
  pending_amount?: number;
}

export interface MeetingsKpis {
  total: KpiMetric;
  waiting: number;
  live: number;
  ended: number;
  cancelled: number;
  total_duration_minutes: number;
  peak_participants: number;
  average_peak_participants: number;
}

export interface TrendDataPoint {
  month: number;
  label: string;
  value: number;
}

export interface KpiTrends {
  year: number;
  labels: string[];
  revenue?: TrendDataPoint[];
  expenses?: TrendDataPoint[];
  invoiced?: TrendDataPoint[];
  projects?: TrendDataPoint[];
  tasks?: TrendDataPoint[];
  users?: TrendDataPoint[];
  meetings?: TrendDataPoint[];
  hours?: TrendDataPoint[];
}

export interface KpiDashboardData {
  scope?: {
    role: string;
    company_id?: number | null;
    company_name?: string | null;
  };
  filters?: {
    year: number;
    month: number | null;
  };
  financial: FinancialKpis;
  invoices: InvoicesKpis;
  users: UsersKpis;
  projects: ProjectsKpis;
  tasks: TasksKpis;
  clients: ClientsKpis;
  timesheets: TimesheetsKpis;
  meetings: MeetingsKpis;
  trends?: KpiTrends;
}

export interface KpiFilterOption {
  value: number;
  label: string;
}

export interface KpiFiltersResponse {
  years: number[];
  months: Record<string, KpiFilterOption[]>;
  current: {
    year: number;
    month: number;
  };
}

export interface KpiQueryParams {
  year?: number;
  month?: number;
  company_id?: number;
}
