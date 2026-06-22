export interface Employee {
  id: number;
  name: string;
  company: string;
  job: string;
  currency: string;
  salary: string;
  paymentType: "Monthly" | "Hourly";
  status: "active" | "onboarding" | "inactive";
  avatar?: string;
}

export interface EmployeeStats {
  total: number;
  active: number;
  onboarding: number;
}

export interface EmployeesQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface AddEmployeeFormValues {
  employeeName: string;
  email: string;
  paymentType: string;
  jobTitle: string;
  password: string;
  hourlyRate: string;
  currency: string;
  company: string;
}
