import { User, Team, FormSchema, WeeklyReport, FormField } from '@/types';
import { getCurrentWeek, getWeeks } from './week-utils';

// Generate unique IDs
let idCounter = 1;
const generateId = () => `id_${idCounter++}`;

// Teams
export const teams: Team[] = [
  { id: 'team_1', name: 'Engineering', leaderId: 'leader_1' },
  { id: 'team_2', name: 'Product', leaderId: 'leader_2' },
  { id: 'team_3', name: 'Design', leaderId: 'leader_3' },
  { id: 'team_4', name: 'Marketing', leaderId: 'leader_4' },
  { id: 'team_5', name: 'Sales', leaderId: 'leader_5' },
  { id: 'team_6', name: 'Customer Success', leaderId: 'leader_6' },
  { id: 'team_7', name: 'Operations', leaderId: 'leader_7' },
];

// CEO
export const ceo: User = {
  id: 'ceo_1',
  name: 'Sarah Chen',
  email: 'ceo@company.com',
  role: 'ceo',
  avatarUrl: undefined,
};

// Team Leaders
export const teamLeaders: User[] = [
  { id: 'leader_1', name: 'Alex Johnson', email: 'alex@company.com', role: 'team_leader', teamId: 'team_1' },
  { id: 'leader_2', name: 'Emily Brown', email: 'emily@company.com', role: 'team_leader', teamId: 'team_2' },
  { id: 'leader_3', name: 'Michael Lee', email: 'michael@company.com', role: 'team_leader', teamId: 'team_3' },
  { id: 'leader_4', name: 'Jessica Davis', email: 'jessica@company.com', role: 'team_leader', teamId: 'team_4' },
  { id: 'leader_5', name: 'Daniel Wilson', email: 'daniel@company.com', role: 'team_leader', teamId: 'team_5' },
  { id: 'leader_6', name: 'Amanda Martinez', email: 'amanda@company.com', role: 'team_leader', teamId: 'team_6' },
  { id: 'leader_7', name: 'Christopher Taylor', email: 'chris@company.com', role: 'team_leader', teamId: 'team_7' },
];

// Team Members
export const teamMembers: User[] = [
  // Engineering (team_1)
  { id: 'member_1', name: 'John Smith', email: 'john@company.com', role: 'team_member', teamId: 'team_1' },
  { id: 'member_2', name: 'Lisa Wang', email: 'lisa@company.com', role: 'team_member', teamId: 'team_1' },
  { id: 'member_3', name: 'Robert Chen', email: 'robert@company.com', role: 'team_member', teamId: 'team_1' },
  { id: 'member_4', name: 'Jennifer Liu', email: 'jennifer@company.com', role: 'team_member', teamId: 'team_1' },
  // Product (team_2)
  { id: 'member_5', name: 'David Kim', email: 'david@company.com', role: 'team_member', teamId: 'team_2' },
  { id: 'member_6', name: 'Sarah Miller', email: 'sarahm@company.com', role: 'team_member', teamId: 'team_2' },
  { id: 'member_7', name: 'Kevin Park', email: 'kevin@company.com', role: 'team_member', teamId: 'team_2' },
  // Design (team_3)
  { id: 'member_8', name: 'Rachel Green', email: 'rachel@company.com', role: 'team_member', teamId: 'team_3' },
  { id: 'member_9', name: 'Tom Anderson', email: 'tom@company.com', role: 'team_member', teamId: 'team_3' },
  { id: 'member_10', name: 'Sophia Turner', email: 'sophia@company.com', role: 'team_member', teamId: 'team_3' },
  // Marketing (team_4)
  { id: 'member_11', name: 'James Wilson', email: 'james@company.com', role: 'team_member', teamId: 'team_4' },
  { id: 'member_12', name: 'Emma Roberts', email: 'emma@company.com', role: 'team_member', teamId: 'team_4' },
  { id: 'member_13', name: 'Oliver Scott', email: 'oliver@company.com', role: 'team_member', teamId: 'team_4' },
  { id: 'member_14', name: 'Charlotte Harris', email: 'charlotte@company.com', role: 'team_member', teamId: 'team_4' },
  // Sales (team_5)
  { id: 'member_15', name: 'William Clark', email: 'william@company.com', role: 'team_member', teamId: 'team_5' },
  { id: 'member_16', name: 'Ava Thompson', email: 'ava@company.com', role: 'team_member', teamId: 'team_5' },
  { id: 'member_17', name: 'Lucas White', email: 'lucas@company.com', role: 'team_member', teamId: 'team_5' },
  // Customer Success (team_6)
  { id: 'member_18', name: 'Isabella Garcia', email: 'isabella@company.com', role: 'team_member', teamId: 'team_6' },
  { id: 'member_19', name: 'Mason Robinson', email: 'mason@company.com', role: 'team_member', teamId: 'team_6' },
  { id: 'member_20', name: 'Mia Hall', email: 'mia@company.com', role: 'team_member', teamId: 'team_6' },
  { id: 'member_21', name: 'Ethan Young', email: 'ethan@company.com', role: 'team_member', teamId: 'team_6' },
  // Operations (team_7)
  { id: 'member_22', name: 'Harper King', email: 'harper@company.com', role: 'team_member', teamId: 'team_7' },
  { id: 'member_23', name: 'Benjamin Wright', email: 'benjamin@company.com', role: 'team_member', teamId: 'team_7' },
  { id: 'member_24', name: 'Evelyn Hill', email: 'evelyn@company.com', role: 'team_member', teamId: 'team_7' },
];

