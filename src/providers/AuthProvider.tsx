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
import { type User, normalizeUser } from "@/modules/auth/types/auth.types";

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
const USER_SCHEMA_KEY = "user_schema";
/**
 * Bumped when a fix changes how a cached user is derived. Sessions written by
 * an older version are dropped so the user is re-read from the API instead of
 * keeping a wrong value — v2 discards caches from before the role fix, which
 * stored every super admin as "company".
 */
const USER_SCHEMA_VERSION = "2";

function saveUser(u: User): void {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem(USER_SCHEMA_KEY, USER_SCHEMA_VERSION);
  } catch {
    // localStorage unavailable (e.g. private browsing quota)
  }
}

function loadUser(): User | null {
  try {
    if (localStorage.getItem(USER_SCHEMA_KEY) !== USER_SCHEMA_VERSION) {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(USER_SCHEMA_KEY);
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = normalizeUser(parsed);
    if (!normalized) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
    return normalized;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function clearUser(): void {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(USER_SCHEMA_KEY);
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
    const normalized = u ? normalizeUser(u) : null;
    setUserState(normalized);
    if (normalized) saveUser(normalized);
    else            clearUser();
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