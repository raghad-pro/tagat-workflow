import type { Role } from "@/modules/auth/types/auth.types";

export const ROLE_PREFIX_MAP: Record<Role, string> = {
  super_admin:   "/super_admin",
  company: "/company",
  employee:      "/employee",
  client:        "/client",
};

export const getRolePrefix = (role: string): string =>
  ROLE_PREFIX_MAP[role as Role] ?? "";