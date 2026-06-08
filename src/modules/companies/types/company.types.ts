export type CompanyPlan = "Basic" | "Pro" | "Enterprise";
export type CompanyStatus = "Active" | "Pending" | "Inactive";

export type Company = {
  id: number;
  logo: string | null;        // URL
  name: string;
  subdomain: string;          // e.g. "advanced-tech.workflow.com"
  plan: CompanyPlan;
  monthly_revenue: number;
  renewal_date: string;       // "YYYY-MM-DD"
  status: CompanyStatus;
};

export type AddCompanyRequest = {
  name: string;
  subdomain: string;
  email: string;
  plan: CompanyPlan;
  monthly_revenue?: number;
  renewal_date?: string;
  logo?: File | null;
};