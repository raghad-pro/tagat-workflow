/**
 * Returns the API route prefix based on the user's role.
 * Used across all API modules to avoid repetition.
 */

import type { Role } from "@/modules/auth/types/auth.types";

const ROLE_PREFIX_MAP: Record<Role, string> = {
  super_admin:   "/super_admin",
  company_admin: "/company",
  employee:      "/employee",
  client:        "/client",
};

export const getRolePrefix = (role: string): string => {
  return ROLE_PREFIX_MAP[role as Role] ?? "";
};