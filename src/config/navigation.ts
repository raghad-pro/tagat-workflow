import {
  LayoutGrid,
  Building2, MessageSquare, MessageCircleMore, UsersRound, UserRoundPlus,
  FileText, CustomCardIcon, Wallet, ArrowUpDown, BadgePercent,
  ShieldCheck, FolderKanban, SquareCheck, Clock,
  Wrench, ScrollText, KeyRound, KanbanSquare, Video, BarChart3,
} from "@/assets/icons/icons";
import type { LucideIcon } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = "super_admin" | "company" | "employee" | "client";

export interface NavItem {
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

/**
 * A top-level section of the app. Hubs are the six tiles on the dashboard
 * launcher and the six icons on the sidebar rail — the same list, so a hub
 * that is empty for this user disappears from both at once.
 */
export interface NavHub {
  key: string;
  icon: LucideIcon | React.FC<any>;
  /** Fallback labels for when a translation key is missing. */
  label: string;
  arLabel: string;
  items: NavItem[];
}

// ─── Hubs ─────────────────────────────────────────────────────────────────────
export const NAV_HUBS: NavHub[] = [
  {
    key: "overview",
    icon: LayoutGrid,
    label: "Overview",
    arLabel: "نظرة عامة",
    items: [
      { key: "dashboard", href: "/dashboard", icon: LayoutGrid, roles: ["super_admin", "company", "employee", "client"] },
      { key: "kpis", href: "/kpis", icon: BarChart3, roles: ["super_admin", "company"], permission: "kpis.view" },
    ],
  },
  {
    key: "clientsHub",
    icon: Building2,
    label: "Clients & Subscriptions",
    arLabel: "العملاء والاشتراكات",
    items: [
      { key: "companies", href: "/companies", icon: Building2, roles: ["super_admin", "client"], permission: "companies.view" },
      { key: "companyRequests", href: "/company-requests", icon: MessageCircleMore, roles: ["super_admin", "company"], permission: "company_requests.view" },
      { key: "clients", href: "/clients", icon: UsersRound, roles: ["super_admin", "company"], permission: "clients.view" },
      { key: "contracts", href: "/contracts", icon: ScrollText, roles: ["super_admin", "company"], permission: "contracts.view" },
    ],
  },
  {
    key: "financeHub",
    icon: Wallet,
    label: "Finance",
    arLabel: "المالية",
    items: [
      { key: "currencies", href: "/currencies", icon: BadgePercent, roles: ["super_admin", "company"], permission: "currencies.view" },
      { key: "wallets", href: "/wallets", icon: Wallet, roles: ["super_admin", "company"], permission: "wallets.view" },
      { key: "walletTransactions", href: "/wallet-transactions", icon: ArrowUpDown, roles: ["super_admin", "company"], permission: "wallet_transactions.view" },
      { key: "invoices", href: "/invoices", icon: FileText, roles: ["super_admin", "company", "client"], permission: "invoices.view" },
      { key: "payments", href: "/payments", icon: CustomCardIcon, roles: ["super_admin", "company", "client"], permission: "payments.view" },
    ],
  },
  {
    key: "workHub",
    icon: FolderKanban,
    label: "Work & Projects",
    arLabel: "العمل والمشاريع",
    items: [
      { key: "projects", href: "/projects", icon: FileText, roles: ["super_admin", "company", "employee", "client"], permission: "projects.view" },
      { key: "tasks", href: "/tasks", icon: SquareCheck, roles: ["super_admin", "company", "employee"], permission: "tasks.view" },
      // The sprint routes are registered under the same three prefixes as tasks
      // — there is no `/client/sprints` — and a sprint is a view over tasks, so
      // it rides on the same permission.
      { key: "sprints", href: "/sprints", icon: KanbanSquare, roles: ["super_admin", "company", "employee"], permission: "tasks.view" },
      { key: "timesheets", href: "/timesheets", icon: Clock, roles: ["super_admin", "company", "employee"], permission: "timesheets.view" },
      { key: "developments", href: "/developments", icon: Wrench, roles: ["super_admin", "company"], permission: "developments.view" },
      // Front end only so far — the screen migrates CSV/Excel into the same
      // records this hub already owns, so it belongs beside them rather than
      // in a hub of its own.
      { key: "dataImport", href: "/data-import", icon: ArrowUpDown, roles: ["super_admin", "company"], permission: "data_import.view" },
    ],
  },
  {
    key: "communicationHub",
    icon: MessageSquare,
    label: "Communication",
    arLabel: "التواصل",
    items: [
      // The conversations API is exposed under every role prefix, and chats are
      // inherently cross-role (an admin messaging an employee or client).
      { key: "conversations", href: "/conversations", icon: MessageSquare, roles: ["super_admin", "company", "employee", "client"], permission: "conversations.view" },
      { key: "meetings", href: "/meetings", icon: Video, roles: ["super_admin", "company", "employee", "client"], permission: "meetings.view" },
    ],
  },
  {
    key: "teamHub",
    icon: ShieldCheck,
    label: "Team & Access",
    arLabel: "الفريق والصلاحيات",
    items: [
      { key: "employees", href: "/employees", icon: UserRoundPlus, roles: ["super_admin", "company"], permission: "employees.view" },
      { key: "roles", href: "/roles", icon: ShieldCheck, roles: ["super_admin", "company"], permission: "roles.view" },
      { key: "access", href: "/access", icon: KeyRound, roles: ["super_admin", "company"], permission: "employees.update" },
    ],
  },
];

/** The hub that owns `pathname`, or `undefined` for a page outside the hubs. */
export function findHubForPath(pathname: string, hubs: NavHub[] = NAV_HUBS) {
  return hubs.find((hub) =>
    hub.items.some(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )
  );
}

export function isItemActive(pathname: string, item: NavItem) {
  return pathname === item.href || pathname.startsWith(item.href + "/");
}
