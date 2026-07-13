
import Logo from "@/components/atoms/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen ds-bg -mb-20 circle overflow-x-hidden"
    >
      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="flex justify-center pt-12 pb-8">
          <Logo />
        </div>
       <div className="flex-1 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}