import type { Wallet, Currency, Company } from "../types/wallets.types";

export const DUMMY_COMPANY: Company = {
  id: 1,
  name: "Mock Company",
  email: "contact@mockcompany.com",
  domain: "mockcompany.com",
  logo: null,
  database_options: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DUMMY_CURRENCIES: Currency[] = [
  {
    id: 1,
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    rate: "1.00",
    company_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    code: "EUR",
    name: "Euro",
    symbol: "€",
    rate: "0.92",
    company_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const DUMMY_WALLETS: Wallet[] = [
  {
    id: 1,
    name: "Main USD Wallet",
    company_id: 1,
    currency_id: 1,
    notes: "Primary wallet for operations",
    balance: "15400.50",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: DUMMY_CURRENCIES[0],
    company: DUMMY_COMPANY,
  },
  {
    id: 2,
    name: "European Client Reserve",
    company_id: 1,
    currency_id: 2,
    notes: "For EU invoices",
    balance: "4200.00",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    currency: DUMMY_CURRENCIES[1],
    company: DUMMY_COMPANY,
  },
];
