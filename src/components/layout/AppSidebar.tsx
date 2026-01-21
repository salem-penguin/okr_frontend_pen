// import { useLocation, useNavigate } from 'react-router-dom';
// import {
//   LayoutDashboard,
//   FileText,
//   Settings,
//   LogOut,
//   Users,
//   ClipboardList,
//   FormInput,
//   Target,
// } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext';
// import { NavLink } from '@/components/NavLink';
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarSeparator,
// } from '@/components/ui/sidebar';
// import { Avatar, AvatarFallback } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';

// export function AppSidebar() {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();

//   if (!user) return null;

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   };

//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const getRoleLabel = (role: string) => {
//     switch (role) {
//       case 'ceo':
//         return 'CEO';
//       case 'team_leader':
//         return 'Team Leader';
//       case 'team_member':
//         return 'Team Member';
//       default:
//         return role;
//     }
//   };

//   const getCeoMenuItems = () => [
//     { title: 'Dashboard', url: '/ceo', icon: LayoutDashboard },
//     { title: 'Form Builder', url: '/ceo/form-builder', icon: FormInput },
//     { title: 'Company OKRs', url: '/ceo/okrs', icon: Target },
//   ];

//   const getLeaderMenuItems = () => [
//     { title: 'Dashboard', url: '/leader', icon: LayoutDashboard },
//     { title: 'Submit Report', url: '/leader/submit', icon: FileText },
//     { title: 'Team Form', url: '/leader/form-builder', icon: FormInput },
//     { title: 'Team OKRs', url: '/leader/okrs', icon: Target },
//   ];

//   const getMemberMenuItems = () => [
//     { title: 'Dashboard', url: '/member', icon: LayoutDashboard },
//     { title: 'Submit Report', url: '/member/submit', icon: FileText },
//   ];

//   const menuItems = {
//     ceo: getCeoMenuItems(),
//     team_leader: getLeaderMenuItems(),
//     team_member: getMemberMenuItems(),
//   }[user.role];

//   return (
//     <Sidebar>
//       <SidebarHeader className="p-4">
//         <div className="flex items-center gap-3">
//           <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
//             WR
//           </div>
//           <div className="flex flex-col">
//             <span className="text-sm font-semibold">Weekly Reports</span>
//             <span className="text-xs text-muted-foreground">Internal Portal</span>
//           </div>
//         </div>
//       </SidebarHeader>

//       <SidebarSeparator />

//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupLabel>Navigation</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               {menuItems.map(item => (
//                 <SidebarMenuItem key={item.title}>
//                   <SidebarMenuButton asChild>
//                     <NavLink
//                       to={item.url}
//                       className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
//                       activeClassName="bg-accent text-accent-foreground font-medium"
//                     >
//                       <item.icon className="h-4 w-4" />
//                       <span>{item.title}</span>
//                     </NavLink>
//                   </SidebarMenuButton>
//                 </SidebarMenuItem>
//               ))}
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>

//         <SidebarGroup>
//           <SidebarGroupLabel>Account</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               <SidebarMenuItem>
//                 <SidebarMenuButton asChild>
//                   <NavLink
//                     to="/settings"
//                     className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
//                     activeClassName="bg-accent text-accent-foreground font-medium"
//                   >
//                     <Settings className="h-4 w-4" />
//                     <span>Settings</span>
//                   </NavLink>
//                 </SidebarMenuButton>
//               </SidebarMenuItem>
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>

//       <SidebarFooter className="p-4">
//         <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
//           <Avatar className="h-9 w-9">
//             <AvatarFallback className="bg-primary text-primary-foreground text-xs">
//               {getInitials(user.name)}
//             </AvatarFallback>
//           </Avatar>
//           <div className="flex flex-1 flex-col overflow-hidden">
//             <span className="truncate text-sm font-medium">{user.name}</span>
//             <span className="truncate text-xs text-muted-foreground">
//               {getRoleLabel(user.role)}
//             </span>
//           </div>
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={handleLogout}
//             className="h-8 w-8 shrink-0"
//           >
//             <LogOut className="h-4 w-4" />
//           </Button>
//         </div>
//       </SidebarFooter>
//     </Sidebar>
//   );
// }
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  FormInput,
  Target,
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

  // Not logged in → no sidebar
  if (!user) return null;

  // During onboarding we hide navigation entirely
  const pathname = location.pathname;
  const isOnboarding =
    pathname.startsWith("/select-role") || pathname.startsWith("/join-team");

  if (isOnboarding) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
    { title: "Form Builder", url: "/ceo/form-builder", icon: FormInput },
    { title: "Company OKRs", url: "/ceo/okrs", icon: Target },
  ];

  const getLeaderMenuItems = (): MenuItem[] => [
    { title: "Dashboard", url: "/leader", icon: LayoutDashboard },
    { title: "Submit Report", url: "/leader/submit", icon: FileText },
    { title: "Team Form", url: "/leader/form-builder", icon: FormInput },
    { title: "Team OKRs", url: "/leader/okrs", icon: Target },
  ];

  const getMemberMenuItems = (): MenuItem[] => [
    { title: "Dashboard", url: "/member", icon: LayoutDashboard },
    { title: "Submit Report", url: "/member/submit", icon: FileText },
  ];

  // ✅ Always resolve to an array (never undefined)
  const menuItems: MenuItem[] =
    (
      {
        ceo: getCeoMenuItems(),
        team_leader: getLeaderMenuItems(),
        team_member: getMemberMenuItems(),
      } as Record<string, MenuItem[]>
    )[user.role as string] ?? [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            WR
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Weekly Reports</span>
            <span className="text-xs text-muted-foreground">Internal Portal</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                      activeClassName="bg-accent text-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Optional: if role is missing/invalid, show a helper item instead of a blank menu */}
              {menuItems.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No navigation available yet.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    activeClassName="bg-accent text-accent-foreground font-medium"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(user.name || "U")}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">
              {user.name || "User"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {getRoleLabel((user as any).role)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
