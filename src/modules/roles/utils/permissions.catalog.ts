import type { Permission } from "../types/roles.types";

/**
 * Turns the flat permission list from `GET /roles/form-permissions` into the
 * grouped structure the matrix renders.
 *
 * The catalog is always derived from that response, never hardcoded: it is
 * scoped per role on the server, and the published Postman collection is stale
 * (it documents 63 permissions where the API serves 86).
 */

/** One toggle in the matrix. May cover several ids — see `normalizeGroupKey`. */
export interface PermissionAction {
  action: string;
  ids: number[];
  /** Server-provided descriptions, kept for tooltips. */
  descriptions: string[];
}

export interface PermissionGroup {
  key: string;
  actions: PermissionAction[];
}

/**
 * The backend ships the same resource under two spellings —
 * `wallet_transactions.*` (ids 37-40) and `walletTransactions.*` (ids 72-74) —
 * so it appears twice with different, partially overlapping actions.
 *
 * Folding both to one key means the UI shows a single "Wallet Transactions"
 * group, and ticking an action grants *every* id spelled either way. Without
 * that, an admin could grant `wallet_transactions.view` and the server could
 * still refuse a check written against `walletTransactions.view`.
 */
export function normalizeGroupKey(group: string): string {
  return group
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase();
}

/** Splits `"wallets.create"` into its group and action halves. */
export function splitPermission(name: string): { group: string; action: string } {
  const dot = name.indexOf(".");
  if (dot === -1) return { group: normalizeGroupKey(name), action: "manage" };
  return {
    group: normalizeGroupKey(name.slice(0, dot)),
    action: name.slice(dot + 1),
  };
}

/** Most-used resources first; everything else falls through to alphabetical. */
const GROUP_ORDER = [
  "dashboard",
  "companies",
  "company_requests",
  "clients",
  "employees",
  "roles",
  "permissions",
  "projects",
  "sprints",
  "kanban",
  "tasks",
  "timesheets",
  "developments",
  "contracts",
  "conversations",
  "invoices",
  "payments",
  "wallets",
  "wallet_transactions",
  "currencies",
  "account",
  "settings",
  "system",
];

/** Read → write → destroy, so the risky toggles sit at the end of the row. */
const ACTION_ORDER = [
  "view",
  "create",
  "update",
  "delete",
  "assign",
  "approve",
  "reject",
  "join",
  "manage",
  "manage_status",
];

function orderBy(list: string[], value: string): number {
  const index = list.indexOf(value);
  return index === -1 ? list.length : index;
}

export function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const groups = new Map<string, Map<string, PermissionAction>>();

  for (const permission of permissions) {
    const { group, action } = splitPermission(permission.name);
    if (!groups.has(group)) groups.set(group, new Map());
    const actions = groups.get(group)!;

    const existing = actions.get(action);
    if (existing) {
      // Same action under both spellings of the group — merge the ids.
      if (!existing.ids.includes(permission.id)) existing.ids.push(permission.id);
      if (permission.description) existing.descriptions.push(permission.description);
    } else {
      actions.set(action, {
        action,
        ids: [permission.id],
        descriptions: permission.description ? [permission.description] : [],
      });
    }
  }

  return Array.from(groups.entries())
    .map(([key, actions]) => ({
      key,
      actions: Array.from(actions.values()).sort(
        (a, b) =>
          orderBy(ACTION_ORDER, a.action) - orderBy(ACTION_ORDER, b.action) ||
          a.action.localeCompare(b.action)
      ),
    }))
    .sort(
      (a, b) =>
        orderBy(GROUP_ORDER, a.key) - orderBy(GROUP_ORDER, b.key) ||
        a.key.localeCompare(b.key)
    );
}

/** Every permission id in a group, used by the group-level select-all. */
export const groupIds = (group: PermissionGroup): number[] =>
  group.actions.flatMap((a) => a.ids);

/** An action counts as granted only when all of its ids are selected. */
export const isActionChecked = (action: PermissionAction, selected: Set<number>): boolean =>
  action.ids.length > 0 && action.ids.every((id) => selected.has(id));

export type GroupState = "none" | "some" | "all";

export function groupState(group: PermissionGroup, selected: Set<number>): GroupState {
  const ids = groupIds(group);
  if (ids.length === 0) return "none";
  const hits = ids.filter((id) => selected.has(id)).length;
  if (hits === 0) return "none";
  return hits === ids.length ? "all" : "some";
}
