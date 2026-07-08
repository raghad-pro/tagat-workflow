import { WalletTransactionsManagementPage } from "@/modules/wallet-transactions/components/WalletTransactionsManagementPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions Management",
  description: "Manage and monitor all wallet transactions",
};

export default function WalletTransactionsPage() {
  return <WalletTransactionsManagementPage />;
}
