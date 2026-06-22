
import Logo from "@/components/atoms/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen  ds-bg -mb-20 circle"
    >
      <div className="relative z-10  min-h-screen">
        <div className="flex justify-center">
          <Logo />
        
        </div>
       <div className=" ">
          {children}
        </div>
      </div>
    </div>
  );
}