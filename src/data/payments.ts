export type PaymentMethod = "Stripe" | "PayPal" | "Credit Card" | "Bank Transfer" | "Cash";
export type WalletType = "Stripe" | "PayPal" | "Credit Card" | "Bank Transfer" | "Cash";

export interface Payment {
  id: string;
  invoice: string;
  company: string;
  date: string;
  method: PaymentMethod;
  wallet: WalletType;
  amount: number;
  status: "paid" | "pending" | "failed";
  employee: string;
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
}

export const companies: Company[] = [
  { id: "c1", name: "Advanced Tech Company" },
  { id: "c2", name: "Green Energy Solutions" },
  { id: "c3", name: "Urban Design Studios" },
  { id: "c4", name: "CloudBase Systems" },
  { id: "c5", name: "NextGen Software" },
  { id: "c6", name: "Digital Wave Agency" },
  { id: "c7", name: "Prime Logistics Co." },
];

export const employees: Employee[] = [
  { id: "e1", name: "Ahmad Shanan" },
  { id: "e2", name: "Raghad Salem" },
  { id: "e3", name: "Alaa Kareem" },
  { id: "e4", name: "Zainab Al-Modallal" },
  { id: "e5", name: "Omar Nasser" },
];

export const paymentMethods: PaymentMethod[] = [
  "Stripe",
  "PayPal",
  "Credit Card",
  "Bank Transfer",
  "Cash",
];

export const wallets: WalletType[] = [
  "Stripe",
  "PayPal",
  "Credit Card",
  "Bank Transfer",
  "Cash",
];

export const paymentsData: Payment[] = [
  {
    id: "1",
    invoice: "#PAY-76845",
    company: "Advanced Tech Company",
    date: "2026-06-06 10:30",
    method: "Stripe",
    wallet: "Stripe",
    amount: 1500,
    status: "paid",
    employee: "Ahmad Shanan",
    notes: "Monthly subscription payment",
  },
  {
    id: "2",
    invoice: "#INV-2026-0234",
    company: "Advanced Tech Company",
    date: "2026-06-06 10:30",
    method: "PayPal",
    wallet: "PayPal",
    amount: 1500,
    status: "paid",
    employee: "Raghad Salem",
    notes: "Software license renewal",
  },
  {
    id: "3",
    invoice: "#INV-2026-0235",
    company: "Green Energy Solutions",
    date: "2026-06-07 14:15",
    method: "Credit Card",
    wallet: "Credit Card",
    amount: 3200,
    status: "pending",
    employee: "Alaa Kareem",
    notes: "Consulting services Q2",
  },
  {
    id: "4",
    invoice: "#INV-2026-0236",
    company: "Urban Design Studios",
    date: "2026-06-08 09:45",
    method: "Bank Transfer",
    wallet: "Bank Transfer",
    amount: 950,
    status: "paid",
    employee: "Zainab Al-Modallal",
  },
  {
    id: "5",
    invoice: "#INV-2026-0237",
    company: "CloudBase Systems",
    date: "2026-06-09 13:00",
    method: "Stripe",
    wallet: "Stripe",
    amount: 4750,
    status: "paid",
    employee: "Omar Nasser",
    notes: "Annual plan payment",
  },
  {
    id: "6",
    invoice: "#INV-2026-0238",
    company: "NextGen Software",
    date: "2026-06-10 11:20",
    method: "PayPal",
    wallet: "PayPal",
    amount: 2100,
    status: "pending",
    employee: "Ahmad Shanan",
    notes: "Development milestone 2",
  },
  {
    id: "7",
    invoice: "#INV-2026-0239",
    company: "Digital Wave Agency",
    date: "2026-06-11 16:05",
    method: "Credit Card",
    wallet: "Credit Card",
    amount: 870,
    status: "paid",
    employee: "Raghad Salem",
  },
  {
    id: "8",
    invoice: "#INV-2026-0240",
    company: "Prime Logistics Co.",
    date: "2026-06-12 08:30",
    method: "Bank Transfer",
    wallet: "Bank Transfer",
    amount: 5600,
    status: "pending",
    employee: "Alaa Kareem",
    notes: "Quarterly logistics fee",
  },
  {
    id: "9",
    invoice: "#INV-2026-0241",
    company: "Advanced Tech Company",
    date: "2026-06-13 14:45",
    method: "Cash",
    wallet: "Cash",
    amount: 320,
    status: "paid",
    employee: "Zainab Al-Modallal",
  },
  {
    id: "10",
    invoice: "#INV-2026-0242",
    company: "Green Energy Solutions",
    date: "2026-06-14 10:00",
    method: "Stripe",
    wallet: "Stripe",
    amount: 7890,
    status: "paid",
    employee: "Omar Nasser",
    notes: "Solar panel installation",
  },
  {
    id: "11",
    invoice: "#INV-2026-0243",
    company: "Urban Design Studios",
    date: "2026-06-15 12:30",
    method: "PayPal",
    wallet: "PayPal",
    amount: 1200,
    status: "pending",
    employee: "Ahmad Shanan",
  },
  {
    id: "12",
    invoice: "#INV-2026-0244",
    company: "CloudBase Systems",
    date: "2026-06-16 15:15",
    method: "Credit Card",
    wallet: "Credit Card",
    amount: 3400,
    status: "paid",
    employee: "Raghad Salem",
    notes: "Cloud hosting Q2",
  },
];

export const statsData = {
  totalRevenue: 1245890.0,
  totalRevenueChange: 12.5,
  pendingPayments: 45230.5,
  pendingInvoicesCount: 24,
  transactionVolume: 8432,
  transactionVolumeChange: 5.2,
};
