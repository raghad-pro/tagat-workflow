"use client";

/**
 * When each conversation was last wiped by this account, on this device.
 *
 * The server de-duplicates 1-on-1 chats against soft-deleted ones: delete the
 * chat with an employee, start a new one with the same person, and the same
 * conversation id comes back — carrying its old preview, its old timestamp and
 * its old unread count into the sidebar. To the account it is a brand new
 * conversation, so none of that should be on screen.
 *
 * There is no server field to hang this on, so it is remembered here, keyed by
 * user id the same way `hidden_chats_*` is. It expires itself: the moment a
 * message newer than the mark arrives, the mark stops matching and the row
 * behaves normally again.
 */

import { useCallback, useEffect, useState } from "react";
import { toTimestamp } from "./conversation.helpers";

/** conversation id → the ISO instant it was cleared. */
export type ClearedChats = Record<string, string>;

/** Fired after a write so every open list picks the change up immediately. */
const CHANGED_EVENT = "wf:chats-cleared";

const keyFor = (userId: number | string) => `cleared_chats_${userId}`;

export function readClearedChats(userId?: number | string | null): ClearedChats {
  if (typeof window === "undefined" || userId === undefined || userId === null) return {};
  // A private window can have localStorage present but throwing on access.
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ClearedChats;
  } catch {
    return {};
  }
}

function write(userId: number | string, next: ClearedChats): void {
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch {
    // Storage blocked or full: the old preview lingers, which is better than
    // breaking the chat list over it.
  }
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** Marks everything up to now as gone from this conversation. */
export function markConversationCleared(
  userId: number | string | null | undefined,
  conversationId: number | string
): void {
  if (typeof window === "undefined" || userId === undefined || userId === null) return;
  write(userId, { ...readClearedChats(userId), [String(conversationId)]: new Date().toISOString() });
}

/** Drops a mark that no longer suppresses anything. */
export function forgetClearedChat(
  userId: number | string | null | undefined,
  conversationId: number | string
): void {
  if (typeof window === "undefined" || userId === undefined || userId === null) return;
  const current = readClearedChats(userId);
  if (!(String(conversationId) in current)) return;
  const next = { ...current };
  delete next[String(conversationId)];
  write(userId, next);
}

/**
 * The marks for this account, kept in sync across the conversations page, the
 * navbar dropdown and any other tab.
 */
export function useClearedChats(userId?: number | string | null) {
  const [cleared, setCleared] = useState<ClearedChats>({});

  const reload = useCallback(() => setCleared(readClearedChats(userId)), [userId]);

  useEffect(() => {
    reload();
    window.addEventListener(CHANGED_EVENT, reload);
    // Another tab's write only reaches this one through `storage`.
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(CHANGED_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, [reload]);

  /** The mark for one conversation, or `undefined` if it was never cleared. */
  const clearedAt = useCallback(
    (conversationId: number | string) => cleared[String(conversationId)],
    [cleared]
  );

  return { cleared, clearedAt, reload };
}

/** True when `stamp` is at or before the clear mark, so it must not be shown. */
export function isSuppressed(stamp?: string | null, clearedAt?: string | null): boolean {
  if (!clearedAt) return false;
  return toTimestamp(stamp) <= toTimestamp(clearedAt);
}
