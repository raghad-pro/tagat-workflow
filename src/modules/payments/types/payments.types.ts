export interface Payment {
  id: string | number;
  company_id?: number;
  invoice_id: number;
  wallet_id: number;
  employee_id: number;
  amount: number | string;
  payment_method: string;
  payment_date: string;
  notes?: string;
  exchange_rate?: number;
  invoice?: any;
  wallet?: any;
  employee?: any;
  company?: string;
  date?: string;
  method?: string;
}

export interface AddPaymentRequest {
  company_id?: number;
  invoice_id: number;
  wallet_id: number;
  employee_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
  exchange_rate?: number;
}

export interface UpdatePaymentRequest extends Partial<AddPaymentRequest> {}
