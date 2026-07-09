import AuthGuard from "@/guards/AuthGuard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/organisms/Sidebar";
import DashboardNavbar from "@/components/organisms/Dashboardnavbar";


import RouteGuard from "@/guards/RouteGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TooltipProvider>
        <SidebarProvider
          className="h-screen overflow-hidden w-full flex"
          style={{
            // desktop: العرض الكامل — mobile: أيقونات فقط (56px)
            "--sidebar-width": "240px",
            "--sidebar-width-icon": "56px",
          } as React.CSSProperties}
        >
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
            <DashboardNavbar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 ds-bg">
              <RouteGuard>{children}</RouteGuard>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  );
}