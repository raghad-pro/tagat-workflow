"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { useEmployees } from "@/modules/employees/hooks/useEmployees";
import { useClients } from "@/modules/clients/hooks/useClients";
import { useMeetingMessages } from "./useMeetings";

export interface DirectoryUser {
  id: number;
  name: string;
  email?: string;
  image?: string | null;
}

const CACHE_KEY = "meeting_user_names";

// ─── Learned-name cache ───────────────────────────────────────────────────────
// The meetings API never embeds a user record on participants or invitations,
// and there is no endpoint that lists company owners. Names we *do* observe
// (from a LiveKit token or a chat message) are cached so the person keeps their
// real name on later visits, even while they are offline.

let cache: Record<string, string> = {};
let loaded = false;
const listeners = new Set<() => void>();

function loadCache(): Record<string, string> {
  if (loaded || typeof window === "undefined") return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    cache = {};
  }
  loaded = true;
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  loadCache();
  return cache;
}

/** Records a name discovered at runtime. No-ops if nothing changed. */
export function rememberUserName(userId: unknown, name?: string | null) {
  const id = Number(userId);
  if (!Number.isFinite(id) || !name || !name.trim()) return;
  loadCache();
  if (cache[id] === name) return;
  cache = { ...cache, [id]: name };
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // A full or unavailable localStorage must not break the room.
  }
  listeners.forEach((l) => l());
}

/**
 * Builds a `user_id -> profile` lookup so meeting rosters can show real names.
 *
 * `GET /meetings/{id}/participants` and `/invitations` return only `user_id`,
 * so names are assembled from every source that does expose them: the employee
 * and client directories, chat messages (which embed `user`), and the cache of
 * names learned from LiveKit tokens.
 *
 * @param meetingId when given, chat messages of that meeting are mined for names.
 */
export function useMeetingUserDirectory(meetingId?: number | string) {
  const t = useTranslations("meetings");
  const { user } = useAuth();
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees({ per_page: 100 });
  const { data: clientsData, isLoading: loadingClients } = useClients({ per_page: 100 });
  // Chat is only readable by active participants, so this stays disabled until
  // a meeting is in play; a 403 here is harmless and simply yields no names.
  const { data: messages } = useMeetingMessages(meetingId ?? "");

  const learned = useSyncExternalStore(subscribe, getSnapshot, () => cache);

  const directory = useMemo(() => {
    const map = new Map<number, DirectoryUser>();

    const add = (id: unknown, profile: Partial<DirectoryUser> & { name?: string }) => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId) || !profile.name) return;
      if (!map.has(numericId)) {
        map.set(numericId, {
          id: numericId,
          name: profile.name,
          email: profile.email,
          image: profile.image ?? null,
        });
      }
    };

    // The signed-in user is authoritative for their own row.
    if (user?.id && user?.name) {
      map.set(Number(user.id), {
        id: Number(user.id),
        name: user.name,
        email: (user as any).email,
        image: (user as any).image ?? null,
      });
    }

    (employeesData?.data ?? []).forEach((emp: any) =>
      add(emp.user_id ?? emp.user?.id, {
        name: emp.user?.name || emp.name,
        email: emp.user?.email || emp.email,
        image: emp.user?.image,
      })
    );

    const clientRows: any[] = Array.isArray(clientsData?.data)
      ? (clientsData.data as any[])
      : ((clientsData?.data as any)?.data ?? []);

    clientRows.forEach((client: any) =>
      add(client.user_id ?? client.user?.id, {
        name: client.user?.name || client.name,
        email: client.user?.email || client.email,
        image: client.user?.image,
      })
    );

    // Chat messages embed the sender — the one place the meetings API does.
    (messages ?? []).forEach((msg: any) =>
      add(msg.user_id ?? msg.user?.id, {
        name: msg.user?.name,
        image: msg.user?.image,
      })
    );

    // Finally, anyone we have seen before but cannot look up today.
    Object.entries(learned).forEach(([id, name]) => add(id, { name }));

    return map;
  }, [user, employeesData, clientsData, messages, learned]);

  const resolveUser = useCallback(
    (userId: unknown): DirectoryUser | undefined => directory.get(Number(userId)),
    [directory]
  );

  const resolveName = useCallback(
    (userId: unknown, fallback?: string): string =>
      directory.get(Number(userId))?.name || fallback || t("room.participantFallback"),
    [directory, t]
  );

  return {
    directory,
    resolveUser,
    resolveName,
    rememberUserName,
    isLoading: loadingEmployees || loadingClients,
  };
}
