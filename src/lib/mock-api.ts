import { User, Team, FormSchema, FormField, WeeklyReport, KPIData, DashboardTableRow, ReportStatus } from '@/types';
import { store, allUsers, teams } from './mock-data';
import { getCurrentWeek, getWeeks, createWeekFromId } from './week-utils';

// Simulate network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// ============ AUTH API ============

export async function login(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  await delay();
  
  // Simple mock auth - any password works, just check email
  const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return { user: null, error: 'Invalid email or password' };
  }
  
  return { user };
}

export async function getCurrentUser(): Promise<User | null> {
  await delay(100);
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

export async function logout(): Promise<void> {
  await delay(100);
  localStorage.removeItem('currentUser');
}

// ============ USERS API ============

export async function getTeamLeaders(): Promise<User[]> {
  await delay();
  return store.users.filter(u => u.role === 'team_leader');
}

export async function getTeamMembers(teamId: string): Promise<User[]> {
  await delay();
  return store.users.filter(u => u.role === 'team_member' && u.teamId === teamId);
}

export async function getUserById(userId: string): Promise<User | null> {
  await delay();
  return store.users.find(u => u.id === userId) || null;
}

// ============ TEAMS API ============

export async function getTeams(): Promise<Team[]> {
  await delay();
  return store.teams;
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  await delay();
  return store.teams.find(t => t.id === teamId) || null;
}

export async function getTeamByLeaderId(leaderId: string): Promise<Team | null> {
  await delay();
  return store.teams.find(t => t.leaderId === leaderId) || null;
}

// ============ WEEKS API ============

export { getCurrentWeek, getWeeks, createWeekFromId };

// ============ FORMS API ============

export async function getActiveForm(scope: 'leader' | 'member', teamId?: string): Promise<FormSchema | null> {
  await delay();
  
  // First check for team-specific form
  if (scope === 'member' && teamId) {
    const teamForm = store.formSchemas.find(f => f.scope === scope && f.teamId === teamId && f.isActive);
    if (teamForm) return teamForm;
  }
  
  // Fall back to default form
  return store.formSchemas.find(f => f.scope === scope && !f.teamId && f.isActive) || null;
}

// Get active leader form - can be default or leader-specific
export async function getActiveLeaderForm(leaderId?: string): Promise<FormSchema | null> {
  await delay();
  
  // If leaderId specified, check for leader-specific form first
  if (leaderId) {
    const leaderForm = store.formSchemas.find(
      f => f.scope === 'leader' && f.leaderId === leaderId && f.isActive
    );
    if (leaderForm) return leaderForm;
  }
  
  // Fall back to default leader form
  return store.formSchemas.find(f => f.scope === 'leader' && !f.leaderId && !f.teamId && f.isActive) || null;
}

export async function getFormById(formId: string): Promise<FormSchema | null> {
  await delay();
  return store.formSchemas.find(f => f.id === formId) || null;
}

export async function saveFormSchema(form: Omit<FormSchema, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<FormSchema> {
  await delay();
  
  // Deactivate existing forms of same scope/teamId/leaderId
  store.formSchemas.forEach(f => {
    if (f.scope === form.scope && f.teamId === form.teamId && f.leaderId === form.leaderId) {
      f.isActive = false;
    }
  });
  
  // Get highest version for this scope/teamId/leaderId
  const existingVersions = store.formSchemas
    .filter(f => f.scope === form.scope && f.teamId === form.teamId && f.leaderId === form.leaderId)
    .map(f => f.version);
  const newVersion = existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
  
  const newForm: FormSchema = {
    ...form,
    id: `form_${Date.now()}`,
    version: newVersion,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  store.formSchemas.push(newForm);
  return newForm;
}

// Save leader form - optionally for a specific leader
export async function saveLeaderFormSchema(fields: FormField[], leaderId?: string): Promise<FormSchema> {
  return saveFormSchema({
    scope: 'leader',
    fields,
    isActive: true,
    leaderId,
  });
}

// Save member form - optionally for a specific team
export async function saveMemberFormSchema(fields: FormField[], teamId?: string): Promise<FormSchema> {
  return saveFormSchema({
    scope: 'member',
    fields,
    isActive: true,
    teamId,
  });
}

// ============ REPORTS API ============

export async function getReportForWeek(
  weekId: string,
  userId: string,
  reportType: 'leader' | 'member'
): Promise<WeeklyReport | null> {
  await delay();
  return store.weeklyReports.find(
    r => r.weekId === weekId && r.userId === userId && r.reportType === reportType
  ) || null;
}

export async function getReportById(reportId: string): Promise<WeeklyReport | null> {
  await delay();
  return store.weeklyReports.find(r => r.id === reportId) || null;
}

export async function getReportsForWeek(weekId: string, reportType?: 'leader' | 'member'): Promise<WeeklyReport[]> {
  await delay();
  return store.weeklyReports.filter(r => {
    if (r.weekId !== weekId) return false;
    if (reportType && r.reportType !== reportType) return false;
    return true;
  });
}

export async function getReportsByUserId(userId: string): Promise<WeeklyReport[]> {
  await delay();
  return store.weeklyReports.filter(r => r.userId === userId);
}

export async function saveDraft(
  weekId: string,
  userId: string,
  teamId: string,
  reportType: 'leader' | 'member',
  formId: string,
  formSnapshot: FormSchema['fields'],
  payload: Record<string, unknown>
): Promise<WeeklyReport> {
  await delay();
  
  // Check if draft already exists
  const existingIndex = store.weeklyReports.findIndex(
    r => r.weekId === weekId && r.userId === userId && r.reportType === reportType
  );
  
  if (existingIndex !== -1) {
    const existing = store.weeklyReports[existingIndex];
    if (existing.status === 'submitted') {
      throw new Error('Cannot update a submitted report');
    }
    
    // Update existing draft
    store.weeklyReports[existingIndex] = {
      ...existing,
      payload,
      updatedAt: new Date(),
    };
    
    return store.weeklyReports[existingIndex];
  }
  
  // Create new draft
  const newReport: WeeklyReport = {
    id: `report_${Date.now()}`,
    weekId,
    userId,
    teamId,
    reportType,
    formId,
    formSnapshot,
    payload,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  store.weeklyReports.push(newReport);
  return newReport;
}

export async function submitReport(reportId: string): Promise<WeeklyReport> {
  await delay();
  
  const reportIndex = store.weeklyReports.findIndex(r => r.id === reportId);
  if (reportIndex === -1) {
    throw new Error('Report not found');
  }
  
  const report = store.weeklyReports[reportIndex];
  if (report.status === 'submitted') {
    throw new Error('Report already submitted');
  }
  
  store.weeklyReports[reportIndex] = {
    ...report,
    status: 'submitted',
    submittedAt: new Date(),
    updatedAt: new Date(),
  };
  
  return store.weeklyReports[reportIndex];
}

// ============ DASHBOARD DATA API ============

export async function getLeaderDashboardData(weekId: string): Promise<{
  kpi: KPIData;
  leaders: DashboardTableRow[];
}> {
  await delay();
  
  const leaders = await getTeamLeaders();
  const reports = await getReportsForWeek(weekId, 'leader');
  
  const dashboardRows: DashboardTableRow[] = leaders.map(leader => {
    const report = reports.find(r => r.userId === leader.id && r.status === 'submitted');
    const team = teams.find(t => t.id === leader.teamId);
    
    return {
      id: leader.id,
      name: leader.name,
      teamName: team?.name,
      status: report ? report.status : 'not_submitted',
      submittedAt: report?.submittedAt,
      reportId: report?.id,
    };
  });
  
  const submittedCount = dashboardRows.filter(r => r.status === 'submitted').length;
  
  return {
    kpi: {
      submittedCount,
      notSubmittedCount: leaders.length - submittedCount,
      totalCount: leaders.length,
    },
    leaders: dashboardRows,
  };
}

export async function getMemberDashboardData(weekId: string, teamId: string): Promise<{
  kpi: KPIData;
  members: DashboardTableRow[];
}> {
  await delay();
  
  const members = await getTeamMembers(teamId);
  const reports = store.weeklyReports.filter(
    r => r.weekId === weekId && r.reportType === 'member' && r.teamId === teamId && r.status === 'submitted'
  );
  
  const dashboardRows: DashboardTableRow[] = members.map(member => {
    const report = reports.find(r => r.userId === member.id);
    
    return {
      id: member.id,
      name: member.name,
      status: report ? report.status : 'not_submitted',
      submittedAt: report?.submittedAt,
      reportId: report?.id,
    };
  });
  
  const submittedCount = dashboardRows.filter(r => r.status === 'submitted').length;
  
  return {
    kpi: {
      submittedCount,
      notSubmittedCount: members.length - submittedCount,
      totalCount: members.length,
    },
    members: dashboardRows,
  };
}

// ============ ACCESS VALIDATION ============

export async function validateMemberAccess(leaderId: string, memberId: string): Promise<boolean> {
  await delay(100);
  
  const leader = store.users.find(u => u.id === leaderId && u.role === 'team_leader');
  const member = store.users.find(u => u.id === memberId && u.role === 'team_member');
  
  if (!leader || !member) return false;
  
  return leader.teamId === member.teamId;
}
