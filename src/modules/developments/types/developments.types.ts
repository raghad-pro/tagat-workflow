// ─── Development entity (matches API response) ──────────────────────────────
export interface Development {
  id: number;
  project_id: number;
  client_id: number;
  currency_id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  cost: number;
  created_at: string;
  updated_at: string;
  // joined/computed fields (optional, returned by some endpoints)
  project?: string;
  client?: string;
}

// ─── Paginated API response ──────────────────────────────────────────────────
export interface ApiDevelopmentsResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Development[];
    last_page: number;
    total: number;
    per_page: number;
    from: number | null;
    to: number | null;
  };
}

// ─── Single item response ────────────────────────────────────────────────────
export interface ApiDevelopmentResponse {
  success: boolean;
  message?: string;
  data: Development;
}

// ─── Request bodies ──────────────────────────────────────────────────────────
export interface CreateDevelopmentRequest {
  project_id: number;
  client_id: number;
  currency_id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  cost: number;
}

export type UpdateDevelopmentRequest = Partial<CreateDevelopmentRequest>;

// ─── Query params ────────────────────────────────────────────────────────────
export interface DevelopmentsQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}
