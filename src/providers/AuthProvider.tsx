"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { tokenService } from "@/services/tokenServices";
import { type User, normalizeUser } from "@/modules/auth/types/auth.types";
import { authApi } from "@/modules/auth/api/auth.api";

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
 * keeping a wrong value — v2 discarded caches from before the role fix, which
 * stored every super admin as "company"; v3 adds `role_ids`/`permissions`,
 * absent from anything written earlier.
 */
const USER_SCHEMA_VERSION = "3";

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

/**
 * Re-reads the account from the server and returns its current roles and the
 * permissions those roles grant.
 *
 * `GET /{role}/account` answers with `roles[]`, each carrying its own
 * `permissions[]`, so one request covers both. Reading the **roles** back
 * matters as much as the permissions: a role granted after sign-in is not in
 * the login response at all, so deriving access from the cached role ids would
 * keep missing it no matter how often the permissions were refreshed.
 *
 * Returns `undefined` when the account could not be read. That is deliberately
 * distinct from `[]`: an empty array means "this account may do nothing", and
 * handing that back after a network blip would lock someone out of an app the
 * server would happily have served them.
 */
async function fetchAccess(
  user: User
): Promise<{ roleIds: number[]; permissions: string[] } | undefined> {
  try {
    const account = await authApi.me(user.role);
    const roles = Array.isArray(account?.roles) ? account.roles : null;
    if (!roles) return undefined;

    const roleIds: number[] = [];
    const names = new Set<string>();

    for (const role of roles) {
      const id = Number(role?.id);
      if (Number.isFinite(id)) roleIds.push(id);
      for (const permission of role?.permissions ?? []) {
        if (permission?.name) names.add(permission.name);
      }
    }

    return { roleIds, permissions: Array.from(names) };
  } catch {
    return undefined;
  }
}

/** Compare the two fields a refresh can change, order-insensitively. */
function sameAccess(a: User, b: User): boolean {
  const same = (x: (string | number)[] = [], y: (string | number)[] = []) =>
    x.length === y.length &&
    [...x].map(String).sort().join("|") === [...y].map(String).sort().join("|");
  return same(a.role_ids, b.role_ids) && same(a.permissions, b.permissions);
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  /** Lets async work read the live user without re-running on every change. */
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  /**
   * Refreshes the account's roles and permissions in the background, then
   * re-persists the user.
   *
   * Runs on **every** app load, not just when nothing is cached. Roles are
   * granted by an administrator on a different machine, so the only way the
   * change reaches this browser is by asking the server again; the earlier
   * version skipped the request whenever a permission list already existed,
   * which meant a newly assigned role never took effect until the user logged
   * out and back in.
   *
   * Never blocks rendering: the app stays usable while this is in flight, and
   * an unresolved user is treated as unrestricted, so the worst case is a
   * moment where a control is visible that the server would refuse.
   */
  const refreshAccess = useCallback(async (candidate: User) => {
    const access = await fetchAccess(candidate);
    if (!access) return;

    // Guard against a stale response landing after a logout or a re-login.
    const current = userRef.current;
    if (!current || current.id !== candidate.id) return;

    const next: User = {
      ...current,
      role_ids: access.roleIds.length ? access.roleIds : current.role_ids,
      permissions: access.permissions,
    };

    // Nothing changed — skip the write so the user object keeps its identity
    // and dependent effects do not re-run on every refresh.
    if (sameAccess(current, next)) return;

    setUserState(next);
    saveUser(next);
  }, []);

  // ── Bootstrap: load user from localStorage on mount ──────────────────────────
  useEffect(() => {
    if (!tokenService.hasToken()) {
      setIsLoading(false);
      return;
    }

    const saved = loadUser();
    if (saved) {
      setUserState(saved);
      void refreshAccess(saved);
    } else {
      // Token exists but user data is invalid — clear everything
      tokenService.removeToken();
    }

    setIsLoading(false);
  }, [refreshAccess]);

  // ── setUser — persists to localStorage ───────────────────────────────────────
  const setUser = useCallback((u: User | null) => {
    const normalized = u ? normalizeUser(u) : null;
    setUserState(normalized);
    if (normalized) {
      saveUser(normalized);
      void refreshAccess(normalized);
    } else {
      clearUser();
    }
  }, [refreshAccess]);

  /**
   * Pick up a role change without waiting for a reload.
   *
   * An administrator grants the role on their own machine, so this browser has
   * no way to hear about it. Re-checking when the tab comes back to the
   * foreground closes the gap to roughly "switch away and back" instead of
   * "reload the page", which is what someone does anyway after being told
   * their access changed.
   *
   * Throttled: tab switching is frequent, and this only needs to be eventually
   * fresh.
   */
  useEffect(() => {
    if (!user?.id) return;

    const MIN_GAP_MS = 60_000;
    let lastCheck = Date.now();

    const maybeRefresh = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastCheck < MIN_GAP_MS) return;
      lastCheck = Date.now();
      const current = userRef.current;
      if (current) void refreshAccess(current);
    };

    document.addEventListener("visibilitychange", maybeRefresh);
    window.addEventListener("focus", maybeRefresh);
    return () => {
      document.removeEventListener("visibilitychange", maybeRefresh);
      window.removeEventListener("focus", maybeRefresh);
    };
    // Keyed on the id, not the object: a refresh replaces `user`, and
    // re-subscribing on that would reset the throttle every time.
  }, [user?.id, refreshAccess]);

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