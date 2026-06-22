import { Contract, ContractStats } from "../types/contracts.types";

export const DUMMY_CONTRACTS: Contract[] = [
  {
    id: 1,
    customerName: "Ahmed Mohamed Al-Saeed",
    initial: "أ",
    title: "Advanced Technology Company",
    project: "Websit profile",
    company: "Advanced Tech Company",
  },
  {
    id: 2,
    customerName: "Laila Hassan Abdullah",
    initial: "ل",
    title: "Innovative Design Studio",
    project: "Company Overview",
    company: "Innovative Design Studio",
  },
  {
    id: 3,
    customerName: "Omar Khalid Faraj",
    initial: "ع",
    title: "Green Energy Solutions",
    project: "Corporate Profile",
    company: "Green Energy Solutions",
  },
  {
    id: 4,
    customerName: "Sara Ibrahim Nasser",
    initial: "س",
    title: "Global Finance Group",
    project: "Investor Relations",
    company: "Global Finance Group",
  },
  {
    id: 5,
    customerName: "Yousef Ali Majid",
    initial: "ي",
    title: "Creative Marketing Hub",
    project: "Marketing Insights",
    company: "Creative Marketing Hub",
  },
];

export const DUMMY_STATS: ContractStats = {
  activeContracts: { value: "$1,245,600.00", label: "active contracts" },
  pendingSignature: { value: "$84,500.00", label: "pending signature" },
  expiringSoon: { value: "$32,100.00", label: "expiring soon" },
};
