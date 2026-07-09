export type PaymentMethod = "cash" | "Stripe" | "PayPal" | "Credit Card" | "Bank Transfer" | string;

export interface Payment {
  id: number;
  company_id: number;
  invoice_id: number;
  wallet_id: number;
  employee_id: number;
  amount: string;
  exchange_rate: string;
  payment_method: PaymentMethod;
  payment_date: string;
  notes?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
  
  invoice?: {
    id: number;
    company_id: number;
    client_id: number;
    project_id: number;
    currency_id: number;
    invoice_date: string;
    due_date: string;
    amount: string;
    status: string;
    client?: {
      id: number;
      name: string;
    };
    company?: {
      id: number;
      name: string;
    };
  };
  wallet?: {
    id: number;
    name: string;
    currency?: {
      code: string;
      symbol: string;
    }
  };
  employee?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
    }
  };
}

export interface PaymentStats {
  totalRevenue: number;
  pendingPayments: number;
  transactionVolume: number;
}

export interface PaymentsQueryParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export interface AddPaymentRequest {
  company_id: number;
  invoice_id: number;
  wallet_id: number;
  employee_id: number;
  amount: number;
  exchange_rate: number;
  payment_method: string;
  payment_date: string;
  notes?: string;
}

export interface UpdatePaymentRequest extends Partial<AddPaymentRequest> {}

// Real API response shapes
export type ApiPaymentsResponse = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Payment[];
    total: number;
    per_page: number;
    last_page: number;
  };
};

export type ApiPaymentResponse = {
  success: boolean;
  message: string;
  data: Payment;
};

export type ApiPaymentDataResponse = {
  success: boolean;
  message: string;
  data: {
    invoices: {
      id: number;
      code: string;
      amount: string;
      client_name: string;
      currency: string;
    }[];
    wallets: {
      id: number;
      name: string;
    }[];
    employees: {
      id: number;
      user: {
        name: string;
      };
    }[];
  };
};
