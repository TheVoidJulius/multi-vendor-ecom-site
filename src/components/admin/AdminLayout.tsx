import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Tags, FolderOpen, ShoppingCart,
  Users, Ticket, Image, LogOut, ChevronLeft, Settings, Store,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
  SidebarMenuItem, SidebarMenuButton, SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Vendors", url: "/admin/vendors", icon: Store },
  { title: "Brands", url: "/admin/brands", icon: Tags },
  { title: "Categories", url: "/admin/categories", icon: FolderOpen },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Customers", url: "/admin/customers", icon: Users },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Banners", url: "/admin/banners", icon: Image },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { isAdmin, isLoading } = useAdminGuard();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const currentPage = navItems.find((n) => {
    if (n.url === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(n.url);
  });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/20">
        <Sidebar collapsible="icon">
          <SidebarContent className="bg-card border-r border-border/50">
            <SidebarGroup>
              <SidebarGroupLabel>
                <Link to="/admin" className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-[-0.02em] text-foreground">Veloura</span>
                  <span className="text-[8px] font-bold tracking-[0.15em] text-muted-foreground uppercase">Admin</span>
                </Link>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/admin"}
                          className="hover:bg-secondary/60 rounded-xl transition-all duration-200"
                          activeClassName="bg-gold/10 text-gold font-semibold"
                        >
                          <item.icon className="mr-2.5 h-4 w-4" />
                          <span className="text-[13px]">{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/" className="hover:bg-secondary/60 rounded-xl">
                        <ChevronLeft className="mr-2.5 h-4 w-4" />
                        <span className="text-[13px]">Back to Store</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => signOut()} className="hover:bg-destructive/10 hover:text-destructive rounded-xl">
                      <LogOut className="mr-2.5 h-4 w-4" />
                      <span className="text-[13px]">Sign Out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 flex items-center border-b border-border/50 px-5 bg-card/80 backdrop-blur-xl sticky top-0 z-10">
            <SidebarTrigger className="mr-4" />
            <div>
              <h1 className="text-sm font-bold text-foreground">{currentPage?.title || "Admin"}</h1>
            </div>
          </header>
          <main className="flex-1 p-5 md:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
