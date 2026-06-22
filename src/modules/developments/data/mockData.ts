import { Development, DevelopmentStats } from "../types/developments.types";

export const DUMMY_DEVELOPMENTS: Development[] = [
  {
    id: 1,
    title: "Websit profile",
    project: "Websit profile",
    client: "Ahmed Mohamed Al-Saeed",
    budget: "₪ 400.00",
    cost: "$ 200.00",
    status: "in_progress",
  },
  {
    id: 2,
    title: "Mobile App Design",
    project: "Mobile App Design",
    client: "Sara El-Din Hassan",
    budget: "₪ 600.00",
    cost: "$ 300.00",
    status: "completed",
  },
  {
    id: 3,
    title: "Mobile App Design",
    project: "Mobile App Design",
    client: "Sara Khalid",
    budget: "₪ 600.00",
    cost: "$ 300.00",
    status: "completed",
  },
];

export const DUMMY_STATS: DevelopmentStats = {
  total: 142,
  underReview: 1204,
  approved: 45290,
};
