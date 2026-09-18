import type { Metadata } from "next";
import VerifyAccountPage from "@/modules/auth/components/VerifyAccountPage";

export const metadata: Metadata = { title: "Verify your email" };

export default function Page() {
  return <VerifyAccountPage />;
}
