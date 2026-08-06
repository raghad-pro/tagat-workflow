// ─── Payment Types ─────────────────────────────────────────────────────────────
export type PaymentType = "monthly" | "hourly" | "part_time" | "Monthly" | "Hourly";
export type EmployeeStatus = "active" | "onboarding" | "inactive";

// ─── Currency ──────────────────────────────────────────────────────────────────
export interface EmployeeCurrency {
  id:   number;
  name: string;
  code: string;
}

// ─── Company ───────────────────────────────────────────────────────────────────
export interface EmployeeCompany {
  id:   number;
  name: string;
}

// ─── User ──────────────────────────────────────────────────────────────────────
export interface EmployeeUser {
  id:         number;
  name:       string;
  email:      string;
  first_name?: string;
  last_name?:  string;
  /** 1 / 0 — the only activity signal the API returns for an employee. */
  is_active?: number | boolean;
  image?:     string | null;
  roles?:     { id: number; name: string }[];
}

/**
 * Reads an employee's email. The API only ever nests it under `user`, so the
 * top-level `email` fallback exists purely for locally-built rows.
 */
export const getEmployeeEmail = (row: any): string =>
  row?.user?.email ?? row?.email ?? "";

/**
 * Derives a status from `user.is_active`.
 *
 * The employee record has no `status` column — reading `row.status` yields
 * `undefined` for every row the API returns, so any filter or badge based on
 * it is comparing against nothing.
 */
export const getEmployeeStatus = (row: any): EmployeeStatus => {
  if (row?.status) return String(row.status).toLowerCase() as EmployeeStatus;
  const active = row?.user?.is_active ?? row?.is_active;
  if (active === undefined || active === null) return "active";
  return Number(active) === 1 ? "active" : "inactive";
};

// ─── Employee ──────────────────────────────────────────────────────────────────
export interface Employee {
  id:              number;
  // API fields
  employee_name?:  string;
  job_title?:      string;
  payment_type?:   PaymentType;
  hourly_rate?:    number | string;
  salary?:         number | string;
  user_id?:        number;
  company_id?:     number;
  // Normalized fields
  name?:           string;
  employeeName?:   string;
  job?:            string;
  jobTitle?:       string;
  paymentType?:    PaymentType;
  hourlyRate?:     number | string;
  currency?:       EmployeeCurrency | string;
  company?:        EmployeeCompany  | string;
  user?:           EmployeeUser;
  email?:          string;
  status?:         EmployeeStatus;
  avatar?:         string;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export interface EmployeeStats {
  total:    number;
  active:   number;
  /**
   * Derived from `user.is_active` — the only activity signal the record
   * carries. The card used to be labelled "On Leave", which the data has never
   * been able to tell apart from any other kind of inactive.
   */
  inactive: number;
}

// ─── Query Params ──────────────────────────────────────────────────────────────
export interface EmployeesQueryParams {
  search?:   string;
  page?:     number;
  per_page?: number;
}

// ─── Form Values ───────────────────────────────────────────────────────────────
export interface AddEmployeeFormValues {
  employeeName: string;
  email:        string;
  paymentType:  string;
  jobTitle:     string;
  password:     string;
  hourlyRate:   string;
  currency:     string;
  company?:     string;
}

export interface EditEmployeeFormValues {
  employeeName: string;
  email:        string;
  paymentType:  string;
  jobTitle:     string;
  hourlyRate:   string;
  currency:     string;
  password?:    string;
  company?:     string;
}

// ─── API Response ──────────────────────────────────────────────────────────────
export interface EmployeesApiResponse {
  data: Employee[];
  meta: { total: number; current_page?: number; per_page?: number };
}