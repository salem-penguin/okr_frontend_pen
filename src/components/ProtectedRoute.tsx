// import { Navigate, useLocation } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext';
// import { UserRole } from '@/types';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   allowedRoles: UserRole[];
// }

// export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
//   const { user, isLoading } = useAuth();
//   const location = useLocation();

//   if (isLoading) {
//     return (
//       <div className="flex min-h-screen items-center justify-center bg-background">
//         <div className="flex flex-col items-center gap-4">
//           <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
//           <p className="text-muted-foreground">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   if (!allowedRoles.includes(user.role)) {
//     // Redirect to appropriate dashboard based on role
//     const dashboardPath = {
//       ceo: '/ceo',
//       team_leader: '/leader',
//       team_member: '/member',
//     }[user.role];

//     return <Navigate to={dashboardPath} replace />;
//   }

//   return <>{children}</>;
// }


import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[]; // ✅ optional for onboarding wrapper
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const pathname = location.pathname;

  // -----------------------------
  // Hard gates aligned with backend
  // -----------------------------
  if ((user as any).status === "disabled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <div className="text-lg font-semibold">Account Disabled</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is disabled. Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  // Safety net in case an old cookie exists.
  if ((user as any).email_verified === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center">
          <div className="text-lg font-semibold">Verify your email</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Please verify your email address using the link that was sent to you, then try again.
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Onboarding gates
  // -----------------------------
  const isOnSelectRole = pathname.startsWith("/select-role");
  const isOnJoinTeam = pathname.startsWith("/join-team");

  // robust teamId extraction (works with your normalizeUser + also supports team object if present)
  const teamId = (user as any).team?.id ?? user.teamId ?? null;

  // If role not set -> force select-role (do NOT apply allowedRoles yet)
  if (!user.role && !isOnSelectRole) {
    return <Navigate to="/select-role" replace />;
  }

  // If team missing for member/leader -> force join-team
  const needsTeam = user.role === "team_member" || user.role === "team_leader";
  if (needsTeam && !teamId && !isOnJoinTeam) {
    return <Navigate to="/join-team" replace />;
  }

  // If user tries to access onboarding pages after finishing onboarding, redirect home
  if (user.role && isOnSelectRole) {
    if (needsTeam && !teamId) return <Navigate to="/join-team" replace />;
    const home = user.role === "ceo" ? "/ceo" : user.role === "team_leader" ? "/leader" : "/member";
    return <Navigate to={home} replace />;
  }

  if (teamId && isOnJoinTeam) {
    const home = user.role === "ceo" ? "/ceo" : user.role === "team_leader" ? "/leader" : "/member";
    return <Navigate to={home} replace />;
  }

  // -----------------------------
  // Role gate for normal pages (only if allowedRoles is provided)
  // -----------------------------
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashboardPath =
      user.role === "ceo" ? "/ceo" : user.role === "team_leader" ? "/leader" : "/member";
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
