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
  LayoutGrid,
  Building2, MessageSquare, MessageCircleMore, Users, UsersRound, UserRoundPlus,
  FileText, CustomCardIcon, Wallet, ArrowLeftRight, DollarSign,
  ShieldCheck, UserCog, FolderKanban, CheckSquare, SquareCheck, Clock,
  Wrench, FileSignature, ScrollText, ArrowUpDown, BadgePercent
} from "@/assets/icons/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "super_admin" | "company" | "employee" | "client";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon | React.FC<any>;
  roles: Role[];
}

interface NavGroup {
  key: string;
  label?: string;
  roles: Role[];
  items: NavItem[];
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    key: "home",
    label: "Home",
    roles: ["super_admin", "company", "employee", "client"],
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutGrid, roles: ["super_admin", "company", "employee", "client"] },
    ],
  },
  {
    key: "subscriberManagement",
    label: "Subscriber Management",
    roles: ["super_admin", "company"],
    items: [
      { key: "companyRequests", href: "/company-requests", icon: MessageCircleMore, roles: ["super_admin", "company"] },
      { key: "clients", href: "/clients", icon: UsersRound, roles: ["super_admin", "company"] },
    ],
  },
  {
    key: "financialManagement",
    label: "Financial Management",
    roles: ["super_admin", "company", "client"],
    items: [
      { key: "currencies", href: "/currencies", icon: BadgePercent, roles: ["super_admin", "company"] },
      { key: "wallets", href: "/wallets", icon: Wallet, roles: ["super_admin", "company"] },
      { key: "walletTransactions", href: "/wallet-transactions", icon: ArrowUpDown, roles: ["super_admin", "company"] },
      { key: "invoices", href: "/invoices", icon: FileText, roles: ["super_admin", "company", "client"] },
      { key: "payments", href: "/payments", icon: CustomCardIcon, roles: ["super_admin", "company", "client"] },
    ],
  },
  {
    key: "internalOperations",
    label: "Internal Operations",
    roles: ["super_admin", "company", "employee", "client"],
    items: [
      { key: "employees", href: "/employees", icon: UserRoundPlus, roles: ["super_admin", "company"] },
      { key: "projects", href: "/projects", icon: FileText, roles: ["super_admin", "company", "employee", "client"] },
      { key: "tasks", href: "/tasks", icon: SquareCheck, roles: ["super_admin", "company", "employee"] },
      { key: "timesheets", href: "/timesheets", icon: Clock, roles: ["super_admin", "company", "employee"] },
      { key: "developments", href: "/developments", icon: Wrench, roles: ["super_admin", "company"] },
      { key: "contracts", href: "/contracts", icon: ScrollText, roles: ["super_admin", "company"] },
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
        "bg-white",
        "w-14 md:w-[var(--sidebar-width,260px)]",
        "h-screen" // تأكيد أن السايدبار يأخذ كامل ارتفاع الشاشة ليشتغل السكرول داخله بشكل صحيح
      )}
    >
      {/* ── Logo ── */}
      <SidebarHeader
        className="px-6 pt-2 pb-0"
        style={{ justifyContent: "center" }}
      >
        <div
          className="flex md:hidden w-8 h-8 rounded-lg items-center justify-center mx-auto shrink-0"
          style={{ background: "var(--color-bg-primary)" }}
        >
          <span style={{ color: "var(--color-text-button)", fontWeight: 700, fontSize: 14 }}>
            W
          </span>
        </div>
        <div className="hidden md:block w-full mb-0">
          <Logo />
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent 
        className={cn(
          "px-4 pt-0 pb-2",
          "overflow-y-auto overflow-x-hidden",
          "scrollbar-hide", /* Hide scrollbar utility if exists */
          "[&::-webkit-scrollbar]:hidden" /* Fallback to hide scrollbar */
        )}
      >
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.key} className="p-0 mb-1">

            {/* Group label — desktop فقط */}
            {group.label && (
              <SidebarGroupLabel
                className={cn(
                  "text-[12px] font-bold text-gray-500 px-3 mb-0 capitalize",
                  "hidden md:flex"
                )}
              >
                {group.label}
              </SidebarGroupLabel>
            )}

            {/* Divider — mobile فقط بدل الـ label */}
            {visibleGroups.length > 1 && group.key !== "home" && (
              <div className="md:hidden my-2 border-t border-[var(--sidebar-border,var(--color-border-form))]" />
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
                        "rounded-[10px] gap-3 transition-all duration-200",
                        "flex-col h-auto py-1 md:flex-row md:h-8 md:py-0",
                        "justify-center md:justify-start",
                        "px-0 md:px-3",
                        "group/nav-item",
                        "font-bold text-[13px]",
                        "hover:bg-gray-50",
                        "text-gray-600 hover:text-gray-900",
                        isActive && [
                          "bg-[#1ec3cc] hover:bg-[#1ab0b8]",
                          "text-white hover:text-white",
                          "shadow-sm shadow-cyan-500/20"
                        ]
                      )}
                    >
                      <Link href={item.href}>
                        <Icon size={18} className={cn("shrink-0", isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900")} />
                        <span className="hidden md:block truncate mt-[2px]">{t(item.key as Parameters<typeof t>[0])}</span>
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