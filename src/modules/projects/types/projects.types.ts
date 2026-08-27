// import { GenericStatus } from "@/types/Shared.types";

// export interface Project {
//   id: number;
//   title: string;
//   company: string;
//   client: string;
//   budget: string;
//   employees: string;
//   status: GenericStatus;
// }

// export interface ProjectStats {
//   totalProjects: { value: number; label: string };
//   inProgress: { value: number; label: string };
//   completed: { value: number; label: string };
// }

// export interface ProjectsQueryParams {
//   page?: number;
//   search?: string;
//   per_page?: number;
// }
import { GenericStatus } from "@/types/Shared.types";

export interface Project {
  id: number;
  title: string;
  name?: string;           // some API responses use `name` instead of `title`
  company: string | object;
  company_id?: number | string;
  client: string | object;
  client_id?: number | string;
  budget: string | number;
  employees: string | number | any[];
  status: GenericStatus;
}

export interface ProjectStats {
  totalProjects: { value: number; label: string };
  inProgress:    { value: number; label: string };
  completed:     { value: number; label: string };
}

export interface ProjectsQueryParams {
  page?:       number;
  search?:     string;
  per_page?:   number;
  company_id?: number;
}
/**
 * The project lead, as a **user** id — `employees[]` and `leader_id` are both
 * resolved against the users table by the API, so this is comparable with
 * `user.id` and never with an employee record id.
 *
 * The list and the show endpoint disagree on the shape: one sends `leader_id`,
 * the other a nested `leader`.
 */
export function leaderIdOf(project: unknown): number | null {
  const row = project as { leader_id?: unknown; leader?: { id?: unknown } } | null;
  const raw = row?.leader_id ?? row?.leader?.id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** True when this user leads the project. */
export function isProjectLeader(project: unknown, userId?: number | null): boolean {
  const leader = leaderIdOf(project);
  return leader !== null && Number(userId) === leader;
}

/**
 * The user id of a member row. The members relation comes back as `users[]`
 * (where `id` *is* the user id) or as `employees[]` (where the user id sits in
 * `user_id`), so both are read.
 */
export function memberUserIdOf(member: unknown): string {
  if (typeof member !== "object" || member === null) return String(member ?? "");
  const row = member as { user_id?: unknown; id?: unknown; user?: { id?: unknown } };
  return String(row.user_id ?? row.user?.id ?? row.id ?? "");
}
