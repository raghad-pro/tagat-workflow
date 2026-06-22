import { Employee, EmployeeStats } from "../types/employees.types";

export const DUMMY_EMPLOYEES: Employee[] = [
  { id: 1, name: "Ahmed Mohamed Al-Saeed", company: "Advanced Tech Company", job: "UI & UX", currency: "ILS", salary: "800.00 / month", paymentType: "Monthly", status: "active" },
  { id: 2, name: "Sara Hamed Ali", company: "Innovatech Solutions", job: "Graphic Design", currency: "ILS", salary: "750.00 / month", paymentType: "Hourly", status: "active" },
  { id: 3, name: "Youssef Karim", company: "NextGen Software", job: "Backend Developer", currency: "USD", salary: "900.00 / month", paymentType: "Hourly", status: "active" },
  { id: 4, name: "Laila Samir", company: "Creative Minds Studio", job: "Content Strategist", currency: "USD", salary: "680.00 / month", paymentType: "Monthly", status: "onboarding" },
  { id: 5, name: "Omar Faisal", company: "Advanced Tech Company", job: "Project Manager", currency: "USD", salary: "1100.00 / month", paymentType: "Monthly", status: "active" },
  { id: 6, name: "Nora Khaled", company: "Innovatech Solutions", job: "Data Analyst", currency: "ILS", salary: "820.00 / month", paymentType: "Hourly", status: "onboarding" },
  { id: 7, name: "Bilal Hassan", company: "NextGen Software", job: "DevOps Engineer", currency: "USD", salary: "1200.00 / month", paymentType: "Monthly", status: "active" },
];

export const DUMMY_EMPLOYEE_STATS: EmployeeStats = {
  total: 247,
  active: 47,
  onboarding: 6,
};
