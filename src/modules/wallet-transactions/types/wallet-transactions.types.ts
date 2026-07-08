export interface WalletTransaction {
  id: number;
  transaction_number: string;
  company_id: number;
  wallet_id: number;
  amount: string;
  transaction_date: string;
  type: string; // e.g., "Income", "Funding", "Assets", "Expenses"
  notes?: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: number;
    name: string;
  };
  wallet?: {
    id: number;
    name: string;
    currency?: {
      code: string;
      symbol: string;
    };
  };
}

export interface WalletTransactionStats {
  totalVolume: number;
  income: number;
  expenses: number;
}

export interface WalletTransactionsQueryParams {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface AddTransactionRequest {
  company_id: number;
  wallet_id: number;
  amount: number;
  transaction_date: string;
  type: string;
  notes?: string;
}

export interface UpdateTransactionRequest extends Partial<AddTransactionRequest> {}

// Real API response shapes
export type ApiWalletTransactionsResponse = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: WalletTransaction[];
    total: number;
    per_page: number;
    last_page: number;
  };
};

export type ApiWalletTransactionResponse = {
  success: boolean;
  message: string;
  data: WalletTransaction;
};

// For dropdown options (if needed)
export type ApiTransactionDataResponse = {
  success: boolean;
  message: string;
  data: {
    companies: { id: number; name: string }[];
    wallets: { id: number; name: string }[];
  };
};
