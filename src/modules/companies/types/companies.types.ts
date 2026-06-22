// modules/companies/types/companies.types.ts

export type CompanyStatus = "active" | "pending" | "suspended";
export type CompanyPlan   = "basic" | "pro" | "enterprise";

export interface Company {
  id:         number;
  name:       string;
  email:      string;
  domain:     string;
  plan:       CompanyPlan;
  status:     CompanyStatus;
  joinedDate: string;   // ISO date string  "2023-10-15"
  logo?:      string;
}

export interface CompanyStats {
  total:    number;
  active:   number;
  pending:  number;
  inactive: number;
}

export interface CompaniesQueryParams {
  search?:   string;
  plan?:     CompanyPlan | "all";
  status?:   CompanyStatus | "all";
  page?:     number;
  per_page?: number;
}

export interface CompaniesResponse {
  data: Company[];
  meta: {
    total:        number;
    current_page: number;
    per_page:     number;
    last_page:    number;
  };
}

export interface AddCompanyRequest {
  name:        string;
  email:       string;
  domain:      string;
  fieldOfWork: string;
  logo?:       File | null;
}