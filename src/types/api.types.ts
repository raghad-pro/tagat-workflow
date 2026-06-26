export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: number;
  project_id: number;
  assigned_to?: number;
  title: string;
  description: string;
  status: TaskStatus;
  task_date: string;
  start_time: string;
  end_time: string;
}

export type TimesheetStatus = "all" | "pending" | "approved" | "rejected";

export interface Timesheet {
  id: number;
  month: string;
  status: TimesheetStatus;
  // Other timesheet fields...
}

export type InvoiceStatus = "unpaid" | "paid";

export interface Invoice {
  id: number;
  company_id?: number;
  client_id: number;
  project_id: number;
  currency_id: number;
  invoice_date: string;
  due_date: string;
  amount: number;
  status: InvoiceStatus;
}

export type PaymentMethod = "cash" | "bank_transfer" | "card" | "online" | "stripe";

export interface Payment {
  id: number;
  company_id?: number;
  invoice_id: number;
  wallet_id: number;
  employee_id?: number | null;
  amount: number;
  exchange_rate: number;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string;
}

export interface ProjectData {
  currency: any;
  budget: number;
  paid: number;
  remaining: number;
}

export interface CompanyData {
  clients: any[];
  projects: any[];
  currencies: any[];
}
