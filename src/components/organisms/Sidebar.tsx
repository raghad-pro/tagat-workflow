"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import Logo from "@/components/atoms/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Building2, MessageSquare, Users,
  FileText, CreditCard, Wallet, ArrowLeftRight, DollarSign,
  ShieldCheck, UserCog, FolderKanban, CheckSquare, Clock,
  Wrench, FileSignature,
} from "@/assets/icons/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "super_admin" | "company" | "employee" | "client";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

interface NavGroup {
  key: string;
  roles: Role[];
  items: NavItem[];
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    key: "home",
    roles: ["super_admin", "company", "employee", "client"],
    items: [
      { key: "dashboard",          href: "/dashboard",          icon: LayoutDashboard, roles: ["super_admin", "company", "employee", "client"] },
      { key: "roles",              href: "/roles",              icon: ShieldCheck,   roles: ["super_admin"] },
      { key: "companies",          href: "/companies",          icon: Building2,      roles: ["super_admin", "client"] },
      { key: "currencies",         href: "/currencies",         icon: DollarSign,     roles: ["super_admin", "company"] },
      { key: "clients",            href: "/clients",            icon: Users,     roles: ["super_admin", "company"] },
      { key: "companyRequests",    href: "/company-requests",   icon: MessageSquare,  roles: ["super_admin", "company"] },
      { key: "employees",          href: "/employees",          icon: UserCog,       roles: ["super_admin", "company"] },
      { key: "projects",           href: "/projects",           icon: FolderKanban,  roles: ["super_admin", "company", "employee", "client"] },
      { key: "developments",       href: "/developments",       icon: Wrench,        roles: ["super_admin", "company"] },
      { key: "wallets",            href: "/wallets",            icon: Wallet,         roles: ["super_admin", "company"] },
      { key: "walletTransactions", href: "/wallet-transactions", icon: ArrowLeftRight, roles: ["super_admin", "company"] },
      { key: "invoices",           href: "/invoices",           icon: FileText,       roles: ["super_admin", "company", "client"] },
      { key: "payments",           href: "/payments",           icon: CreditCard,     roles: ["super_admin", "company", "client"] },
      { key: "tasks",              href: "/tasks",              icon: CheckSquare,   roles: ["super_admin", "company", "employee"] },
      { key: "timesheets",         href: "/timesheets",         icon: Clock,         roles: ["super_admin", "company", "employee"] },
      { key: "contracts",          href: "/contracts",          icon: FileSignature, roles: ["super_admin", "company"] },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const { user } = useAuth();
  const role = user?.role as Role | undefined;

  const visibleGroups = NAV_GROUPS
    .filter((g) => !role || g.roles.includes(role))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => !role || item.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  return (
<Sidebar
      collapsible="none"
      className={cn(
        "border-e border-[var(--sidebar-border,var(--color-border-form))]",
        "bg-[var(--sidebar-bg,var(--color-bg-form))]",
        "w-14 md:w-[var(--sidebar-width,240px)]",
        "h-screen" // تأكيد أن السايدبار يأخذ كامل ارتفاع الشاشة ليشتغل السكرول داخله بشكل صحيح
      )}
    >
      {/* ── Logo ── */}
      <SidebarHeader
        className="border-b border-[var(--sidebar-border,var(--color-border-form))] px-3 md:px-4"
        style={{ height: "var(--navbar-height, 64px)", justifyContent: "center" }}
      >
        <div
          className="flex md:hidden w-8 h-8 rounded-lg items-center justify-center mx-auto shrink-0"
          style={{ background: "var(--color-bg-primary)" }}
        >
          <span style={{ color: "var(--color-text-button)", fontWeight: 700, fontSize: 14 }}>
            W
          </span>
        </div>
        <div className="hidden md:block">
          <Logo />
        </div>
      </SidebarHeader>

      {/* ── Nav (تعديل السكرول هنا) ── */}
      <SidebarContent 
        className={cn(
          "px-2 py-3",
          "overflow-y-auto overflow-x-hidden", 
          "scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent",
          "[&::-webkit-scrollbar]:w-1",
          "[&::-webkit-scrollbar-thumb]:bg-gray-400/20",
          "dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "hover:[&::-webkit-scrollbar-thumb]:bg-gray-400/50",
          "dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20"
        )}
      >
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.key} className="p-0 mb-1">

            {/* Group label — desktop فقط */}
            {visibleGroups.length > 1 && (
              <SidebarGroupLabel
                className={cn(
                  "text-[0.68rem] font-bold uppercase tracking-widest px-3 mb-1",
                  "hidden md:flex"
                )}
                style={{ color: "var(--sidebar-group-label, var(--color-text-gray-200))" }}
              >
                {t(group.key as Parameters<typeof t>[0])}
              </SidebarGroupLabel>
            )}

            {/* Divider — mobile فقط بدل الـ label */}
            {visibleGroups.length > 1 && (
              <div className="md:hidden my-1 border-t border-[var(--sidebar-border,var(--color-border-form))]" />
            )}

            <SidebarMenu>
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={undefined}
                      className={cn(
                        "rounded-[10px] gap-1",
                        "flex-col h-auto py-2 md:flex-row md:h-10 md:py-0",
                        "justify-center md:justify-start",
                        "px-0 md:px-3",
                        "group/nav-item",
                        "text-[var(--sidebar-item-text,var(--color-text-gray))] font-medium text-sm",
                        "hover:bg-[var(--sidebar-item-hover,var(--color-bg-primary-200))]",
                        "hover:text-[var(--sidebar-item-active-text,var(--color-text-brand))]",
                        isActive && [
                          "bg-[var(--sidebar-item-active-bg,var(--color-bg-primary-200))]",
                          "text-[var(--sidebar-item-active-text,var(--color-text-brand))]",
                          "font-bold",
                        ]
                      )}
                    >
                      <Link href={item.href}>
                        <Icon size={18} className="shrink-0" />
                        <span className="hidden md:block truncate">{t(item.key as Parameters<typeof t>[0])}</span>
                        <span className="md:hidden text-[10px] leading-tight text-center w-full max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover/nav-item:max-h-4 group-hover/nav-item:opacity-100 truncate">
                          {t(item.key as Parameters<typeof t>[0])}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>

  );
}