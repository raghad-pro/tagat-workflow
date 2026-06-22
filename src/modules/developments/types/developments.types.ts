import { GenericStatus } from "@/types/Shared.types";

export interface Development {
  id: number;
  title: string;
  project: string;
  client: string;
  budget: string;
  cost: string;
  status: GenericStatus;
}

export interface DevelopmentStats {
  total: number;
  underReview: number;
  approved: number;
}

export interface DevelopmentsQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