// All users combined
export const allUsers: User[] = [ceo, ...teamLeaders, ...teamMembers];

// Default leader form fields
const defaultLeaderFormFields: FormField[] = [
  { id: 'field_1', type: 'textarea', label: 'Key Accomplishments This Week', placeholder: 'List your team\'s main achievements...', required: true },
  { id: 'field_2', type: 'textarea', label: 'Challenges & Blockers', placeholder: 'Any obstacles faced...', required: true },
  { id: 'field_3', type: 'textarea', label: 'Goals for Next Week', placeholder: 'What are the priorities for next week...', required: true },
  { id: 'field_4', type: 'number', label: 'Team Morale (1-10)', placeholder: '8', required: true },
  { id: 'field_5', type: 'select', label: 'Overall Progress Status', placeholder: 'Select status', required: true, options: [
    { label: 'On Track', value: 'on_track' },
    { label: 'At Risk', value: 'at_risk' },
    { label: 'Behind', value: 'behind' },
  ]},
  { id: 'field_6', type: 'textarea', label: 'Additional Notes', placeholder: 'Any other updates...', required: false },
];

// Default member form fields
const defaultMemberFormFields: FormField[] = [
  { id: 'field_m1', type: 'textarea', label: 'What did you accomplish this week?', placeholder: 'List your completed tasks...', required: true },
  { id: 'field_m2', type: 'textarea', label: 'What are you working on next week?', placeholder: 'Planned tasks for next week...', required: true },
  { id: 'field_m3', type: 'textarea', label: 'Any blockers or concerns?', placeholder: 'Issues that need attention...', required: false },
  { id: 'field_m4', type: 'checkbox', label: 'I need support from my manager', required: false },
];

// Form schemas
export const formSchemas: FormSchema[] = [
  {
    id: 'form_leader_default',
    scope: 'leader',
    fields: defaultLeaderFormFields,
    version: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'form_member_default',
    scope: 'member',
    fields: defaultMemberFormFields,
    version: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

// Generate sample reports
function generateSampleReports(): WeeklyReport[] {
  const reports: WeeklyReport[] = [];
  const weeks = getWeeks(4);
  const currentWeek = getCurrentWeek();
  
  // Generate some leader reports
  weeks.forEach((week, weekIndex) => {
    // Some leaders have submitted for past weeks
    teamLeaders.forEach((leader, leaderIndex) => {
      // 80% submission rate for past weeks, 50% for current week
      const shouldSubmit = weekIndex === 0 
        ? leaderIndex < 4 // Only first 4 leaders submitted this week
        : leaderIndex < 6; // 6 out of 7 submitted for past weeks
      
      if (shouldSubmit && leader.teamId) {
        const submittedAt = new Date(week.weekStartDate);
        submittedAt.setDate(submittedAt.getDate() + 4); // Submitted on Thursday
        
        reports.push({
          id: generateId(),
          weekId: week.isoWeekId,
          userId: leader.id,
          teamId: leader.teamId,
          reportType: 'leader',
          formId: 'form_leader_default',
          formSnapshot: defaultLeaderFormFields,
          payload: {
            field_1: `Completed sprint ${weekIndex + 1} goals, delivered 3 features on time.`,
            field_2: 'Some integration delays with third-party API.',
            field_3: 'Focus on Q1 OKRs and performance improvements.',
            field_4: 8,
            field_5: 'on_track',
            field_6: 'Team is performing well overall.',
          },
          status: 'submitted',
          createdAt: submittedAt,
          updatedAt: submittedAt,
          submittedAt: submittedAt,
        });
      }
    });
    
    // Generate some member reports
    teamMembers.forEach((member, memberIndex) => {
      // 70% submission rate for past weeks, 40% for current week
      const shouldSubmit = weekIndex === 0 
        ? memberIndex % 3 !== 0 // Some members haven't submitted this week
        : memberIndex % 5 !== 0; // Most submitted for past weeks
      
      if (shouldSubmit && member.teamId) {
        const submittedAt = new Date(week.weekStartDate);
        submittedAt.setDate(submittedAt.getDate() + 3 + (memberIndex % 3)); // Varied submission days
        
        reports.push({
          id: generateId(),
          weekId: week.isoWeekId,
          userId: member.id,
          teamId: member.teamId,
          reportType: 'member',
          formId: 'form_member_default',
          formSnapshot: defaultMemberFormFields,
          payload: {
            field_m1: `Worked on feature development and code reviews.`,
            field_m2: 'Continue with current sprint tasks.',
            field_m3: memberIndex % 4 === 0 ? 'Need clarification on requirements.' : '',
            field_m4: memberIndex % 5 === 0,
          },
          status: 'submitted',
          createdAt: submittedAt,
          updatedAt: submittedAt,
          submittedAt: submittedAt,
        });
      }
    });
  });
  
  return reports;
}

export const weeklyReports: WeeklyReport[] = generateSampleReports();

// Mutable store for runtime updates
export const store = {
  users: [...allUsers],
  teams: [...teams],
  formSchemas: [...formSchemas],
  weeklyReports: [...weeklyReports],
};
