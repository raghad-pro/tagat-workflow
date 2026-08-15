"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Building2, MessageSquare, MessageCircleMore, Users, UsersRound, UserRoundPlus,
  FileText, CustomCardIcon, Wallet, ArrowLeftRight, DollarSign,
  ShieldCheck, UserCog, FolderKanban, CheckSquare, SquareCheck, Clock,
  Wrench, FileSignature, ScrollText, ArrowUpDown, BadgePercent, KeyRound,
  KanbanSquare, Video, BarChart3
} from "@/assets/icons/icons";
import { usePermission } from "@/hooks/usePermission";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "super_admin" | "company" | "employee" | "client";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon | React.FC<any>;
  roles: Role[];
  /**
   * An **additional** way in: the item also appears when a custom role grants
   * this permission, even if `roles` would not otherwise include the user.
   *
   * It never removes an item. The server's permission rows do not agree with
   * what its routes serve — `company_admin` holds no `conversations.view`
   * while `GET /company/conversations` answers 200 — so treating a missing row
   * as "deny" would hide working pages from the people who own them.
   */
  permission?: string;
}

interface NavGroup {
  key: string;
  label?: string;
  arLabel?: string;
  roles: Role[];
  items: NavItem[];
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    key: "home",
    label: "Home",
    arLabel: "الرئيسية",
    roles: ["super_admin", "company", "employee", "client"],
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutGrid, roles: ["super_admin", "company", "employee", "client"] },
      { key: "kpis", href: "/kpis", icon: BarChart3, roles: ["super_admin", "company"], permission: "kpis.view" },
    ],
  },
  {
    key: "subscriberManagement",
    label: "Subscriber Management",
    arLabel: "إدارة المشتركين",
    roles: ["super_admin", "company", "client"],
    items: [
      { key: "companies", href: "/companies", icon: Building2, roles: ["super_admin", "client"], permission: "companies.view" },
      { key: "companyRequests", href: "/company-requests", icon: MessageCircleMore, roles: ["super_admin", "company"], permission: "company_requests.view" },
      { key: "clients", href: "/clients", icon: UsersRound, roles: ["super_admin", "company"], permission: "clients.view" },
    ],
  },
  {
    key: "financialManagement",
    label: "Financial Management",
    arLabel: "الإدارة المالية",
    roles: ["super_admin", "company", "client"],
    items: [
      { key: "currencies", href: "/currencies", icon: BadgePercent, roles: ["super_admin", "company"], permission: "currencies.view" },
      { key: "wallets", href: "/wallets", icon: Wallet, roles: ["super_admin", "company"], permission: "wallets.view" },
      { key: "walletTransactions", href: "/wallet-transactions", icon: ArrowUpDown, roles: ["super_admin", "company"], permission: "wallet_transactions.view" },
      { key: "invoices", href: "/invoices", icon: FileText, roles: ["super_admin", "company", "client"], permission: "invoices.view" },
      { key: "payments", href: "/payments", icon: CustomCardIcon, roles: ["super_admin", "company", "client"], permission: "payments.view" },
    ],
  },
  {
    key: "internalOperations",
    label: "Internal Operations",
    arLabel: "العمليات الداخلية",
    roles: ["super_admin", "company", "employee", "client"],
    items: [
      { key: "employees", href: "/employees", icon: UserRoundPlus, roles: ["super_admin", "company"], permission: "employees.view" },
      { key: "roles", href: "/roles", icon: ShieldCheck, roles: ["super_admin", "company"], permission: "roles.view" },
      { key: "access", href: "/access", icon: KeyRound, roles: ["super_admin", "company"], permission: "employees.update" },
      // The conversations API is exposed under every role prefix, and chats are
      // inherently cross-role (an admin messaging an employee or client).
      { key: "conversations", href: "/conversations", icon: MessageSquare, roles: ["super_admin", "company", "employee", "client"], permission: "conversations.view" },
      { key: "meetings", href: "/meetings", icon: Video, roles: ["super_admin", "company", "employee", "client"], permission: "meetings.view" },
      { key: "projects", href: "/projects", icon: FileText, roles: ["super_admin", "company", "employee", "client"], permission: "projects.view" },
      { key: "tasks", href: "/tasks", icon: SquareCheck, roles: ["super_admin", "company", "employee"], permission: "tasks.view" },
      // The sprint routes are registered under the same three prefixes as tasks
      // — there is no `/client/sprints` — and a sprint is a view over tasks, so
      // it rides on the same permission.
      { key: "sprints", href: "/sprints", icon: KanbanSquare, roles: ["super_admin", "company", "employee"], permission: "tasks.view" },
      { key: "timesheets", href: "/timesheets", icon: Clock, roles: ["super_admin", "company", "employee"], permission: "timesheets.view" },
      { key: "developments", href: "/developments", icon: Wrench, roles: ["super_admin", "company"], permission: "developments.view" },
      { key: "contracts", href: "/contracts", icon: ScrollText, roles: ["super_admin", "company"], permission: "contracts.view" },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const locale = useLocale();
  const isAr = locale === "ar";
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const { hasPermission } = usePermission();
  const { setOpenMobile, isMobile } = useSidebar();

  // An item shows when the account's base role covers it, **or** when a custom
  // role explicitly grants its permission. Additive on purpose: permissions can
  // open a section up, never close one off. See the note on `NavItem.permission`.
  const isVisible = (item: NavItem) =>
    (!role || item.roles.includes(role)) || hasPermission(item.permission);

  const visibleGroups = NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter(isVisible) }))
    .filter((g) => g.items.length > 0);

  return (
    <Sidebar
      collapsible="icon"
      side={isAr ? "right" : "left"}
      className={cn(
        "border-none",
        "ds-sidebar"
      )}
    >
      {/* ── Logo ── */}
      <SidebarHeader
        className="px-4 pt-1.5 pb-0 group-data-[collapsible=icon]:hidden"
        style={{ justifyContent: "center" }}
      >
        <div className="w-full mb-0 flex justify-center">
          <Logo />
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent 
        className={cn(
          "px-3 pt-0 pb-1",
          "group-data-[collapsible=icon]:pt-2 group-data-[collapsible=icon]:px-0",
          "overflow-y-auto overflow-x-hidden",
          "no-scrollbar scrollbar-hide",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.key} className="p-0 mb-0.5">

            {/* Group label — desktop فقط */}
            {group.label && (
              <SidebarGroupLabel
                className={cn(
                  "text-[10.5px] font-bold text-gray-400 dark:text-gray-500 px-2.5 py-0 mt-1 mb-0.5 capitalize h-auto select-none",
                  "flex"
                )}
              >
                {isAr && group.arLabel ? group.arLabel : group.label}
              </SidebarGroupLabel>
            )}

            <SidebarMenu className="gap-0.5">
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
                        "rounded-lg gap-2.5 transition-all duration-150",
                        "flex-row h-[32px] md:h-[33px] py-0",
                        "justify-start",
                        "px-2.5",
                        "group/nav-item",
                        "font-medium text-[12.5px]",
                        !isActive && [
                          "text-slate-600 dark:text-slate-300",
                          "hover:bg-transparent dark:hover:bg-transparent",
                          "hover:text-[var(--color-btn-brand)] dark:hover:text-[var(--color-btn-brand)]",
                        ],
                        isActive && [
                          "bg-[var(--color-btn-brand)] hover:bg-[var(--color-btn-brand-hover)] active:bg-[var(--color-btn-brand-pressed)]",
                          "text-white hover:text-white dark:text-black dark:hover:text-black",
                          "font-bold"
                        ]
                      )}
                    >
                      <Link 
                        href={item.href}
                        onClick={() => {
                          if (isMobile) setOpenMobile(false);
                        }}
                      >
                        <Icon
                          size={16}
                          className={cn(
                            "shrink-0 transition-colors duration-150",
                            isActive
                              ? "text-white dark:text-black"
                              : "text-slate-500 dark:text-slate-400 group-hover/nav-item:text-[var(--color-btn-brand)] dark:group-hover/nav-item:text-[var(--color-btn-brand)]"
                          )}
                        />
                        <span className="truncate group-data-[collapsible=icon]:hidden">{t(item.key as Parameters<typeof t>[0])}</span>
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