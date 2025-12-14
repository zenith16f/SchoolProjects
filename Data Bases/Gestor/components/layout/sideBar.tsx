// Imports
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Flag,
  House,
  Settings,
  SquareChartGantt,
  Tags,
  Wallet,
} from "lucide-react";
import SignOutButton from "../Kaizen/small/SignOutButton";

// Sidebar items
const items = [
  {
    title: "Inicio",
    url: "/Kaizen/home",
    icon: House,
  },
  {
    title: "Operaciones",
    url: "/Kaizen/operations",
    icon: SquareChartGantt,
  },
  {
    title: "Categorías",
    url: "/Kaizen/tags",
    icon: Tags,
  },
  {
    title: "Cuentas",
    url: "/Kaizen/accounts",
    icon: Wallet,
  },
  {
    title: "Metas de Ahorro",
    url: "/Kaizen/goals",
    icon: Flag,
  },
  {
    title: "Configuración",
    url: "/Kaizen/settings",
    icon: Settings,
  },
];

// Sidebar component
export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Aplicación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full px-4 pb-4">
          <SignOutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
