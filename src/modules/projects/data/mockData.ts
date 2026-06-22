import { Project, ProjectStats } from "../types/projects.types";

export const DUMMY_PROJECTS: Project[] = [
  {
    id: 1,
    title: "Websit profile",
    company: "Advanced Tech Company",
    client: "Ahmed Mohamed Al-Saeed",
    budget: "₪ 400.00",
    employees: "Employees1",
    status: "pending",
  },
  {
    id: 2,
    title: "Mobile App Developer",
    company: "Innovatech Solutions",
    client: "Sara Khalil",
    budget: "₪ 320.00",
    employees: "Employees12",
    status: "pending",
  },
  {
    id: 3,
    title: "Sustainability Analyst",
    company: "Green Energy Corp",
    client: "Yousef Nabil",
    budget: "₪ 450.00",
    employees: "Employees5",
    status: "pending",
  },
  {
    id: 4,
    title: "Graphic Designer",
    company: "Creative Minds Studio",
    client: "Lina Faraj",
    budget: "₪ 380.00",
    employees: "Employees3",
    status: "pending",
  },
];

export const DUMMY_STATS: ProjectStats = {
  totalProjects: { value: 247, label: "total projects" },
  inProgress: { value: 47, label: "in progress" },
  completed: { value: 6, label: "completed" },
};
