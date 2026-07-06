// ─── Real API Response Shape ──────────────────────────────────────────────────
// GET /api/v1/super_admin/requests  OR  /api/v1/company/requests
// {
//   role: "super_admin" | "company",
//   data: [
//     {
//       id: 4,                   // client_id
//       name: "client3",
//       user_id: 9,
//       companies: [
//         {
//           id: 2,
//           name: "Tech Company",
//           email: "company@test.com",
//           pivot: {
//             client_id: 4,
//             company_id: 2,
//             status: "pending" | "approved" | "rejected",
//           }
//         }
//       ]
//     }
//   ]
// }

// ─── Role ─────────────────────────────────────────────────────────────────────
export type JoinRequestRole = "super_admin" | "company";

// ─── Pivot status (from backend) ──────────────────────────────────────────────
export type JoinRequestStatus = "pending" | "approved" | "rejected";

// ─── Company with pivot ───────────────────────────────────────────────────────
export interface JoinRequestCompany {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  pivot: {
    client_id: number;
    company_id: number;
    status: JoinRequestStatus;
    created_at: string;
    updated_at: string;
  };
}

// ─── Raw client entity from API ───────────────────────────────────────────────
export interface JoinRequestClient {
  id: number;          // client_id
  name: string;
  credit_limit: number | null;
  user_id: number;
  created_at: string;
  updated_at: string;
  companies: JoinRequestCompany[];
}

// ─── Flattened row (client × company) — used in the table ────────────────────
// Each row = one join request = one client ↔ company relationship
export interface JoinRequest {
  id: string;           // `${client_id}-${company_id}` — unique key
  clientId: number;
  companyId: number;
  clientName: string;
  companyName: string;
  companyEmail: string;
  status: JoinRequestStatus;
  createdAt: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface JoinRequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface JoinRequestsQueryParams {
  search?: string;
  status?: JoinRequestStatus | "all";
  page?: number;
  per_page?: number;
}

// ─── Raw API Response ─────────────────────────────────────────────────────────
export interface JoinRequestsApiResponse {
  role: JoinRequestRole;   // typed بدل string
  data: JoinRequestClient[];
}

// ─── Resolved query result (ما بيرجعه useJoinRequests) ───────────────────────
export interface JoinRequestsQueryResult {
  role: JoinRequestRole;
  rows: JoinRequest[];
  raw: JoinRequestClient[];
}

// ─── Approve / Reject params (ما بيستخدمه useApproveJoinRequest / useRejectJoinRequest) ──
export interface ApproveRejectParams {
  role: JoinRequestRole;
  clientId: number;
  companyId: number;
}

// ─── map JoinRequestStatus → GenericStatus ───────────────────────────────────
export const JOIN_REQUEST_STATUS_MAP: Record<
  JoinRequestStatus,
  "pending" | "active" | "rejected"
> = {
  pending:  "pending",
  approved: "active",
  rejected: "rejected",
};

// ─── Removed (no longer used) ─────────────────────────────────────────────────
// JoinRequestsMeta      → pagination صار server-side عبر QueryParams
// JoinRequestsResponse  → استُبدلت بـ JoinRequestsQueryResult
// ApproveRejectRequest  → استُبدلت بـ ApproveRejectParams (أضافت role)