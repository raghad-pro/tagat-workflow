import type { User, Role } from "@/modules/auth/types/auth.types";

export const getRolePrefix = (): string => {
  if (typeof window === "undefined") return ""; // fallback for SSR

  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return "";
    
    const user: User = JSON.parse(userStr);
    const role: Role = user.role;

    switch (role) {
      case "super_admin":
        return "/super_admin";
      case "company":
        return "/company";
      case "employee":
        return "/employee";
      case "client":
        return "/client";
      default:
        return "";
    }
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return "";
  }
};
