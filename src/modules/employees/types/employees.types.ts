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
}

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
  total:      number;
  active:     number;
  onboarding: number;
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
  company:      string;
}

// ─── API Response ──────────────────────────────────────────────────────────────
export interface EmployeesApiResponse {
  data: Employee[];
  meta: { total: number; current_page?: number; per_page?: number };
}