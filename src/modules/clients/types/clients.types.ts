// ─── Raw API Types (as returned from backend) ─────────────────────────────────
export type ApiClientCompany = {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  pivot: {
    client_id: number;
    company_id: number;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    updated_at: string;
  };
};

export type ApiClientUser = {
  id: number;
  name: string;
  email: string;
  role_id: number;
  is_active: number;
  image: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiClient = {
  id: number;
  name: string;
  credit_limit: number | null;
  joined_at: string | null;
  is_primary: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  companies: ApiClientCompany[];
  user: ApiClientUser;
};

export type ApiClientsResponse = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: ApiClient[];
    total: number;
    per_page: number;
    last_page: number;
    from: number;
    to: number;
  };
};

// ─── Normalized Client (used in UI) ───────────────────────────────────────────
export type ClientStatus = "active" | "pending" | "suspended";

export type ClientCompany = {
  id: number;
  name: string;
  status: "pending" | "approved" | "rejected";
};

export type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  companies: ClientCompany[];
  /** primary company name for display */
  company: string | null;
  contractValue: number;
  status: ClientStatus;
  isActive: boolean;
  joinedAt: string | null;
  createdAt: string;
};

// ─── Stats ────────────────────────────────────────────────────────────────────
export type ClientStats = {
  total: number;
  active: number;
  suspended: number;
  newRequests: number;
};

// ─── Query Params ─────────────────────────────────────────────────────────────
export type ClientsQueryParams = {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
};

// ─── Requests ─────────────────────────────────────────────────────────────────
export type AddClientFormValues = {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  company_id?: number | null;
};

export type AddClientRequest = {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  company_id?: number | null;
};

export type UpdateClientStatusRequest = {
  company_id: number;
  status: "approved" | "rejected" | "pending";
};

export type DeleteClientRequest = {
  company_id: number;
};

// ─── Responses ────────────────────────────────────────────────────────────────
export type ClientsMeta = {
  total: number;
  page: number;
  per_page: number;
};

export type ClientsResponse = {
  data: Client[];
  meta: ClientsMeta;
};