import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { clientApi } from "@/modules/clients/api/clients.api";
import { companyApi } from "@/modules/companies/api/companies.api";

export type ParticipantKind = "employee" | "client" | "company";

export interface Participant {
  /** `kind:userId` — ids are only unique *within* a kind, never across kinds. */
  key: string;
  kind: ParticipantKind;
  userId: number | string;
  name: string;
  email?: string;
  image?: string | null;
  roleLabel: string;
  company: string;
  /** Used to scope who a non-admin may talk to; names are not reliable keys. */
  companyId?: number | string;
}

function pickList(payload: unknown): any[] {
  if (Array.isArray(payload)) return payload;
  const p = payload as Record<string, any> | null;
  if (!p) return [];
  if (Array.isArray(p.data)) return p.data;
  if (Array.isArray(p.data?.data)) return p.data.data;
  return [];
}

/**
 * An employee/client row's `id` is its own record id — the conversation
 * endpoints want the *user* id, which lives on `user_id` / `user.id`. Returning
 * `undefined` when neither exists is deliberate: sending a record id would
 * silently add the wrong person.
 */
function resolveUserId(item: any): number | string | undefined {
  return item?.user_id ?? item?.user?.id ?? undefined;
}

function resolveName(item: any): string {
  const u = item?.user ?? {};
  const full = [u.first_name ?? item?.first_name, u.last_name ?? item?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    item?.employee_name ??
    item?.employeeName ??
    item?.name ??
    u.name ??
    (full || undefined) ??
    item?.email ??
    u.email ??
    "User"
  );
}

function resolveCompany(item: any, fallback: string): string {
  if (item?.companies?.length > 0) return item.companies[0].name;
  if (item?.company?.name) return item.company.name;
  if (typeof item?.company === "string") return item.company;
  if (item?.company_name) return item.company_name;
  return fallback;
}

/**
 * The company a row belongs to.
 *
 * A company row *is* the company, so its own id is the answer; clients arrive
 * with a `companies[]` relation rather than a column.
 */
function resolveCompanyId(item: any, kind: ParticipantKind): number | string | undefined {
  if (kind === "company") return item?.id;
  return item?.company_id ?? item?.company?.id ?? item?.companies?.[0]?.id ?? undefined;
}

function clientIsActive(item: any): boolean {
  const status = String(
    item?.status ?? item?.pivot?.status ?? item?.companies?.[0]?.pivot?.status ?? "pending"
  ).toLowerCase();
  return status === "approved" || status === "active";
}

/**
 * Everyone the signed-in user may start a conversation with, de-duplicated by
 * user id and grouped by company. Shared by the create-conversation and
 * add-member flows so both stay in sync.
 *
 * ## Scoping
 *
 * An **employee** may only reach colleagues at their own company. Both halves
 * of that are enforced here, because the server enforces neither:
 * `GET /employee/employees` returns staff from every company on the instance,
 * and the conversation endpoints accept any user id you send them.
 *
 * `companyId` therefore has to be known before anyone is offered. When it is
 * missing the list comes back **empty** rather than unfiltered — showing
 * strangers from other companies is the failure this exists to prevent, so
 * it fails closed.
 */
export function useParticipants(
  role: string,
  options: {
    enabled?: boolean;
    isSuperAdmin?: boolean;
    noCompanyLabel?: string;
    /** The signed-in user's company; required to scope a non-admin. */
    companyId?: number | string | null;
  } = {}
) {
  const {
    enabled = true,
    isSuperAdmin = false,
    noCompanyLabel = "No Company",
    companyId = null,
  } = options;

  const employeesQuery = useQuery({
    queryKey: ["employees", role],
    queryFn: () => employeeApi.getAll(role),
    enabled,
  });

  const clientsQuery = useQuery({
    queryKey: ["clients", role, "all"],
    queryFn: () => clientApi.getAll({ per_page: 100 }, role),
    // An employee never picks a client, so the request is pure waste for them.
    enabled: enabled && role !== "employee",
  });

  const companiesQuery = useQuery({
    queryKey: ["companies", "all"],
    queryFn: () => companyApi.getAll({ per_page: 100 }),
    enabled: enabled && isSuperAdmin,
  });

  const participants = useMemo<Participant[]>(() => {
    const out: Participant[] = [];
    const seen = new Set<string>();

    const push = (item: any, kind: ParticipantKind, roleLabel: string) => {
      const userId = resolveUserId(item);
      // Companies are only chat-able when the API exposes their owner user id.
      if (userId === undefined || userId === null || userId === "") return;
      const key = `${kind}:${userId}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        key,
        kind,
        userId,
        name: resolveName(item),
        email: item?.email ?? item?.user?.email,
        image: item?.image ?? item?.avatar ?? item?.user?.image ?? null,
        roleLabel,
        company: resolveCompany(item, kind === "company" ? item?.name : noCompanyLabel),
        companyId: resolveCompanyId(item, kind),
      });
    };

    if (isSuperAdmin) {
      pickList(companiesQuery.data).forEach((c) => push(c, "company", "Admin"));
    }
    pickList(employeesQuery.data).forEach((e) => push(e, "employee", "Employee"));
    pickList(clientsQuery.data)
      .filter((c) => isSuperAdmin || clientIsActive(c))
      .forEach((c) => push(c, "client", "Client"));

    // Only the employee role is narrowed. A company admin's `company_id` is
    // not dependable — `normalizeUser` falls back to their *user* id when the
    // API omits it — so filtering on it there would empty their list instead
    // of scoping it.
    if (role !== "employee") return out;

    // Colleagues only: no clients, no company admins.
    const colleagues = out.filter((p) => p.kind === "employee");

    if (companyId === null || companyId === undefined || companyId === "") {
      // Company unknown, so nobody can be *shown* to be a colleague. Failing
      // closed beats offering strangers from other companies.
      return [];
    }

    return colleagues.filter((p) => String(p.companyId ?? "") === String(companyId));
  }, [
    employeesQuery.data,
    clientsQuery.data,
    companiesQuery.data,
    isSuperAdmin,
    noCompanyLabel,
    role,
    companyId,
  ]);

  const grouped = useMemo(() => {
    const map = new Map<string, Participant[]>();
    participants.forEach((p) => {
      const list = map.get(p.company) ?? [];
      list.push(p);
      map.set(p.company, list);
    });
    return Array.from(map.entries());
  }, [participants]);

  return {
    participants,
    grouped,
    isLoading:
      employeesQuery.isLoading ||
      (role !== "employee" && clientsQuery.isLoading) ||
      (isSuperAdmin && companiesQuery.isLoading),
    isError:
      role === "employee"
        ? employeesQuery.isError
        : employeesQuery.isError && clientsQuery.isError,
  };
}
