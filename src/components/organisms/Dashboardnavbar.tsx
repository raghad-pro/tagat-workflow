"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useLocale } from "next-intl";
import ThemeButton from "@/components/atoms/ThemeButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { Settings, Bell, User, LogOut, FileText, UsersRound, Clock, CheckCircle2, Check, MessageSquare, Users, Video, Compass } from "lucide-react";
import { meetingsApi } from "@/modules/meetings/api/meetings.api";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTimeAgo(dateStr?: string, isAr?: boolean) {
  if (!dateStr) return isAr ? "الآن" : "Just now";
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (isNaN(diffSec) || diffSec < 60) return isAr ? "الآن" : "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isAr ? `منذ ${diffMin} دقيقة` : `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
}

// ─── Notifications Dropdown ───────────────────────────────────────────────────

/** Ids already announced as a toast, so a refetch never repeats one. */
const SEEN_NOTIFICATIONS_KEY = "wf-announced-notifications";
/** Ceiling on one batch, so a first login does not stack a wall of toasts. */
const MAX_TOASTS_PER_PASS = 3;
/** How long a toast stays up. A meeting invitation gets longer: it is the
 *  only warning the invitee gets, and the meeting may be starting now. */
const TOAST_MS = 6000;
const URGENT_TOAST_MS = 14000;
/** Trim the stored set; without a cap it grows for the life of the browser. */
const MAX_SEEN_IDS = 200;
/** How often to look for new items while the tab stays open. */
// Invitations are the only way an employee can enter a private meeting, so do
// not leave them waiting up to two minutes for the next check.
const NOTIFICATION_POLL_MS = 30_000;

/**
 * Endpoints that answered 404 in this session, so the bell stops asking.
 *
 * Probed against the live API (2026-08-26): `/{prefix}/notifications` does
 * not exist for any role, so the bell opened every poll — every two minutes,
 * for every signed-in user — with a request that could only fail, and logged
 * a console error for it each time.
 *
 * Only 404 is remembered. A 500 or a timeout might resolve on its own, so
 * those keep retrying. Cleared on reload, which is when a newly deployed
 * route gets picked up.
 */
const deadEndpoints = new Set<string>();

async function probe(url: string): Promise<any> {
  if (deadEndpoints.has(url)) return null;
  try {
    return await apiClient.get<any>(url);
  } catch (err: any) {
    if (err?.response?.status === 404) deadEndpoints.add(url);
    throw err;
  }
}

function readSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSeenIds(ids: Set<string>) {
  try {
    localStorage.setItem(
      SEEN_NOTIFICATIONS_KEY,
      JSON.stringify([...ids].slice(-MAX_SEEN_IDS))
    );
  } catch {
    // A full or blocked storage only costs a repeated toast; never block on it.
  }
}

