import { Task, TaskStats } from "../types/tasks.types";

export const DUMMY_TASKS: Task[] = [
  {
    id: 1,
    company: "Advanced Tech Company",
    title: "Consequatur magna q",
    project: "UI && UX",
    employee: "Employee1",
    start: "2026/06/14 08:31",
    end: "2026/06/14 10:20",
    duration: "3h 49m",
    budget: "$ 133.58",
  },
  {
    id: 2,
    company: "Innovative Solutions Inc.",
    title: "Voluptas sit amet",
    project: "Frontend Developme...",
    employee: "Employee2",
    start: "2026/06/14 07:45",
    end: "2026/06/14 12:15",
    duration: "4h 30m",
    budget: "$ 160.75",
  },
  {
    id: 3,
    company: "Creative Minds Studio",
    title: "Doloribus est nulla",
    project: "Graphic Design",
    employee: "Employee3",
    start: "2026/06/14 09:00",
    end: "2026/06/14 11:30",
    duration: "2h 30m",
    budget: "$ 95.00",
  },
  {
    id: 4,
    company: "NextGen Robotics",
    title: "Quis autem vel",
    project: "Engineering",
    employee: "Employee4",
    start: "2026/06/14 08:20",
    end: "2026/06/14 14:00",
    duration: "5h 40m",
    budget: "$ 210.40",
  },
];

export const DUMMY_STATS: TaskStats = {
  activeTasks: { value: 142, label: "total active tasks" },
  loggedHours: { value: "1,204", label: "logged hours" },
  budgetUtilization: { value: "$45,290", label: "total budget utilization" },
};
