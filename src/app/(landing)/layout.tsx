import "@/modules/landing/styles/landing.css";
import { Chatbot } from "@/modules/landing/components/Chatbot";

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Chatbot />
    </>
  );
}
