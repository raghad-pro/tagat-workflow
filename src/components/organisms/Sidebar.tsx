"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  LayoutDashboard,
  Building2, MessageSquare, Users,
  FileText, CreditCard, Wallet, ArrowLeftRight, DollarSign,
  ShieldCheck, UserCog, FolderKanban, CheckSquare, Clock,
  Wrench, FileSignature,
} from "@/assets/icons/icons";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "super_admin" | "company_admin" | "employee" | "client";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

interface NavGroup {
  label: string;
  roles: Role[];
  items: NavItem[];
}

// ─── Nav Config ───────────────────────────────────────────────────────────────
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    roles: ["super_admin", "company_admin", "employee", "client"],
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["super_admin", "company_admin", "employee", "client"],
      },
    ],
  },
  {
    label: "Subscriber Management",
    roles: ["super_admin"],
    items: [
      { label: "Companies",        href: "/dashboard/companies",        icon: Building2,      roles: ["super_admin"] },
      { label: "Company Requests", href: "/dashboard/company-requests", icon: MessageSquare,  roles: ["super_admin"] },
      { label: "Clients",          href: "/dashboard/clients",          icon: Users,          roles: ["super_admin"] },
    ],
  },
  {
    label: "Financial Management",
    roles: ["super_admin", "company_admin"],
    items: [
      { label: "Invoices",            href: "/dashboard/invoices",            icon: FileText,       roles: ["super_admin", "company_admin"] },
      { label: "Payments",            href: "/dashboard/payments",            icon: CreditCard,     roles: ["super_admin", "company_admin"] },
      { label: "Wallets",             href: "/dashboard/wallets",             icon: Wallet,         roles: ["super_admin", "company_admin"] },
      { label: "Wallet Transactions", href: "/dashboard/wallet-transactions", icon: ArrowLeftRight, roles: ["super_admin", "company_admin"] },
      { label: "Currencies",          href: "/dashboard/currencies",          icon: DollarSign,     roles: ["super_admin", "company_admin"] },
    ],
  },
  {
    label: "Internal Operations",
    roles: ["super_admin", "company_admin", "employee"],
    items: [
      { label: "Roles",        href: "/dashboard/roles",        icon: ShieldCheck,   roles: ["super_admin", "company_admin"] },
      { label: "Employees",    href: "/dashboard/employees",    icon: UserCog,       roles: ["super_admin", "company_admin"] },
      { label: "Projects",     href: "/dashboard/projects",     icon: FolderKanban,  roles: ["super_admin", "company_admin", "employee"] },
      { label: "Tasks",        href: "/dashboard/tasks",        icon: CheckSquare,   roles: ["super_admin", "company_admin", "employee"] },
      { label: "Time Logs",    href: "/dashboard/time-logs",    icon: Clock,         roles: ["super_admin", "company_admin", "employee"] },
      { label: "Developments", href: "/dashboard/developments", icon: Wrench,        roles: ["super_admin", "company_admin", "client"] },
      { label: "Contracts",    href: "/dashboard/contracts",    icon: FileSignature, roles: ["super_admin", "company_admin", "client"] },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { state } = useSidebar(); // "expanded" | "collapsed"
  const role = user?.role as Role | undefined;

  const isCollapsed = state === "collapsed";

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
      className="border-e border-[var(--sidebar-border)] bg-[var(--sidebar-bg)]"
    >
      {/* ── Logo ── */}
      <SidebarHeader className="border-b border-[var(--sidebar-border)] px-4"
        style={{ height: "var(--navbar-height)", justifyContent: "center" }}
      >
        {isCollapsed ? (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto"
            style={{ background: "var(--color-bg-primary)" }}
          >
            <span style={{ color: "var(--color-text-button)", fontWeight: 700, fontSize: 14 }}>
              W
            </span>
          </div>
        ) : (
          <Logo />
        )}
      </SidebarHeader>

      {/* ── Nav Groups ── */}
      <SidebarContent className="px-2 py-3">
        {visibleGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0 mb-1">
            {/* Group Label — مخفي لما يكون collapsed */}
            {!isCollapsed && (
              <SidebarGroupLabel
                className="text-[0.7rem] font-bold uppercase tracking-widest px-3 mb-1"
                style={{ color: "var(--sidebar-group-label)" }}
              >
                {group.label}
              </SidebarGroupLabel>
            )}

            {isCollapsed && (
              <div className="my-1 border-t border-[var(--sidebar-border)]" />
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
                      tooltip={isCollapsed ? item.label : undefined}
                      className={cn(
                        "rounded-[10px] px-3 py-2 h-auto gap-2.5",
                        "text-[var(--sidebar-item-text)] font-medium text-sm",
                        "hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-item-active-text)]",
                        isActive && [
                          "bg-[var(--sidebar-item-active-bg)]",
                          "text-[var(--sidebar-item-active-text)]",
                          "font-bold",
                          "hover:bg-[var(--sidebar-item-active-bg)]",
                        ]
                      )}
                    >
                      <Link href={item.href}>
                        <Icon size={18} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
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