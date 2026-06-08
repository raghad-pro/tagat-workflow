
// import Logo from "@/components/atoms/Logo";

// export default function AuthLayout({ children }:{children: React.ReactNode}) {
//   return (
//     <div className=" ds-bg -mb-20">
//       <div className="flex justify-center">
//         <Logo />
//       </div>
//       {children}
//     </div>
//   );
// }
import Logo from "@/components/atoms/Logo";
import Navbar from "@/components/organisms/Navbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen  ds-bg -mb-20 circle"
      // style={{
      //   background:
      //     "radial-gradient(circle at 85% 8%, var(--color-bg-primary-200) 0%, var(--color-bg-primary-200) 18%, transparent 48%), var(--color-bg)",
      // }}
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