import { AppSidebar } from "@/components/layout/sideBar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

// Layout component
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="p-10 min-h-screen w-lvw">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
