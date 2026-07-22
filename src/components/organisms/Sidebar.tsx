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
    ],
  },
  {
    key: "subscriberManagement",
    label: "Subscriber Management",
    arLabel: "إدارة المشتركين",
    roles: ["super_admin", "company", "client"],
    items: [
      { key: "companies", href: "/companies", icon: Building2, roles: ["super_admin", "client"] },
      { key: "companyRequests", href: "/company-requests", icon: MessageCircleMore, roles: ["super_admin", "company"] },
      { key: "clients", href: "/clients", icon: UsersRound, roles: ["super_admin", "company"] },
    ],
  },
  {
    key: "financialManagement",
    label: "Financial Management",
    arLabel: "الإدارة المالية",
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
    arLabel: "العمليات الداخلية",
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
  const locale = useLocale();
  const isAr = locale === "ar";
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
      collapsible="icon"
      side={isAr ? "right" : "left"}
      className={cn(
        "border-none",
        "ds-sidebar"
      )}
    >
      {/* ── Logo ── */}
      <SidebarHeader
        className="px-6 pt-2 pb-0 group-data-[collapsible=icon]:hidden"
        style={{ justifyContent: "center" }}
      >
        <div className="w-full mb-0 flex justify-center">
          <Logo />
        </div>
      </SidebarHeader>

      {/* ── Nav ── */}
      <SidebarContent 
        className={cn(
          "px-4 pt-0 pb-2",
          "group-data-[collapsible=icon]:pt-3 group-data-[collapsible=icon]:px-0",
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
                  "flex"
                )}
              >
                {isAr && group.arLabel ? group.arLabel : group.label}
              </SidebarGroupLabel>
            )}

            {/* Divider removed as per user request */}

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
                        "rounded-xl gap-3 transition-all duration-200",
                        "flex-row h-10 md:h-9 py-0",
                        "justify-start",
                        "px-3",
                        "group/nav-item",
                        "font-medium text-[13px]",
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
                      <Link href={item.href}>
                        <Icon
                          size={18}
                          className={cn(
                            "shrink-0 transition-colors duration-200",
                            isActive
                              ? "text-white dark:text-black"
                              : "text-slate-500 dark:text-slate-400 group-hover/nav-item:text-[var(--color-btn-brand)] dark:group-hover/nav-item:text-[var(--color-btn-brand)]"
                          )}
                        />
                        <span className="truncate mt-[2px] group-data-[collapsible=icon]:hidden">{t(item.key as Parameters<typeof t>[0])}</span>
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