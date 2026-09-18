"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import ThemeButton from "@/components/atoms/ThemeButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { Settings, User, LogOut, MessageSquare, Users, Compass } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import LanguageSwitcher from "@/components/atoms/languageSwitcher";
import { RESTART_EVENT } from "@/modules/onboarding/OnboardingGate";
import { resetOnboarding } from "@/modules/onboarding/storage";
import { useConversations } from "@/modules/conversations/hooks/useConversations";
import type { Conversation } from "@/modules/conversations/types/conversations.types";
import {
  getConversationImage,
  getConversationTitle,
  getInitials,
  getLastActivityAt,
  getLastMessage,
  getMessageText,
  isGroupConversation,
  toTimestamp,
} from "@/modules/conversations/utils/conversation.helpers";
import { useClearedChats } from "@/modules/conversations/utils/clearedChats";
import { formatListStamp } from "@/modules/conversations/utils/message.format";

/**
 * One trigger style for every icon in the bar.
 *
 * They had drifted apart — 32px, 35px and 36px sitting side by side, and the
 * conversations one alone painted a filled box on hover. `size-10` on phones
 * also brings them up to a usable touch target; below ~40px they are easy to
 * miss with a thumb.
 */
const ICON_TRIGGER =
  "size-10 sm:size-9 flex items-center justify-center rounded-xl bg-transparent " +
  "transition-colors relative cursor-pointer text-slate-600 dark:text-slate-300 " +
  "hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)]";

/**
 * Dropdown panels are anchored to their trigger, which on a phone puts a 320px
 * panel partly off-screen — the conversations one started at x=-115. Below `sm`
 * they become a sheet pinned to both edges of the viewport instead.
 */
const DROPDOWN_PANEL =
  "fixed inset-x-3 top-[calc(var(--navbar-height)+8px)] z-50 w-auto " +
  "sm:absolute sm:inset-x-auto sm:end-0 sm:top-full sm:mt-2 sm:w-96 " +
  "rounded-2xl overflow-hidden border shadow-2xl " +
  "animate-in fade-in slide-in-from-top-2 duration-150";

/** The chat page polls every 20s; the badge that rides on every other page does not need to. */
const NAVBAR_CONVERSATIONS_POLL_MS = 90_000;

// ─── Notifications Dropdown (removed) ─────────────────────────────────────────
// The bell polled five endpoints on a 30s timer without a backend to answer
// them, so it produced a wall of failing requests on every dashboard mount.
// Restore this once the notifications API is real.


