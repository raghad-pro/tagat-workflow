import { mockGetDashboard } from "@/lib/Mockdashboard";
import type { DashboardResponse } from "../types/dashboard.types";

export const dashboardApi = {
  getDashboard: () => mockGetDashboard(),
};
