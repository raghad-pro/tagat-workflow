import type {
  Client,
  ClientStats,
  ClientsResponse,
  ClientsQueryParams,
  AddClientRequest,
} from "@/modules/clients/types/clients.types";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
// TODO: نشيل هذا الملف بالكامل لما الباك إند الحقيقي يكون جاهز (ENV.IS_MOCK = false)
let MOCK_CLIENTS_DB: Client[] = [
  { id: 1, name: "Ahmed Mohamed Al-Saeed", email: "ahmed@example.com",   phone: "+966 50 123 4567", company: "Advanced Technology Company", contractValue: 50000,  status: "active", companies: [], isActive: true, joinedAt: "2023-01-01", createdAt: "2023-01-01" },
  { id: 2, name: "Fatimah Al-Harbi",       email: "fatimah@example.com", phone: "+966 55 987 8543", company: "Innovative Solutions Inc.",   contractValue: 75000,  status: "pending", companies: [], isActive: false, joinedAt: null, createdAt: "2023-02-15" },
  { id: 3, name: "Khalid bin Faisal",      email: "khalid@example.com",  phone: "+966 53 321 7654", company: "Global Tech Ventures",        contractValue: 120000, status: "active", companies: [], isActive: true, joinedAt: "2023-03-10", createdAt: "2023-03-10" },
  { id: 4, name: "Sara Al-Qahtani",        email: "sara@example.com",    phone: "+966 54 654 9876", company: "NextGen Software Ltd.",       contractValue: 95000,  status: "pending", companies: [], isActive: false, joinedAt: null, createdAt: "2023-04-20" },
  { id: 5, name: "Omar Al-Farqi",          email: "omar@example.com",    phone: "+966 56 789 1234", company: "Visionary Digital Group",     contractValue: 110000, status: "active", companies: [], isActive: true, joinedAt: "2023-05-05", createdAt: "2023-05-05" },
  { id: 6, name: "Nour Al-Rashid",         email: "nour@example.com",    phone: "+966 57 321 8765", company: "Advanced Technology Company", contractValue: 45000,  status: "suspended", companies: [], isActive: false, joinedAt: "2023-06-12", createdAt: "2023-06-12" },
  { id: 7, name: "Yousef Al-Ahmad",        email: "yousef@example.com",  phone: "+966 58 456 1230", company: null,                          contractValue: 30000,  status: "active", companies: [], isActive: true, joinedAt: "2023-07-22", createdAt: "2023-07-22" },
  { id: 8, name: "Hana Al-Zahrawi",        email: "hana@example.com",    phone: "+966 59 789 4560", company: "Innovative Solutions Inc.",   contractValue: 88000,  status: "suspended", companies: [], isActive: false, joinedAt: "2023-08-30", createdAt: "2023-08-30" },
];

export const MOCK_CLIENT_STATS: ClientStats = {
  total: 1847,
  active: 459,
  suspended: 367,
  newRequests: 15,
};

// ─── محاكاة latency الشبكة (عشان الـ skeleton يظهر بشكل طبيعي) ────────────────
const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Get all (بحث + فلتر + pagination) ────────────────────────────────────────
export async function mockGetClients(
  params: ClientsQueryParams = {}
): Promise<ClientsResponse> {
  await delay();

  const { search = "", status = "all", page = 1, per_page = 5 } = params;
  const q = search.trim().toLowerCase();

  const filtered = MOCK_CLIENTS_DB.filter((c) => {
    const matchSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.company?.toLowerCase().includes(q) ?? false);

    const matchStatus = status === "all" || c.status === status;

    return matchSearch && matchStatus;
  });

  const total = filtered.length;
  const start = (page - 1) * per_page;
  const data = filtered.slice(start, start + per_page);

  return { data, meta: { total, page, per_page } };
}

// ─── Get stats ──────────────────────────────────────────────────────────────────
export async function mockGetClientStats(): Promise<ClientStats> {
  await delay(300);
  return MOCK_CLIENT_STATS;
}

// ─── Create ──────────────────────────────────────────────────────────────────────
export async function mockCreateClient(data: AddClientRequest): Promise<Client> {
  await delay();

  const newClient: Client = {
    id: Date.now(),
    name: data.name,
    email: data.email,
    phone: "—",
    company: (data as any).company || null,
    contractValue: 0,
    status: "pending",
    companies: [],
    isActive: false,
    joinedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  MOCK_CLIENTS_DB = [newClient, ...MOCK_CLIENTS_DB];
  return newClient;
}

// ─── Delete ──────────────────────────────────────────────────────────────────────
export async function mockDeleteClient(id: number): Promise<void> {
  await delay(300);
  MOCK_CLIENTS_DB = MOCK_CLIENTS_DB.filter((c) => c.id !== id);
}
