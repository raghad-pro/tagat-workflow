import { CurrenciesPage } from "@/modules/currencies/components/CurrenciesPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Currencies Management",
  description: "Manage and configure global currencies for your organization.",
};

export default function Page() {
  return <CurrenciesPage />;
}
