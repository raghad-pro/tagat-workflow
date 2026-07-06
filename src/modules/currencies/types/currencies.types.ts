export interface CurrencyCompany {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  database_options: any | null;
  created_at: string;
  updated_at: string;
}

export interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  rate: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  company?: CurrencyCompany;
}

export interface CurrencyRequest {
  name: string;
  code: string;
  symbol: string;
  company_id?: number;
}
