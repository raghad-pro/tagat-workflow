import AuthGuard from "@/guards/AuthGuard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/organisms/Sidebar";
import DashboardNavbar from "@/components/organisms/Dashboardnavbar";


import RouteGuard from "@/guards/RouteGuard";
import { OnboardingGate } from "@/modules/onboarding/OnboardingGate";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TooltipProvider>
        <SidebarProvider
          className="h-svh overflow-hidden"
          style={{
            // The hubs' pages unfold inside the column now, indented under
            // their hub, so the width has to carry the longest page name plus
            // that indent — not just the six hub names.
            "--sidebar-width": "218px",
            "--sidebar-width-icon": "56px",
          } as React.CSSProperties}
        >
          <AppSidebar />
          <SidebarInset className="relative circle overflow-x-hidden ds-bg-background">
            <DashboardNavbar />
            {/* `p-6` here stacked on top of each page's own `p-4 sm:p-6`, so a
                375px phone lost 80px — over a fifth of the screen — to nested
                gutters. Kept small rather than removed: /tasks and /projects
                set `p-0` on mobile and would otherwise sit flush to the edge. */}
            <main className="flex-1 overflow-y-auto p-2 sm:p-6 relative z-10">
              <RouteGuard>{children}</RouteGuard>
            </main>
            {/* Sits outside `main` on purpose: it portals to the body and
                points at the sidebar and the bar as well as the page. */}
            <OnboardingGate />
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </AuthGuard>
  );
}