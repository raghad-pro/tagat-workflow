export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: string;
  amount: string;
  exchange_rate: string | null;
  description: string | null;
  related_wallet_id: number | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  wallet?: {
    id: number;
    name: string;
    company_id: number;
    currency_id: number;
    notes?: string | null;
    balance?: string;
    created_at?: string;
    updated_at?: string;
    company?: {
      id: number;
      name: string;
    };
    currency?: {
      id: number;
      name: string;
      code?: string;
      symbol?: string;
    };
  };
  related_wallet?: any | null;
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
  wallet_id: number;
  amount: number;
  transaction_date: string;
  type: string;
  description?: string;
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
