import { Role, RoleStats } from "../types/roles.types";

export const DUMMY_ROLES: Role[] = [
  { id: 1, name: "Super Admin", description: "Full access to all modules and settings", usersCount: 2, type: "system", createdAt: "2023-01-01" },
  { id: 2, name: "Company Admin", description: "Manage company settings, employees, and roles", usersCount: 5, type: "system", createdAt: "2023-01-05" },
  { id: 3, name: "Project Manager", description: "Manage projects, tasks, and team members", usersCount: 12, type: "custom", createdAt: "2023-02-10" },
  { id: 4, name: "HR Manager", description: "Manage employee records, salaries, and attendance", usersCount: 3, type: "custom", createdAt: "2023-03-15" },
  { id: 5, name: "Employee", description: "Basic access to assigned tasks and time logs", usersCount: 150, type: "system", createdAt: "2023-01-10" },
  { id: 6, name: "Accountant", description: "Manage invoices, payments, and financial reports", usersCount: 4, type: "custom", createdAt: "2023-04-20" },
  { id: 7, name: "Client", description: "View project progress, developments, and contracts", usersCount: 45, type: "system", createdAt: "2023-01-15" },
];

export const DUMMY_ROLE_STATS: RoleStats = {
  total: 7,
  systemRoles: 4,
  customRoles: 3,
};
