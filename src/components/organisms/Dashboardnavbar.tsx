"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import ThemeButton from "@/components/atoms/ThemeButton";
import { useAuth } from "@/providers/AuthProvider";
import { useLogout } from "@/modules/auth/hooks/useLogout";
import { Settings, Bell, User, LogOut, FileText, UsersRound, Clock, CheckCircle2, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";

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
function NotificationsDropdown() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchLiveNotifications = async () => {
    setIsLoading(true);
    try {
      const rolePrefix = getRolePrefix(role);
      
      // Attempt to fetch from official /notifications endpoint first
      let apiNotifs: any[] = [];
      try {
        const notifRes = await apiClient.get<any>(`${rolePrefix}/notifications`);
        apiNotifs = notifRes?.data?.data || notifRes?.data || notifRes || [];
      } catch {
        apiNotifs = [];
      }

      const items: any[] = [];

      // If backend provides notifications array
      if (Array.isArray(apiNotifs) && apiNotifs.length > 0) {
        apiNotifs.forEach((n: any) => {
          items.push({
            id: n.id || Math.random(),
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
      const [requestsRes, invoicesRes, timesheetsRes, paymentsRes] = await Promise.allSettled([
        apiClient.get<any>(`${rolePrefix}/company-requests`),
        apiClient.get<any>(`${rolePrefix}/invoices`),
        apiClient.get<any>(`/timesheets?status=pending`),
        apiClient.get<any>(`${rolePrefix}/payments`),
      ]);

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
      const timesheets = timesheetsRes.status === "fulfilled" ? (timesheetsRes.value?.data?.data || timesheetsRes.value?.data || timesheetsRes.value || []) : [];
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
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, [role, isAr]);

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
        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-[#16202c] transition-colors relative cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#22c8e0] dark:hover:text-[#22c8e0]"
        title={isAr ? "الإشعارات" : "Notifications"}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0b1118]" />
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 top-full mt-2 z-50 rounded-2xl overflow-hidden w-80 sm:w-96 border shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
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
                {isAr ? "جاري تحميل الإشعارات الحية..." : "Loading live notifications..."}
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
              {isAr ? "جميع إشعارات الداش بورد محدثة من الـ API" : "All dashboard notifications updated live from API"}
            </span>
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
          "hover:bg-slate-100 dark:hover:bg-[#16202c]",
          open && "bg-slate-100 dark:bg-[#16202c]"
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
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-gradient-to-r from-[#22c8e0] to-[#0ea5e9] text-white shadow-sm"
        >
          {initial}
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
            <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name ?? "User"}</p>
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
        <SidebarTrigger className="cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#22c8e0]" />

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

      {/* Right Actions (Settings, Notifications, Theme, User Profile) */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
        {/* Settings */}
        <Link
          href="/settings"
          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-[#16202c] transition-colors cursor-pointer text-slate-600 dark:text-slate-300 hover:text-[#22c8e0] dark:hover:text-[#22c8e0]"
          title={isAr ? "الإعدادات" : "Settings"}
        >
          <Settings size={18} className="sm:w-5 sm:h-5" />
        </Link>

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