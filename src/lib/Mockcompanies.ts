import type {
  Company,
  CompanyStats,
  CompaniesResponse,
  CompaniesQueryParams,
  AddCompanyRequest,
} from "@/modules/companies/types/companies.types";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
// TODO: شيل هذا الملف بالكامل لما IS_MOCK = false
let MOCK_COMPANIES_DB: Company[] = [
  { id: 1, name: "Advanced Tech Company",   domain: "advanced-tech.workflow.com",    plan: "enterprise", email: "info@advanced.com", joinedDate: "2023-10-15", status: "active"   },
  { id: 2, name: "Green Energy Solutions",  domain: "greenenergy.workflow.com",      plan: "basic",      email: "hello@green.com",   joinedDate: "2023-11-02", status: "active"   },
  { id: 3, name: "Health Innovations Inc.", domain: "healthinnovations.workflow.com",plan: "enterprise", email: "contact@health.com",joinedDate: "2023-11-05", status: "pending"  },
  { id: 4, name: "Creative Minds Studio",   domain: "creativeminds.workflow.com",    plan: "pro",        email: "studio@creative.com",joinedDate:"2023-11-07", status: "active"   },
  { id: 5, name: "Urban Logistics",         domain: "urbanlogistics.workflow.com",   plan: "basic",      email: "logistics@urban.com",joinedDate:"2023-11-06", status: "pending"  },
  { id: 6, name: "EduNext Learning",        domain: "edunext.workflow.com",          plan: "basic",      email: "learn@edunext.com", joinedDate: "2023-10-20", status: "active"   },
  { id: 7, name: "NextGen Software Ltd.",   domain: "nextgen.workflow.com",          plan: "pro",        email: "dev@nextgen.com",   joinedDate: "2023-10-22", status: "active"   },
  { id: 8, name: "Visionary Digital Group", domain: "visionary.workflow.com",        plan: "enterprise", email: "vision@digital.com",joinedDate: "2023-09-15", status: "pending"  },
  { id: 9, name: "Bright Futures Academy",  domain: "brightfutures.workflow.com",    plan: "basic",      email: "academy@bright.com",joinedDate: "2023-10-01", status: "active"   },
];

export const MOCK_COMPANY_STATS: CompanyStats = {
  total:    9,
  active:   6,
  pending:  3,
  inactive: 0,
};

// ─── Simulated network latency ────────────────────────────────────────────────
const delay = (ms = 500) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// ─── Get All (search + filter + pagination) ───────────────────────────────────
export async function mockGetCompanies(
  params: CompaniesQueryParams = {}
): Promise<CompaniesResponse> {
  await delay();

  const { search = "", plan = "all", status = "all", page = 1, per_page = 7 } = params;
  const q = search.trim().toLowerCase();

  const filtered = MOCK_COMPANIES_DB.filter((c) => {
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.domain.toLowerCase().includes(q);

    const matchPlan   = plan   === "all" || c.plan   === plan;
    const matchStatus = status === "all" || c.status === status;

    return matchSearch && matchPlan && matchStatus;
  });

  const total = filtered.length;
  const start = (page - 1) * per_page;
  const data  = filtered.slice(start, start + per_page);

  return { data, meta: { total, current_page: page, per_page, last_page: Math.ceil(total / per_page) } };
}

// ─── Get Stats ────────────────────────────────────────────────────────────────
export async function mockGetCompanyStats(): Promise<CompanyStats> {
  await delay(300);
  return {
    total:    MOCK_COMPANIES_DB.length,
    active:   MOCK_COMPANIES_DB.filter((c) => c.status === "active").length,
    pending:  MOCK_COMPANIES_DB.filter((c) => c.status === "pending").length,
    inactive: MOCK_COMPANIES_DB.filter((c) => c.status === "suspended").length,
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────
export async function mockCreateCompany(data: AddCompanyRequest): Promise<Company> {
  await delay();

  const newCompany: Company = {
    id:              Date.now(),
    logo:            data.logo ? URL.createObjectURL(data.logo) : undefined,
    name:            data.name,
    domain:          data.domain,
    email:           data.email,
    plan:            "basic",
    status:          "active",
    joinedDate:      new Date().toISOString(),
  };

  MOCK_COMPANIES_DB = [newCompany, ...MOCK_COMPANIES_DB];
  return newCompany;
}

// ─── Delete ───────────────────────────────────────────────────────────────────
export async function mockDeleteCompany(id: number): Promise<void> {
  await delay(300);
  MOCK_COMPANIES_DB = MOCK_COMPANIES_DB.filter((c) => c.id !== id);
}

// ─── Update ───────────────────────────────────────────────────────────────────
export async function mockUpdateCompany(
  id: number,
  data: Partial<AddCompanyRequest>
): Promise<Company> {
  await delay();

  const idx = MOCK_COMPANIES_DB.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("company_not_found");

  const company = MOCK_COMPANIES_DB[idx];

  if (data.name) company.name = data.name;
  if (data.email) company.email = data.email;
  if (data.domain) company.domain = data.domain;
  if (data.logo) company.logo = URL.createObjectURL(data.logo);

  MOCK_COMPANIES_DB[idx] = company;

  return company;
}