import type { Metadata } from "next";
import RegisterPage from "@/modules/auth/components/RegisterPage";

export const metadata: Metadata = { title: "Create an account" };

export default function Page() {
  return <RegisterPage />;
}
