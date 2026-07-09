export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: string;
  company_id: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  database_options: any;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: number;
  name: string;
  company_id: number;
  currency_id: number;
  notes: string | null;
  balance: string;
  created_at: string;
  updated_at: string;
  currency: Currency;
  company: Company;
}

export interface WalletStats {
  totalBalance: number;
  avgBalance: number;
  totalWallets: number;
  pendingWallets: number; // Keep this if we have status locally, otherwise remove
}

export interface WalletsQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AddWalletRequest {
  name: string;
  company_id: number;
  currency_id: number;
  balance: number;
  notes?: string;
}

export interface UpdateWalletRequest extends Partial<AddWalletRequest> {}

// Raw API response shapes
export type ApiWalletsResponse = {
  success: boolean;
  data: {
    current_page: number;
    data: Wallet[];
    total: number;
    per_page: number;
    last_page: number;
  };
};

export type ApiWalletResponse = {
  success: boolean;
  data: Wallet;
};

export type ApiCompanyCurrenciesResponse = {
  success: boolean;
  data: Currency[];
};
