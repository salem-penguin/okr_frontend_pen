// User roles
export type UserRole = 'ceo' | 'team_leader' | 'team_member';

// Report status
export type ReportStatus = 'draft' | 'submitted';

// Report type
export type ReportType = 'leader' | 'member';

// Form field types
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId?: string;
  avatarUrl?: string;
}

// Team interface
export interface Team {
  id: string;
  name: string;
  leaderId: string;
}

// Week interface
export interface Week {
  isoWeekId: string; // Format: YYYY-WW
  weekStartDate: Date;
  weekEndDate: Date;
  displayLabel: string; // Format: "Week 03, 2026 (Jan 11 – Jan 17)"
}

// Form field option (for select fields)
export interface FieldOption {
  label: string;
  value: string;
}

// Form field definition
export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: FieldOption[]; // For select fields
}

// Form schema
export interface FormSchema {
  id: string;
  scope: 'leader' | 'member';
  teamId?: string; // For team-specific member forms
  leaderId?: string; // For leader-specific leader forms
  fields: FormField[];
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Weekly report
export interface WeeklyReport {
  id: string;
  weekId: string; // Format: YYYY-WW
  userId: string;
  teamId: string;
  reportType: ReportType;
  formId: string;
  formSnapshot: FormField[]; // Snapshot of form at submission time
  payload: Record<string, unknown>; // Form field values
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

// KPI data for dashboards
export interface KPIData {
  submittedCount: number;
  notSubmittedCount: number;
  totalCount: number;
}

// Dashboard table row for leader/member lists
export interface DashboardTableRow {
  id: string;
  name: string;
  teamName?: string;
  status: ReportStatus | 'not_submitted';
  submittedAt?: Date;
  reportId?: string;
}

// Auth context type
// export interface AuthContextType {
//   user: User | null;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
//   logout: () => void;
// }
// Auth result
export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string };

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}


// Theme type
export type Theme = 'light' | 'dark' | 'system';
