export interface Role {
  id: number;
  name: string;
  description: string;
  usersCount: number;
  type: "system" | "custom";
  createdAt: string;
}

export interface RoleStats {
  total: number;
  systemRoles: number;
  customRoles: number;
}

export interface RolesQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}
