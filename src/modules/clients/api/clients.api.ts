import apiClient from "@/services/apiClient";
import type {
  ApiClientsResponse,
  ApiClient,
  ClientsQueryParams,
  AddClientRequest,
  UpdateClientStatusRequest,
  DeleteClientRequest,
} from "../types/clients.types";

// ─── helpers ──────────────────────────────────────────────────────────────────
// الـ role بيجي من useAuth — نمرره من الـ hook
type Role = "super_admin" | "company_admin" | string;

const base = (role: Role) =>
  role === "super_admin" ? "/super_admin/clients" : "/company/clients";

export const clientApi = {
  // ─── GET clients ──────────────────────────────────────────────────────────
  getAll: (params?: ClientsQueryParams, role: Role = "super_admin") =>
    apiClient.get<ApiClientsResponse>(base(role), params as Record<string, unknown>),

  // ─── POST create ──────────────────────────────────────────────────────────
  // super_admin: POST /super_admin/clients  { name, email, password, company_id }
  // company:     POST /company/clients      { name, email, password }
create: (data: AddClientRequest, role: Role = "super_admin") => {
  const body =
    role === "company_admin"
      ? { name: data.name, email: data.email, password: data.password, password_confirmation: data.password }
      : {
          name:     data.name,
          email:    data.email,
          password: data.password,
          password_confirmation: data.password,
          // company_id فقط لو موجود — ما نبعثه undefined
          ...(data.company_id != null && { company_id: data.company_id }),
        };
  return apiClient.post<{ success: boolean; message: string; data: ApiClient }>(
    base(role),
    body
  );
},

  // ─── PUT update status ────────────────────────────────────────────────────
  // super_admin: PUT /super_admin/clients/:id  { company_id, status }
  // company:     PUT /company/clients/:id      { status }
  updateStatus: (id: number, data: UpdateClientStatusRequest, role: Role = "super_admin") =>
    apiClient.put<{ success: boolean; message: string; data: unknown }>(
      `${base(role)}/${id}`,
      role === "company_admin" ? { status: data.status } : data
    ),

  // ─── DELETE ───────────────────────────────────────────────────────────────
  // super_admin: DELETE /super_admin/clients/:id  body: { company_id }
  // company:     DELETE /company/clients/:id      body: { company_id } (نفس الـ pattern)
  delete: (id: number, data: DeleteClientRequest, role: Role = "super_admin") =>
    apiClient.delete<{ success: boolean; message: string }>(
      `${base(role)}/${id}`,
      data
    ),
};