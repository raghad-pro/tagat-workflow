
import Logo from "@/components/atoms/Logo";
import { BackButton } from "@/components/molecules/BackButton";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative h-[100dvh] ds-bg circle overflow-hidden flex flex-col w-full"
    >
      <BackButton />
      
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col items-center justify-center py-2 sm:py-4">
        <div className="flex justify-center mb-1 sm:mb-3 shrink-0">
          <Logo />
        </div>
       <div className="w-full shrink-0">
          {children}
        </div>
      </div>
    </div>
  );
}