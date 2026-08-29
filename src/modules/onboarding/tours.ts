/**
 * What the guided tour points at.
 *
 * A step names a **selector**, not a component: the highlight is resolved from
 * the DOM at the moment the step opens, so a control that this account cannot
 * see — an add button behind a permission, the desktop sidebar on a phone —
 * simply drops out of the tour instead of pointing at nothing.
 *
 * Copy lives in `messages.onboarding`. A step's `copy` is the path under that
 * namespace, so nothing here builds a translation key that might not exist.
 */

import type { StepIcon } from "./OnboardingTour";

export interface TourStep {
  /** Unique within its tour; also the React key. */
  id: string;
  /** Message path under `onboarding`, e.g. `steps.search`. */
  copy: string;
  /** CSS selector for the element to spotlight. Omitted → a centred card. */
  target?: string;
  /** Extra breathing room around the highlight, in px. */
  padding?: number;
  /** Which glyph rides in the card's badge. */
  icon?: StepIcon;
}

export interface Tour {
  id: string;
  steps: TourStep[];
}

/** The furniture that is on screen whichever page they happened to land on. */
const WELCOME_STEPS: TourStep[] = [
  { id: "welcome", copy: "welcome", icon: "sparkles" },
  // The rail is `hidden md:block`, so on a phone this resolves to nothing and
  // the trigger step below takes over.
  { id: "sidebar", copy: "steps.sidebar", target: '[data-slot="sidebar-inner"]', padding: 0, icon: "sidebar" },
  { id: "sidebarTrigger", copy: "steps.sidebarTrigger", target: '[data-slot="sidebar-trigger"]', icon: "menu" },
  { id: "navbarActions", copy: "steps.navbarActions", target: '[data-tour="navbar-actions"]', icon: "bell" },
];

const OUTRO_STEP: TourStep = { id: "outro", copy: "outro", icon: "rocket" };

/**
 * The furniture every management page shares. Pages are built from the same
 * molecules, so one set of steps covers all of them — each page only adds its
 * own opening line.
 */
const COMMON_STEPS: TourStep[] = [
  { id: "pageActions", copy: "steps.pageActions", target: '[data-tour="page-actions"]', icon: "plus" },
  { id: "search", copy: "steps.search", target: '[data-tour="search"]', icon: "search" },
  { id: "table", copy: "steps.table", target: '[data-tour="table"]', icon: "table" },
];

/**
 * Every dashboard route that has an opening line written for it, keyed by the
 * first path segment. A route missing from here gets no page chapter at all
 * rather than a lookup for copy that does not exist.
 */
const PAGE_KEYS: Record<string, string> = {
  dashboard: "dashboard",
  kpis: "kpis",
  companies: "companies",
  "company-requests": "companyRequests",
  clients: "clients",
  contracts: "contracts",
  currencies: "currencies",
  wallets: "wallets",
  "wallet-transactions": "walletTransactions",
  invoices: "invoices",
  payments: "payments",
  projects: "projects",
  tasks: "tasks",
  sprints: "sprints",
  timesheets: "timesheets",
  developments: "developments",
  conversations: "conversations",
  meetings: "meetings",
  employees: "employees",
  roles: "roles",
  access: "access",
  salaries: "salaries",
  settings: "settings",
  profile: "profile",
};

/** Steps a particular page adds after its opening line. */
const PAGE_STEPS: Record<string, TourStep[]> = {
  dashboard: [
    { id: "hubs", copy: "steps.hubs", target: '[data-tour="hubs"]', icon: "hubs" },
    { id: "stats", copy: "steps.stats", target: '[data-tour="stats"]', icon: "stats" },
  ],
  sprints: [
    { id: "sprintView", copy: "steps.sprintView", target: '[data-tour="sprint-view-toggle"]', icon: "board" },
    { id: "pageActions", copy: "steps.pageActions", target: '[data-tour="page-actions"]', icon: "plus" },
    { id: "backlog", copy: "steps.backlog", target: '[data-tour="table"]', icon: "table" },
  ],
  conversations: [],
  profile: [],
  settings: [],
};

/** The first path segment, ignoring any locale-ish or trailing parts. */
function routeSegment(pathname: string): string {
  return pathname.split("?")[0].split("/").filter(Boolean)[0] ?? "";
}

/** The chapter about the page they are standing on, or `null` where none is written. */
export function tourForPath(pathname: string): TourStep[] | null {
  const segment = routeSegment(pathname);
  const key = PAGE_KEYS[segment];
  if (!key) return null;

  const extra = PAGE_STEPS[key] ?? COMMON_STEPS;
  return [{ id: "intro", copy: `pages.${key}`, icon: "compass" }, ...extra];
}

/**
 * The one guide an account is ever shown by itself: the platform's furniture,
 * then whatever the page they landed on is for, then a sign-off.
 *
 * It is a single tour rather than a welcome plus a hint per page because it
 * runs exactly once — anything left out of it is something the account will
 * never be told unless they ask for the replay.
 */
export function firstRunTour(pathname: string): Tour {
  return {
    id: "first-run",
    steps: [...WELCOME_STEPS, ...(tourForPath(pathname) ?? []), OUTRO_STEP],
  };
}
