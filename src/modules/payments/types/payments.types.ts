export interface Payment {
  id: string;
  invoice: string;
  company: string;
  date: string;
  method: string;
  wallet: string;
  amount: number;
}
