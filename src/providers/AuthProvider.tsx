"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { tokenService } from "@/services/tokenServices";
import type { User } from "@/modules/auth/types/auth.types";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user:            User | null;
  setUser:         (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading:       boolean;
  logout:          () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType>({
  user:            null,
  setUser:         () => {},
  isAuthenticated: false,
  isLoading:       true,
  logout:          () => {},
});

// ─── Storage helpers ───────────────────────────────────────────────────────────
const USER_KEY = "user";

function saveUser(u: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  } catch {
    // localStorage unavailable (e.g. private browsing quota)
  }
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    
    // Fallback to role_id if role is missing
    if (!parsed.role && parsed.role_id) {
      import("@/modules/auth/types/auth.types").then(({ ROLE_MAP }) => {
        // we can't do async inside synchronous loadUser easily, so let's just do a static map
      });
    }

    // Since we need to be sync, let's just define the map or import it at the top
    const localRoleMap: Record<number, string> = {
      1: "super_admin",
      2: "company",
      3: "employee",
      4: "client",
    };

    if (!parsed.role && parsed.role_id) {
      parsed.role = localRoleMap[parsed.role_id] as any;
    }

    if (parsed.role === ("company_admin" as any)) {
      parsed.role = "company";
    }

    // Basic sanity check — must have id, email, and a valid role
    const validRoles = ["super_admin", "company", "employee", "client"];
    if (!parsed?.id || !parsed?.email || !validRoles.includes(parsed?.role)) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Bootstrap: load user from localStorage on mount ──────────────────────────
  useEffect(() => {
    if (!tokenService.hasToken()) {
      setIsLoading(false);
      return;
    }

    const saved = loadUser();
    if (saved) {
      setUserState(saved);
    } else {
      // Token exists but user data is invalid — clear everything
      tokenService.removeToken();
    }

    setIsLoading(false);
  }, []);

  // ── setUser — persists to localStorage ───────────────────────────────────────
  const setUser = useCallback((u: User | null) => {
    if (u) {
      const localRoleMap: Record<number, string> = {
        1: "super_admin",
        2: "company",
        3: "employee",
        4: "client",
      };

      if (!u.role && u.role_id) {
        u.role = localRoleMap[u.role_id] as any;
      }

      if (u.role === ("company_admin" as any)) {
        u.role = "company";
      }
    }
    
    setUserState(u);
    if (u) saveUser(u);
    else    clearUser();
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    queryClient.clear();
    tokenService.removeToken();
    setUser(null);
    router.replace("/login");
  }, [setUser, router, queryClient]);

  // ── Listen for 401 from axios interceptor ────────────────────────────────────
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated: !!user,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);