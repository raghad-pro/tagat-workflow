import type {
  JoinRequest,
  JoinRequestClient,
  JoinRequestStats,
  JoinRequestsQueryParams,
} from "@/modules/company-requests/types/company-requests.types";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
// Fix: use const (ESLint prefer-const) + mutable via reference
const MOCK_DB: JoinRequestClient[] = [
  {
    id: 1, name: "Ahmed Mohamed Al-Saeed", credit_limit: null, user_id: 10,
    created_at: "2026-06-08T00:00:00.000Z", updated_at: "2026-06-08T00:00:00.000Z",
    companies: [
      { id: 2, name: "Tech Company",         email: "tech@test.com",        domain: "tech.localhost",        logo: null,
        pivot: { client_id: 1, company_id: 2, status: "pending",  created_at: "2026-06-08T06:00:00.000Z", updated_at: "2026-06-08T06:00:00.000Z" } },
      { id: 3, name: "Innovative Solutions", email: "inno@test.com",        domain: "inno.localhost",        logo: null,
        pivot: { client_id: 1, company_id: 3, status: "approved", created_at: "2026-06-07T06:00:00.000Z", updated_at: "2026-06-08T06:00:00.000Z" } },
    ],
  },
  {
    id: 2, name: "Sara Jones", credit_limit: null, user_id: 11,
    created_at: "2026-06-07T00:00:00.000Z", updated_at: "2026-06-07T00:00:00.000Z",
    companies: [
      { id: 1, name: "Gaza Company",         email: "gaza@test.com",        domain: "gaza.localhost",        logo: null,
        pivot: { client_id: 2, company_id: 1, status: "pending",  created_at: "2026-06-07T06:00:00.000Z", updated_at: "2026-06-07T06:00:00.000Z" } },
    ],
  },
  {
    id: 3, name: "Carlos Rivera", credit_limit: null, user_id: 12,
    created_at: "2026-06-05T00:00:00.000Z", updated_at: "2026-06-05T00:00:00.000Z",
    companies: [
      { id: 4, name: "Green Energy Partners", email: "green@test.com",      domain: "green.localhost",       logo: null,
        pivot: { client_id: 3, company_id: 4, status: "rejected", created_at: "2026-06-05T06:00:00.000Z", updated_at: "2026-06-06T06:00:00.000Z" } },
      { id: 2, name: "Tech Company",          email: "tech@test.com",       domain: "tech.localhost",        logo: null,
        pivot: { client_id: 3, company_id: 2, status: "pending",  created_at: "2026-06-05T06:00:00.000Z", updated_at: "2026-06-05T06:00:00.000Z" } },
    ],
  },
  {
    id: 4, name: "Fatimah Al-Harbi", credit_limit: null, user_id: 13,
    created_at: "2026-06-04T00:00:00.000Z", updated_at: "2026-06-04T00:00:00.000Z",
    companies: [
      { id: 3, name: "Innovative Solutions", email: "inno@test.com",        domain: "inno.localhost",        logo: null,
        pivot: { client_id: 4, company_id: 3, status: "approved", created_at: "2026-06-04T06:00:00.000Z", updated_at: "2026-06-04T06:00:00.000Z" } },
    ],
  },
  {
    id: 5, name: "Liu Wei", credit_limit: null, user_id: 14,
    created_at: "2026-06-03T00:00:00.000Z", updated_at: "2026-06-03T00:00:00.000Z",
    companies: [
      { id: 1, name: "Gaza Company",         email: "gaza@test.com",        domain: "gaza.localhost",        logo: null,
        pivot: { client_id: 5, company_id: 1, status: "pending",  created_at: "2026-06-03T06:00:00.000Z", updated_at: "2026-06-03T06:00:00.000Z" } },
      { id: 4, name: "Green Energy Partners", email: "green@test.com",      domain: "green.localhost",       logo: null,
        pivot: { client_id: 5, company_id: 4, status: "rejected", created_at: "2026-06-03T06:00:00.000Z", updated_at: "2026-06-03T06:00:00.000Z" } },
    ],
  },
];

const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

// ─── Helper: flatten clients → rows ──────────────────────────────────────────
function flattenToRows(clients: JoinRequestClient[]): JoinRequest[] {
  const rows: JoinRequest[] = [];
  for (const client of clients) {
    for (const company of client.companies) {
      rows.push({
        id:           `${client.id}-${company.id}`,
        clientId:     client.id,
        companyId:    company.id,
        clientName:   client.name,
        companyName:  company.name,
        companyEmail: company.email,
        status:       company.pivot.status,
        createdAt:    company.pivot.created_at,
      });
    }
  }
  return rows;
}

// ─── Mock functions ───────────────────────────────────────────────────────────
export async function mockGetJoinRequests(
  params: JoinRequestsQueryParams = {}
): Promise<any> {
  await delay();
  const { search = "", status = "all", page = 1, per_page = 4 } = params;
  const q = search.trim().toLowerCase();

  // Flatten then filter
  const allRows = flattenToRows(MOCK_DB);
  const filtered = allRows.filter((r) => {
    const matchSearch =
      !q ||
      r.clientName.toLowerCase().includes(q) ||
      r.companyName.toLowerCase().includes(q) ||
      r.companyEmail.toLowerCase().includes(q);
    const matchStatus = status === "all" || r.status === status;
    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const start = (page - 1) * per_page;
  const data  = filtered.slice(start, start + per_page);
  return { data, meta: { total, page, per_page } };
}

export async function mockGetJoinRequestStats(): Promise<JoinRequestStats> {
  await delay(250);
  const allRows = flattenToRows(MOCK_DB);
  return {
    total:    allRows.length,
    pending:  allRows.filter((r) => r.status === "pending").length,
    approved: allRows.filter((r) => r.status === "approved").length,
    rejected: allRows.filter((r) => r.status === "rejected").length,
  };
}

export async function mockApproveJoinRequest(
  clientId: number,
  companyId: number
): Promise<void> {
  await delay(300);
  const client = MOCK_DB.find((c) => c.id === clientId);
  if (!client) return;
  const company = client.companies.find((co) => co.id === companyId);
  if (company) company.pivot.status = "approved";
}

export async function mockRejectJoinRequest(
  clientId: number,
  companyId: number
): Promise<void> {
  await delay(300);
  const client = MOCK_DB.find((c) => c.id === clientId);
  if (!client) return;
  const company = client.companies.find((co) => co.id === companyId);
  if (company) company.pivot.status = "rejected";
}