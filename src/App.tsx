import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import LoginPage from "@/pages/LoginPage";
import CEODashboard from "@/pages/ceo/CEODashboard";
import CEOFormBuilder from "@/pages/ceo/CEOFormBuilder";
import CEOViewReport from "@/pages/ceo/CEOViewReport";
import LeaderDashboard from "@/pages/leader/LeaderDashboard";
import LeaderSubmitReport from "@/pages/leader/LeaderSubmitReport";
import LeaderFormBuilder from "@/pages/leader/LeaderFormBuilder";
import LeaderViewMemberReport from "@/pages/leader/LeaderViewMemberReport";
import MemberDashboard from "@/pages/member/MemberDashboard";
import MemberSubmitReport from "@/pages/member/MemberSubmitReport";
import MemberViewReport from "@/pages/member/MemberViewReport";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import CompanyOKRs from "./pages/ceo/CompanyOKRs";
import TeamLeaderOKRs from "./pages/leader/TeamLeadersOKRs";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* CEO Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ceo']}><AppLayout /></ProtectedRoute>}>
                <Route path="/ceo" element={<CEODashboard />} />
                <Route path="/ceo/form-builder" element={<CEOFormBuilder />} />
                <Route path="/ceo/reports/:weekId/:leaderId" element={<CEOViewReport />} />
                <Route path="/ceo/okrs" element={<CompanyOKRs />} />   {/* ✅ add this */}
              </Route>

              {/* Leader Routes */}
              <Route element={<ProtectedRoute allowedRoles={['team_leader']}><AppLayout /></ProtectedRoute>}>
                <Route path="/leader" element={<LeaderDashboard />} />
                <Route path="/leader/submit" element={<LeaderSubmitReport />} />
                <Route path="/leader/form-builder" element={<LeaderFormBuilder />} />
                <Route path="/leader/reports/:weekId/:memberId" element={<LeaderViewMemberReport />} />
                <Route path="/leader/okrs" element={<TeamLeaderOKRs />} />

              </Route>

              {/* Member Routes */}
              <Route element={<ProtectedRoute allowedRoles={['team_member']}><AppLayout /></ProtectedRoute>}>
                <Route path="/member" element={<MemberDashboard />} />
                <Route path="/member/submit" element={<MemberSubmitReport />} />
                <Route path="/member/reports/:weekId" element={<MemberViewReport />} />
              </Route>

              {/* Shared Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ceo', 'team_leader', 'team_member']}><AppLayout /></ProtectedRoute>}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
