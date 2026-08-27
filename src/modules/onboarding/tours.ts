/**
 * What the guided tours point at.
 *
 * A step names a **selector**, not a component: the highlight is resolved from
 * the DOM at the moment the step opens, so a control that this account cannot
 * see — an add button behind a permission, the desktop sidebar on a phone —
 * simply drops out of the tour instead of pointing at nothing.
 *
 * Copy lives in `messages.onboarding`. A step's `copy` is the path under that
 * namespace, so nothing here builds a translation key that might not exist.
 */

export interface TourStep {
  /** Unique within its tour; also the React key. */
  id: string;
  /** Message path under `onboarding`, e.g. `steps.search`. */
  copy: string;
  /** CSS selector for the element to spotlight. Omitted → a centred card. */
  target?: string;
  /** Extra breathing room around the highlight, in px. */
  padding?: number;
}

export interface Tour {
  id: string;
  steps: TourStep[];
}

/** Shown once per account, on the first dashboard page they land on. */
export const WELCOME_TOUR: Tour = {
  id: "welcome",
  steps: [
    { id: "welcome", copy: "welcome" },
    // The rail is `hidden md:block`, so on a phone this resolves to nothing and
    // the trigger step below takes over.
    { id: "sidebar", copy: "steps.sidebar", target: '[data-slot="sidebar-inner"]', padding: 0 },
    { id: "sidebarTrigger", copy: "steps.sidebarTrigger", target: '[data-slot="sidebar-trigger"]' },
    { id: "navbarActions", copy: "steps.navbarActions", target: '[data-tour="navbar-actions"]' },
    { id: "outro", copy: "outro" },
  ],
};

/**
 * The furniture every management page shares. Pages are built from the same
 * molecules, so one set of steps covers all of them — each page only adds its
 * own opening line.
 */
const COMMON_STEPS: TourStep[] = [
  { id: "pageActions", copy: "steps.pageActions", target: '[data-tour="page-actions"]' },
  { id: "search", copy: "steps.search", target: '[data-tour="search"]' },
  { id: "table", copy: "steps.table", target: '[data-tour="table"]' },
];

/**
 * Every dashboard route that has an opening line written for it, keyed by the
 * first path segment. A route missing from here gets no tour at all rather than
 * a lookup for copy that does not exist.
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
    { id: "hubs", copy: "steps.hubs", target: '[data-tour="hubs"]' },
    { id: "stats", copy: "steps.stats", target: '[data-tour="stats"]' },
  ],
  sprints: [
    { id: "sprintView", copy: "steps.sprintView", target: '[data-tour="sprint-view-toggle"]' },
    { id: "pageActions", copy: "steps.pageActions", target: '[data-tour="page-actions"]' },
    { id: "backlog", copy: "steps.backlog", target: '[data-tour="table"]' },
  ],
  conversations: [],
  profile: [],
  settings: [],
};

/** The first path segment, ignoring any locale-ish or trailing parts. */
function routeSegment(pathname: string): string {
  return pathname.split("?")[0].split("/").filter(Boolean)[0] ?? "";
}

/**
 * The tour for a route, or `null` where none is written. Ids are namespaced by
 * route so each page is remembered separately — reading the projects hint does
 * not silence the invoices one.
 */
export function tourForPath(pathname: string): Tour | null {
  const segment = routeSegment(pathname);
  const key = PAGE_KEYS[segment];
  if (!key) return null;

  const extra = PAGE_STEPS[key] ?? COMMON_STEPS;
  return {
    id: `page:${key}`,
    steps: [{ id: "intro", copy: `pages.${key}` }, ...extra],
  };
}
