import type { Metadata } from "next";
import Home from "@/modules/landing/components/Home";
import { landingMetadata } from "@/modules/landing/seo";
import { hasSessionCookie } from "@/modules/landing/session";

export const metadata: Metadata = landingMetadata("ar");

export default async function Page() {
  return <Home isAuthenticated={await hasSessionCookie()} />;
}
