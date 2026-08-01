import type { Message } from "../types/conversations.types";
import { getMessageSenderId, toTimestamp } from "./conversation.helpers";

/** A run of consecutive messages from the same sender, under one date heading. */
export interface MessageGroup {
  senderId: string;
  isMine: boolean;
  messages: Message[];
}

export interface DaySection {
  /** `YYYY-MM-DD`, used as the React key and for the heading label. */
  day: string;
  groups: MessageGroup[];
}

function toDayKey(value?: string) {
  const ms = toTimestamp(value);
  if (!ms) return "unknown";
  const date = new Date(ms);
  // Local calendar day, not UTC — otherwise late-evening messages jump a day.
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const dayOfMonth = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${dayOfMonth}`;
}

/**
 * Splits a flat thread into day sections, then into runs by sender, so the UI
 * can show one date separator per day and one avatar per run instead of
 * repeating them on every bubble.
 */
export function groupMessages(
  messages: Message[],
  currentUserId: number | string | undefined
): DaySection[] {
  const sections: DaySection[] = [];

  for (const message of messages) {
    const day = toDayKey(message.created_at);
    const senderId = String(getMessageSenderId(message) ?? "unknown");
    const isMine = senderId === String(currentUserId);

    let section = sections[sections.length - 1];
    if (!section || section.day !== day) {
      section = { day, groups: [] };
      sections.push(section);
    }

    const lastGroup = section.groups[section.groups.length - 1];
    if (lastGroup && lastGroup.senderId === senderId) {
      lastGroup.messages.push(message);
    } else {
      section.groups.push({ senderId, isMine, messages: [message] });
    }
  }

  return sections;
}

/** "Today" / "Yesterday" / a localised date, for the day separator. */
export function formatDayLabel(
  day: string,
  locale: string,
  labels: { today: string; yesterday: string }
) {
  if (day === "unknown") return "";

  const date = new Date(`${day}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - date.getTime()) / 86_400_000);

  if (diffDays === 0) return labels.today;
  if (diffDays === 1) return labels.yesterday;

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() === startOfToday.getFullYear() ? {} : { year: "numeric" }),
  });
}

export function formatClock(value: string | undefined, locale: string) {
  const ms = toTimestamp(value);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

/** Relative-ish stamp for the sidebar: time today, weekday this week, else date. */
export function formatListStamp(value: string | undefined, locale: string) {
  const ms = toTimestamp(value);
  if (!ms) return "";
  const date = new Date(ms);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfDate = new Date(date);
  startOfDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (diffDays === 0) return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  if (diffDays < 7) return date.toLocaleDateString(locale, { weekday: "short" });
  return date.toLocaleDateString(locale, { day: "numeric", month: "short" });
}
