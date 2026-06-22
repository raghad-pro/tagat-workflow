import type { Employee, EmployeeStats, EmployeesQueryParams } from "../types/employees.types";
import { DUMMY_EMPLOYEES, DUMMY_EMPLOYEE_STATS } from "../data/mockData";

export const employeeApi = {
  getAll: async (params?: EmployeesQueryParams) => {
    return new Promise<{ data: Employee[]; meta: { total: number } }>((resolve) => {
      setTimeout(() => {
        let filtered = [...DUMMY_EMPLOYEES];
        if (params?.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (e) => e.name.toLowerCase().includes(q) || e.company.toLowerCase().includes(q) || e.job.toLowerCase().includes(q)
          );
        }
        const page = params?.page || 1;
        const perPage = params?.per_page || 5;
        const start = (page - 1) * perPage;
        resolve({ data: filtered.slice(start, start + perPage), meta: { total: filtered.length } });
      }, 400);
    });
  },
  getStats: async () => new Promise<EmployeeStats>((resolve) => {
    setTimeout(() => resolve(DUMMY_EMPLOYEE_STATS), 300);
  }),
};