// ─── User Dropdown ─────────────────────────────────────────────────────────────
function UserDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const { mutate: logout } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div ref={ref} className="relative">
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors cursor-pointer",
          "hover:bg-transparent dark:hover:bg-transparent",
          open && "bg-transparent dark:bg-transparent"
        )}
      >
        {/* Name + Email */}
        <div className="hidden sm:flex flex-col leading-tight text-end">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {user?.name ?? (isAr ? "المدير العام" : "General Manager")}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {user?.email ?? "admin@workflow.com"}
          </span>
        </div>

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[var(--color-btn-brand)] text-white shadow-sm overflow-hidden"
        >
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user?.name ?? (isAr ? "مستخدم" : "User")} 
              className="w-full h-full object-cover" 
            />
          ) : (
            initial
          )}
        </div>

        {/* Chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          className={cn("text-slate-400 transition-transform duration-200 shrink-0", open && "rotate-180")}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          className="absolute end-0 top-full mt-2 z-50 rounded-2xl overflow-hidden w-56 border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
          style={{
            background: "var(--color-bg-form)",
            borderColor: "var(--color-border-inputs)",
          }}
        >
          {/* User info header */}
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--color-border-form)" }}
          >
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name ?? (isAr ? "مستخدم" : "User")}</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email ?? ""}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#121a24] transition-colors cursor-pointer"
            >
              <User size={17} className="text-slate-400 shrink-0" />
              <span>{isAr ? "الملف الشخصي" : "Profile"}</span>
            </Link>

            {/* The guided tour runs itself once per account. This is the way
                back to it — clearing the record and asking the gate to look
                again, so it starts on the page they are already on. */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetOnboarding(user?.id);
                window.dispatchEvent(new Event(RESTART_EVENT));
              }}
              className="w-full flex items-center gap-3 px-5 py-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#121a24] transition-colors cursor-pointer"
            >
              <Compass size={17} className="text-slate-400 shrink-0" />
              <span>{isAr ? "إعادة الجولة التعريفية" : "Replay the guide"}</span>
            </button>
          </div>

          {/* Logout */}
          <div style={{ borderTop: "1px solid var(--color-border-form)" }}>
            <button
              type="button"
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-5 py-3 text-xs font-semibold transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 cursor-pointer"
            >
              <LogOut size={17} className="shrink-0 text-red-500" />
              <span>{isAr ? "تسجيل الخروج" : "Log Out"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Conversations Dropdown ───────────────────────────────────────────────────
function ConversationsDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const role = user?.role || "company";
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Same query key as the conversations page (no params), so the two share one
  // cache entry instead of polling the endpoint twice. This badge is on every
  // page, so it polls slowly; opening the panel refreshes it on demand, and the
  // chat screen itself keeps its own faster interval.
  const { conversations: unsorted, isLoading, refetch } = useConversations(
    role,
    undefined,
    { pollMs: NAVBAR_CONVERSATIONS_POLL_MS }
  );

  /**
   * When each conversation was last wiped by this account. A chat that was
   * deleted and restarted comes back under the same id still carrying its old
   * preview, so the dropdown has to suppress it exactly as the list does.
   */
  const { clearedAt } = useClearedChats(user?.id);

  const sortStamp = useCallback(
    (conv: Conversation) => {
      const cleared = clearedAt(conv.id);
      return toTimestamp(getLastActivityAt(conv, cleared)) || toTimestamp(cleared);
    },
    [clearedAt]
  );

  /**
   * When each conversation was last wiped by this account. A chat that was
   * deleted and restarted comes back under the same id still carrying its old
   * preview, so the dropdown has to suppress it exactly as the list does.
   */
  const { clearedAt } = useClearedChats(user?.id);

  const sortStamp = useCallback(
    (conv: Conversation) => {
      const cleared = clearedAt(conv.id);
      return toTimestamp(getLastActivityAt(conv, cleared)) || toTimestamp(cleared);
    },
    [clearedAt]
  );

  // Newest activity first — the endpoint returns no explicit ordering, and the
  // preview only shows the top few, so an unsorted list shows arbitrary ones.
  const conversations = useMemo(
    () => [...unsorted].sort((a, b) => sortStamp(b) - sortStamp(a)).slice(0, 5),
    [sortStamp, unsorted]
  );

  const unreadTotal = useMemo(
    () =>
      unsorted.reduce(
        (acc: number, c: Conversation) =>
          // Messages the account deleted are not unread — they are gone.
          acc + (getLastMessage(c, clearedAt(c.id)) ? Number(c.unread_count ?? 0) : 0),
        0
      ),
    [clearedAt, unsorted]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!open) void refetch();
          setOpen((prev) => !prev);
        }}
        className={cn(ICON_TRIGGER, open && "text-[var(--color-btn-brand)]")}
        aria-label={isAr ? "المحادثات" : "Conversations"}
        title={isAr ? "المحادثات" : "Conversations"}
      >
        <MessageSquare size={20} />
        {unreadTotal > 0 && (
          <span className="absolute top-2 end-2 w-2.5 h-2.5 rounded-full bg-[#00d0d4] ring-2 ring-white dark:ring-[#0b1118]" />
        )}
      </button>

      {open && (
        <div
          className={DROPDOWN_PANEL}
          style={{
            background: "var(--color-bg-form)",
            borderColor: "var(--color-border-inputs)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--color-border-form)" }}
          >
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#00d0d4]" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? "المحادثات" : "Conversations"}
              </h4>
            </div>
            <Link
              href="/conversations"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#00d0d4] hover:underline"
            >
              {isAr ? "عرض الكل" : "View All"}
            </Link>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {isAr ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {isAr ? "لا توجد محادثات" : "No conversations found."}
              </div>
            ) : (
              conversations.map((conv: Conversation) => {
                // Derived exactly like the conversations page: a 1-on-1 chat has
                // no stored title, so its name comes from the other participant.
                const title = getConversationTitle(
                  conv,
                  user?.id,
                  isAr ? "محادثة" : "Conversation"
                );
                const image = getConversationImage(conv, user?.id);
                const convClearedAt = clearedAt(conv.id);
                const lastMessage = getLastMessage(conv, convClearedAt);
                const preview = lastMessage
                  ? getMessageText(lastMessage) ||
                    (isAr ? "مرفق" : "Attachment")
                  : isAr
                  ? "لا توجد رسائل بعد"
                  : isAr ? "لا توجد رسائل بعد" : "No messages yet";
                const unread = lastMessage ? Number(conv.unread_count ?? 0) : 0;

                return (
                  <button
                    type="button"
                    key={conv.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(`/conversations?c=${conv.id}`);
                    }}
                    className="flex w-full items-center gap-3 p-3 text-start hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center bg-[#00d0d4]/10 text-[11px] font-bold text-[#00d0d4]">
                        {isGroupConversation(conv) ? <Users size={16} /> : getInitials(title)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center gap-2 mb-0.5">
                        <h5
                          className={cn(
                            "text-xs truncate text-slate-800 dark:text-slate-200",
                            unread > 0 ? "font-extrabold" : "font-bold"
                          )}
                        >
                          {title}
                        </h5>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatListStamp(getLastActivityAt(conv, convClearedAt), locale)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-[11px] truncate",
                            unread > 0
                              ? "font-semibold text-slate-600 dark:text-slate-300"
                              : "text-slate-500"
                          )}
                        >
                          {preview}
                        </p>
                        {unread > 0 && (
                          <span className="flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-[#00d0d4] px-1 text-[10px] font-bold text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer link to start chat or go to page */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => {
                setOpen(false);
                router.push("/conversations");
              }}
              className="w-full py-2 bg-[#00d0d4]/10 hover:bg-[#00d0d4]/20 text-[#00d0d4] text-xs font-bold rounded-xl transition-colors"
            >
              {isAr ? "الانتقال لصفحة المحادثات" : "Go to Conversations"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ───────────────────────────────────────────────────────────────
export default function DashboardNavbar() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-1.5 sm:gap-3 px-2 sm:px-4"
      style={{
        height: "var(--navbar-height)",
        background: "var(--navbar-bg)",
        borderBottom: "1px solid var(--navbar-border)",
      }}
    >
      {/* Left side: Sidebar Toggle & Search */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Sidebar Toggle for Mobile */}
        <SidebarTrigger className="md:hidden cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[var(--color-btn-brand)] bg-transparent hover:bg-transparent" />

        {/* Search Input (Responsive width, hides placeholder on tiny screens if needed) */}
        <div
          className="hidden xs:flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 w-[110px] sm:w-[180px] md:w-[280px] shrink-0 ds-bg-form ds-border-form"
          style={{ height: "36px" }}
        >
          <input
            type="text"
            placeholder={isAr ? "ابحث هنا..." : "Search..."}
            className="bg-transparent outline-none w-full text-xs sm:text-sm ds-text-primary placeholder:text-gray-400 font-medium"
          />
        </div>
      </div>

      {/* Right Actions (Conversations, Theme, User Profile) */}
      <div data-tour="navbar-actions" className="flex items-center gap-1 sm:gap-2.5 shrink-0">

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Conversations Quick Shortcut */}
        <ConversationsDropdown />

        {/* Theme */}
        <ThemeButton />

        {/* User Dropdown */}
        <div className="ms-0.5 sm:ms-1">
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
