import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  FormInput,
  Target,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const pathname = location.pathname;
  const isOnboarding =
    pathname.startsWith("/select-role") || pathname.startsWith("/join-team");
  if (isOnboarding) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ceo":
        return "CEO";
      case "team_leader":
        return "Team Leader";
      case "team_member":
        return "Team Member";
      default:
        return role || "Unknown";
    }
  };

  const getCeoMenuItems = (): MenuItem[] => [
    { title: "Dashboard", url: "/ceo", icon: LayoutDashboard },
    { title: "Company OKRs", url: "/ceo/okrs", icon: Target },
    { title: "OKR Tree", url: "/ceo/okr-alignment", icon: Layers },
    { title: "Form Builder", url: "/ceo/form-builder", icon: FormInput },
  ];

  const getLeaderMenuItems = (): MenuItem[] => [
    { title: "Dashboard", url: "/leader", icon: LayoutDashboard },
    { title: "Team OKRs", url: "/leader/okrs", icon: Target },
    { title: "Submit Report", url: "/leader/submit", icon: FileText },
    { title: "Team Form", url: "/leader/form-builder", icon: FormInput },
  ];

  const getMemberMenuItems = (): MenuItem[] => [
    { title: "Dashboard", url: "/member", icon: LayoutDashboard },
    { title: "Submit Report", url: "/member/submit", icon: FileText },
  ];

  const menuItems: MenuItem[] =
    (
      {
        ceo: getCeoMenuItems(),
        team_leader: getLeaderMenuItems(),
        team_member: getMemberMenuItems(),
      } as Record<string, MenuItem[]>
    )[user.role as string] ?? [];

  const isActive = (url: string) => {
    if (url === "/ceo" || url === "/leader" || url === "/member") {
      return pathname === url;
    }
    return pathname.startsWith(url);
  };

  return (
    <Sidebar className="border-r border-border/50 bg-card/60 backdrop-blur-2xl">
      {/* Brand */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-sm">
            WR
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Weekly Reports</span>
            <span className="text-[11px] text-muted-foreground">Internal Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="opacity-50" />

      <SidebarContent className="px-2 py-3">
        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`
                          group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                          transition-all duration-150
                          ${active
                            ? "bg-primary/10 text-primary font-medium shadow-sm"
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }
                        `}
                        activeClassName=""
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                        )}
                        <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        <span className="flex-1">{item.title}</span>
                        {active && (
                          <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {menuItems.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No navigation available yet.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account section */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="mb-1 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={`
                      group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                      transition-all duration-150
                      ${isActive("/settings")
                        ? "bg-primary/10 text-primary font-medium shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }
                    `}
                    activeClassName=""
                  >
                    {isActive("/settings") && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                    )}
                    <Settings className={`h-4 w-4 shrink-0 transition-colors ${isActive("/settings") ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <span className="flex-1">Settings</span>
                    {isActive("/settings") && (
                      <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="px-3 pb-4 pt-2">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50">
          <Avatar className="h-9 w-9 shadow-sm">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {getInitials(user.name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden leading-tight">
            <span className="truncate text-sm font-medium text-foreground">
              {user.name || "User"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {getRoleLabel((user as any).role)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
