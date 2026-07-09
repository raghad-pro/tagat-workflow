import { Metadata } from "next";
import { PaymentsWrapper } from "@/modules/payments/components/PaymentsWrapper";

export const metadata: Metadata = {
  title: "Payments | WorkFlow",
  description: "Track and manage payments across companies",
};

export default function PaymentsPage() {
  return <PaymentsWrapper />;
}