function NotificationsDropdown() {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [meetingInvitation, setMeetingInvitation] = useState<any | null>(null);
  const [isAnsweringInvitation, setIsAnsweringInvitation] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Persisted across reloads: a refresh must not re-announce what the user has
  // already been shown.
  const announcedRef = useRef<Set<string> | null>(null);

  const fetchLiveNotifications = async () => {
    setIsLoading(true);
    try {
      const rolePrefix = getRolePrefix(role);
      
      // Attempt to fetch from official /notifications endpoint first
      let apiNotifs: any[] = [];
      try {
        const notifRes = await probe(`${rolePrefix}/notifications`);
        apiNotifs = notifRes?.data?.data || notifRes?.data || notifRes || [];
      } catch {
        apiNotifs = [];
      }

      const items: any[] = [];

      // If backend provides notifications array
      if (Array.isArray(apiNotifs) && apiNotifs.length > 0) {
        apiNotifs.forEach((n: any) => {
          items.push({
            id: n.id ? `api-${n.id}` : `api-${n.created_at || n.date || ""}-${n.title || n.message || ""}`,
            title: isAr ? (n.title_ar || n.title || "إشعار جديد") : (n.title_en || n.title || "New Notification"),
            description: isAr ? (n.body_ar || n.message || n.description || "") : (n.body_en || n.message || n.description || ""),
            time: formatTimeAgo(n.created_at || n.date, isAr),
            rawDate: new Date(n.created_at || n.date || Date.now()).getTime(),
            icon: Bell,
            iconBg: "bg-[#22c8e0]/10 text-[#22c8e0]",
            isUnread: !n.read_at && !n.is_read,
          });
        });
      }

      // Fetch live activity events from API (Company Requests, Invoices, Timesheets, Payments)
      const [requestsRes, invoicesRes, timesheetsRes, paymentsRes, invitationsRes] = await Promise.allSettled([
        // `/{prefix}/company-requests` and a prefix-less `/timesheets` both
        // 404 — neither has ever matched a route, so the join-request and
        // pending-timesheet notifications have never once fired. The real
        // paths are the ones their own modules already use:
        // `company-requests.api.ts` → `{prefix}/requests`, and
        // `timesheets.api.ts` → `{prefix}/timesheets`.
        probe(`${rolePrefix}/requests`),
        probe(`${rolePrefix}/invoices`),
        probe(`${rolePrefix}/timesheets?status=pending`),
        probe(`${rolePrefix}/payments`),
        user?.id
          ? meetingsApi.listMyInvitations(role, Number(user.id))
          : Promise.resolve([]),
      ]);

      // 0. Meeting invitations addressed to me.
      //
      // The backend files an invitation without notifying anyone, so this is
      // the only way the invitee learns about it. Rooms are invitation-only, so
      // missing this notification means missing the meeting entirely.
      const myInvitations = invitationsRes.status === "fulfilled" ? invitationsRes.value : [];
      if (Array.isArray(myInvitations)) {
        myInvitations.forEach((inv: any) => {
          const meetingId = inv.meeting_id ?? inv.meeting?.id;
          if (!meetingId) return;
          const title = inv.meeting?.title || (isAr ? "اجتماع" : "a meeting");
          items.push({
            id: `inv-meeting-${inv.id}`,
            title: isAr ? "دعوة اجتماع" : "Meeting Invitation",
            description: isAr
              ? `تمت دعوتك لحضور "${title}". اضغط للدخول.`
              : `You have been invited to "${title}". Click to open it.`,
            time: formatTimeAgo(inv.sent_at || inv.created_at, isAr),
            rawDate: new Date(inv.sent_at || inv.created_at || Date.now()).getTime(),
            icon: Video,
            iconBg: "bg-[#25C6DA]/10 text-[#25C6DA]",
            // Only an unanswered invitation is news; an accepted one is
            // history. Read as "not yet answered" rather than matching the
            // literal "pending": a row that omits the field, or spells it
            // differently, is still an invitation nobody has replied to, and
            // treating it as read would silence the only warning sent.
            isUnread: !["accepted", "declined"].includes(
              String(inv.status ?? "").toLowerCase()
            ),
            // Wins its toast slot against routine items — see `announceNew`.
            urgent: true,
            href: `/meetings/${meetingId}`,
            invitationId: inv.id,
            meetingId,
          });
        });
      }

      // 1. Company Requests / User Registrations
      const requests = requestsRes.status === "fulfilled" ? (requestsRes.value?.data?.data || requestsRes.value?.data || requestsRes.value || []) : [];
      if (Array.isArray(requests)) {
        requests.slice(0, 3).forEach((req: any) => {
          const compName = req.company_name || req.name || req.email || (isAr ? "شركة جديدة" : "New Company");
          items.push({
            id: `req-${req.id}`,
            title: isAr ? "طلب انضمام جديد" : "New Company Request",
            description: isAr ? `قدمت ${compName} طلباً جديداً للانضمام المنصة.` : `${compName} submitted a new join request.`,
            time: formatTimeAgo(req.created_at || req.date, isAr),
            rawDate: new Date(req.created_at || req.date || Date.now()).getTime(),
            icon: UsersRound,
            iconBg: "bg-sky-500/10 text-sky-500",
            isUnread: req.status === "pending" || req.status === "new",
          });
        });
      }

      // 2. Invoices
      const invoices = invoicesRes.status === "fulfilled" ? (invoicesRes.value?.data?.data || invoicesRes.value?.data || invoicesRes.value || []) : [];
      if (Array.isArray(invoices)) {
        invoices.slice(0, 3).forEach((inv: any) => {
          const amount = inv.amount ? `$${Number(inv.amount).toLocaleString()}` : "";
          items.push({
            id: `inv-${inv.id}`,
            title: isAr ? "فاتورة جديدة" : "New Invoice Issued",
            description: isAr ? `تم إصدار الفاتورة #INV-${inv.id} بقيمة ${amount}.` : `Invoice #INV-${inv.id} issued for ${amount}.`,
            time: formatTimeAgo(inv.created_at || inv.invoice_date, isAr),
            rawDate: new Date(inv.created_at || inv.invoice_date || Date.now()).getTime(),
            icon: FileText,
            iconBg: "bg-emerald-500/10 text-emerald-500",
            isUnread: inv.status === "unpaid",
          });
        });
      }

      // 3. Pending Timesheets
      // `data` is `{ timesheets: { data: [...] }, summary, ... }` here, not a
      // bare paginator — see the note in `timesheets.api.ts`.
      const timesheetsPayload = timesheetsRes.status === "fulfilled" ? timesheetsRes.value?.data : null;
      const timesheets = timesheetsPayload?.timesheets?.data
        || timesheetsPayload?.data
        || (Array.isArray(timesheetsPayload) ? timesheetsPayload : [])
        || [];
      if (Array.isArray(timesheets)) {
        timesheets.slice(0, 3).forEach((ts: any) => {
          const empName = ts.employee?.name || ts.employee_name || (isAr ? "موظف" : "Employee");
          items.push({
            id: `ts-${ts.id}`,
            title: isAr ? "سجل وقت قيد الانتظار" : "Pending Timesheet",
            description: isAr ? `قام الموظف ${empName} بتقديم سجل ساعات ينتظر التوثيق.` : `${empName} submitted a timesheet awaiting approval.`,
            time: formatTimeAgo(ts.created_at || ts.date, isAr),
            rawDate: new Date(ts.created_at || ts.date || Date.now()).getTime(),
            icon: Clock,
            iconBg: "bg-amber-500/10 text-amber-500",
            isUnread: ts.status === "pending",
          });
        });
      }

      // 4. Payments
      const payments = paymentsRes.status === "fulfilled" ? (paymentsRes.value?.data?.data || paymentsRes.value?.data || paymentsRes.value || []) : [];
      if (Array.isArray(payments)) {
        payments.slice(0, 3).forEach((pay: any) => {
          const amount = pay.amount ? `$${Number(pay.amount).toLocaleString()}` : "";
          items.push({
            id: `pay-${pay.id}`,
            title: isAr ? "دفعة مالية جديدة" : "Payment Received",
            description: isAr ? `تم تحويل دفعة مالية بقيمة ${amount} بنجاح.` : `Payment of ${amount} received successfully.`,
            time: formatTimeAgo(pay.created_at || pay.payment_date, isAr),
            rawDate: new Date(pay.created_at || pay.payment_date || Date.now()).getTime(),
            icon: CheckCircle2,
            iconBg: "bg-purple-500/10 text-purple-500",
            isUnread: false,
          });
        });
      }

      // Sort by newest first
      items.sort((a, b) => b.rawDate - a.rawDate);
      
      setNotifications(items);
      setUnreadCount(items.filter((i) => i.isUnread).length);
      // An invitation stays actionable until the employee answers it. Do not
      // hide an older pending invitation just because an earlier version of
      // the navbar had already marked its notification as seen locally.
      const pendingMeetingInvitation = items.find(
        (item) => item.urgent && item.invitationId && item.isUnread
      );
      if (pendingMeetingInvitation) setMeetingInvitation(pendingMeetingInvitation);
      announceNew(items);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Pops a toast for anything unread the user has not been shown before.
   *
   * Everything in the batch is marked seen, not just what gets a toast: the
   * overflow past `MAX_TOASTS_PER_PASS` is deliberately swallowed rather than
   * queued, otherwise it would surface on the next poll instead — the same wall
   * of toasts, only later.
   */
  const announceNew = (items: any[]) => {
    if (announcedRef.current === null) announcedRef.current = readSeenIds();
    const seen = announcedRef.current;

    const fresh = items.filter((i) => i.isUnread && !seen.has(String(i.id)));
    items.forEach((i) => seen.add(String(i.id)));
    writeSeenIds(seen);

    // Urgent items take the slots first. Everything in the batch is marked
    // seen above, so whatever the cap drops is dropped for good — and a
    // meeting invitation losing that race to three invoices would mean the
    // invitee is never told at all. Ordering is otherwise left alone: the
    // list is already newest-first.
    const queued = [...fresh].sort(
      (a, b) => Number(Boolean(b.urgent)) - Number(Boolean(a.urgent))
    );

    queued.slice(0, MAX_TOASTS_PER_PASS).forEach((item) => {
      const IconComp = item.icon || Bell;
      toast.custom(
        (instance) => (
          <div
            role={item.href ? "link" : undefined}
            onClick={() => {
              toast.dismiss(instance.id);
              if (item.href) router.push(item.href);
            }}
            className={cn(
              "flex items-start gap-3 max-w-[360px] w-full p-3.5 rounded-2xl border shadow-lg",
              item.href && "cursor-pointer",
              instance.visible ? "animate-in fade-in slide-in-from-top-2" : "opacity-0"
            )}
            style={{
              background: "var(--color-bg-form)",
              borderColor: "var(--color-border-inputs)",
            }}
            dir={isAr ? "rtl" : "ltr"}
          >
            <div className={cn("p-2 rounded-xl shrink-0", item.iconBg)}>
              <IconComp size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {item.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
        ),
        {
          duration: item.urgent ? URGENT_TOAST_MS : TOAST_MS,
          position: "top-center",
        }
      );
    });
  };

  const answerMeetingInvitation = async (status: "accepted" | "declined") => {
    if (!meetingInvitation?.invitationId || isAnsweringInvitation) return;

    setIsAnsweringInvitation(true);
    try {
      await meetingsApi.respondInvitation(role, meetingInvitation.invitationId, status);
      setNotifications((current) =>
        current.map((item) =>
          item.id === meetingInvitation.id ? { ...item, isUnread: false } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      const accepted = status === "accepted";
      toast.success(accepted ? (isAr ? "تم قبول دعوة الاجتماع" : "Meeting invitation accepted") : (isAr ? "تم رفض دعوة الاجتماع" : "Meeting invitation declined"));
      const meetingId = meetingInvitation.meetingId;
      setMeetingInvitation(null);
      if (accepted && meetingId) router.push(`/meetings/${meetingId}`);
    } catch (error: any) {
      toast.error(error?.message || (isAr ? "تعذر تحديث الدعوة" : "Unable to update the invitation"));
    } finally {
      setIsAnsweringInvitation(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    // `user?.id` matters on its own: `role` falls back to "super_admin" before
    // auth resolves, so for an actual super admin it never changes and the
    // first pass — the one with no user id, and therefore no invitations —
    // would be the only one.
  }, [role, isAr, user?.id]);

  // A toast that only ever fires on mount is not a toast — the navbar survives
  // client-side navigation, so without this the user would have to reload to
  // learn about an invitation. Thirty seconds keeps the invite flow responsive
  // while still avoiding a request on every navigation event.
  useEffect(() => {
    if (!user?.id) return;
    const timer = setInterval(fetchLiveNotifications, NOTIFICATION_POLL_MS);
    return () => clearInterval(timer);
  }, [role, isAr, user?.id]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) fetchLiveNotifications();
          setOpen((prev) => !prev);
        }}
        className={ICON_TRIGGER}
        title={isAr ? "الإشعارات" : "Notifications"}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 end-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0b1118]" />
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-form)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {isAr ? "الإشعارات" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-[#22c8e0]/15 text-[#22c8e0]">
                  {isAr ? `${unreadCount} جديدة` : `${unreadCount} new`}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => setUnreadCount(0)}
                className="text-[12px] font-semibold text-[#22c8e0] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Check size={14} />
                {isAr ? "تحديد الكل كقروء" : "Mark all as read"}
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--color-border-form)]">
            {isLoading ? (
              <div className="p-6 text-center text-xs font-medium text-slate-400">
                {isAr ? "جاري تحميل الإشعارات..." : "Loading notifications..."}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-xs font-medium text-slate-400">
                {isAr ? "لا توجد إشعارات حالياً" : "No notifications available"}
              </div>
            ) : (
              notifications.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    // Only the sources that know where they point are clickable;
                    // the rest keep the plain look they had.
                    role={item.href ? "link" : undefined}
                    tabIndex={item.href ? 0 : undefined}
                    onClick={() => {
                      if (!item.href) return;
                      setOpen(false);
                      router.push(item.href);
                    }}
                    onKeyDown={(e) => {
                      if (!item.href || e.key !== "Enter") return;
                      setOpen(false);
                      router.push(item.href);
                    }}
                    className={cn(
                      "p-3.5 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-[#121a24] cursor-pointer",
                      item.isUnread && unreadCount > 0 && "bg-[#22c8e0]/5"
                    )}
                  >
                    <div className={cn("p-2 rounded-xl shrink-0 mt-0.5", item.iconBg)}>
                      <IconComp size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 text-center border-t border-[var(--color-border-form)] bg-slate-50/50 dark:bg-[#0b1118]/50">
            <span className="text-xs font-bold text-[#22c8e0] block py-1 cursor-pointer hover:underline">
              {isAr ? "أنت على اطلاع بكل شيء" : "You're all caught up"}
            </span>
          </div>
        </div>
      )}

      {meetingInvitation && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/35 p-4 pt-20 sm:items-center sm:pt-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="meeting-invitation-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#25C6DA]/25 bg-white p-5 shadow-2xl dark:bg-[#101821]" dir={isAr ? "rtl" : "ltr"}>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#25C6DA]/10 text-[#25C6DA]">
                <Video size={21} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="meeting-invitation-title" className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? "دعوة لاجتماع" : "Meeting invitation"}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {meetingInvitation.description}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => answerMeetingInvitation("declined")}
                disabled={isAnsweringInvitation}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isAr ? "رفض" : "Decline"}
              </button>
              <button
                type="button"
                onClick={() => answerMeetingInvitation("accepted")}
                disabled={isAnsweringInvitation}
                className="rounded-lg bg-[#25C6DA] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#20b2c4] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnsweringInvitation ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "قبول" : "Accept")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  // cache entry instead of polling the endpoint twice.
  const { conversations: unsorted, isLoading } = useConversations(role);

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
        onClick={() => setOpen((prev) => !prev)}
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

      {/* Right Actions (Notifications, Conversations, Theme, User Profile) */}
      <div data-tour="navbar-actions" className="flex items-center gap-1 sm:gap-2.5 shrink-0">

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Conversations Quick Shortcut */}
        <ConversationsDropdown />

        {/* Notifications */}
        <NotificationsDropdown />

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
