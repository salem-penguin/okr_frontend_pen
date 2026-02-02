// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Users, CheckCircle, XCircle, Eye } from 'lucide-react';
// import { Week } from '@/types';
// import * as api from '@/lib/mock-api';
// import { KPICard } from '@/components/shared/KPICard';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { WeekSelector } from '@/components/shared/WeekSelector';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Button } from '@/components/ui/button';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// export default function CEODashboard() {
//   const [weeks] = useState(() => api.getWeeks(12));
//   const [selectedWeek, setSelectedWeek] = useState(() => api.getCurrentWeek());
//   const [data, setData] = useState<Awaited<ReturnType<typeof api.getLeaderDashboardData>> | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadData = async () => {
//       setIsLoading(true);
//       const result = await api.getLeaderDashboardData(selectedWeek.isoWeekId);
//       setData(result);
//       setIsLoading(false);
//     };
//     loadData();
//   }, [selectedWeek.isoWeekId]);

//   const handleViewReport = (leaderId: string) => {
//     navigate(`/ceo/reports/${selectedWeek.isoWeekId}/${leaderId}`);
//   };

//   if (isLoading) return <LoadingState />;

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">CEO Dashboard</h1>
//           <p className="text-muted-foreground">Overview of team leader submissions</p>
//         </div>
//         <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
//       </div>

//       <div className="grid gap-4 sm:grid-cols-3">
//         <KPICard title="Submitted" value={data?.kpi.submittedCount || 0} subtitle="Leaders submitted" icon={CheckCircle} variant="success" />
//         <KPICard title="Not Submitted" value={data?.kpi.notSubmittedCount || 0} subtitle="Pending reports" icon={XCircle} variant="warning" />
//         <KPICard title="Total Leaders" value={data?.kpi.totalCount || 0} subtitle="Team leaders" icon={Users} />
//       </div>

//       {data?.leaders.length === 0 ? (
//         <EmptyState title="No team leaders found" description="There are no team leaders configured in the system." />
//       ) : (
//         <div className="rounded-lg border bg-card">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Team</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Submitted</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {data?.leaders.map((leader) => (
//                 <TableRow key={leader.id}>
//                   <TableCell className="font-medium">{leader.name}</TableCell>
//                   <TableCell>{leader.teamName}</TableCell>
//                   <TableCell><StatusPill status={leader.status} /></TableCell>
//                   <TableCell>{leader.submittedAt ? new Date(leader.submittedAt).toLocaleDateString() : '—'}</TableCell>
//                   <TableCell className="text-right">
//                     {leader.status === 'submitted' && (
//                       <Button variant="ghost" size="sm" onClick={() => handleViewReport(leader.id)}>
//                         <Eye className="mr-1 h-4 w-4" /> View
//                       </Button>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       )}
//     </div>
//   );
// }


// src/pages/ceo/CEODashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Eye } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { Week } from '@/types';
import { apiFetch } from '@/api/client';

import { KPICard } from '@/components/shared/KPICard';
import { StatusPill } from '@/components/shared/StatusPill';
import { WeekSelector } from '@/components/shared/WeekSelector';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// --------------------
// Backend response types (match FastAPI)
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string; // ISO
  display_label: string;
};

type ReportStatus = 'draft' | 'submitted';
type DashboardStatus = 'submitted' | 'not_submitted';

type ReportsListItem = {
  id: string;
  week_id: string;
  team: { id: string; name: string };
  submitter: { id: string; name: string; email: string; role: string };
  report_type: 'member' | 'leader';
  status: ReportStatus;
  form_id: string;
  form_snapshot: unknown;
  payload: unknown;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type ReportsListResponse = {
  items: ReportsListItem[];
  count: number;
};

type WeeksListResponse = {
  items: CurrentWeekResponse[];
  count: number;
};

type LeadersListResponse = {
  items: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    team: { id: string; name: string; leader_id: string | null } | null;
  }>;
  count: number;
};

// --------------------
// Company-level OKRs types
// --------------------
type CompanyOKRChild = {
  id: string;
  title: string;
  team_name: string | null;
  progress: number; // 0-100
  parent_weight?: number; // optional
};

type CompanyLevelOKR = {
  id: string;
  title: string;
  progress: number; // 0-100 (aggregated)
  children: CompanyOKRChild[];
};

type CompanyLevelOKRsResponse = {
  items: CompanyLevelOKR[];
  count: number;
};

// --------------------
// Helpers
// --------------------
function toWeek(w: CurrentWeekResponse): Week {
  return {
    isoWeekId: w.week_id,
    weekStartDate: new Date(w.start_date),
    weekEndDate: new Date(w.end_date),
    displayLabel: w.display_label ?? w.week_id,
  };
}

function toDashboardStatus(status: ReportStatus | undefined | null): DashboardStatus {
  return status === 'submitted' ? 'submitted' : 'not_submitted';
}

function clamp01(x: number) {
  return Math.min(100, Math.max(0, x || 0));
}

function ProgressRing({
  value,
  size = 56,
  stroke = 6,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const v = clamp01(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute text-xs font-semibold tabular-nums">{Math.round(v)}%</div>
    </div>
  );
}

export default function CEODashboard() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const [data, setData] = useState<{
    kpi: { submittedCount: number; notSubmittedCount: number; totalCount: number };
    leaders: { id: string; name: string; teamName: string; status: DashboardStatus; submittedAt: string | null }[];
  } | null>(null);

  const [companyOKRs, setCompanyOKRs] = useState<CompanyLevelOKR[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Boot: load current week from API and set selector state
  useEffect(() => {
    const boot = async () => {
      if (!userEmail) return;

      setIsLoading(true);
      try {
        const weeksRes = await apiFetch<WeeksListResponse>('/weeks?limit=12');
        const weekObjects = (weeksRes.items ?? []).map(toWeek);

        const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
        const currentWeek = toWeek(cw);

        const found = weekObjects.find((w) => w.isoWeekId === currentWeek.isoWeekId);
        const selected = found ?? weekObjects[0] ?? currentWeek;

        setWeeks(weekObjects.length ? weekObjects : [currentWeek]);
        setSelectedWeek(selected);
      } finally {
        setIsLoading(false);
      }
    };

    boot();
  }, [userEmail]);

  // Load CEO dashboard data whenever week changes
  useEffect(() => {
    const loadData = async () => {
      if (!userEmail) return;
      if (!selectedWeek?.isoWeekId) return;

      setIsLoading(true);
      try {
        const weekId = selectedWeek.isoWeekId;

        // leaders + leader reports + company OKRs
        const [leadersRes, reportsRes, companyRes] = await Promise.all([
          apiFetch<LeadersListResponse>('/users?role=team_leader'),
          apiFetch<ReportsListResponse>(`/reports?week_id=${encodeURIComponent(weekId)}&report_type=leader`),
          apiFetch<CompanyLevelOKRsResponse>(`/okrs/company/level-progress?week_id=${encodeURIComponent(weekId)}`),
        ]);

        const leaders = leadersRes.items ?? [];
        const reports = reportsRes.items ?? [];

        setCompanyOKRs(companyRes.items ?? []);

        // Map reports by leaderId (submitter.id)
        const reportByLeaderId = new Map<string, ReportsListItem>();
        for (const r of reports) reportByLeaderId.set(r.submitter.id, r);

        // Build dashboard rows for ALL leaders
        const rows = leaders.map((l) => {
          const rep = reportByLeaderId.get(l.id);
          return {
            id: l.id,
            name: l.name,
            teamName: l.team?.name ?? '—',
            status: toDashboardStatus(rep?.status),
            submittedAt: rep?.submitted_at ?? null,
          };
        });

        const submittedCount = rows.filter((x) => x.status === 'submitted').length;
        const totalCount = rows.length;
        const notSubmittedCount = totalCount - submittedCount;

        setData({
          kpi: { submittedCount, notSubmittedCount, totalCount },
          leaders: rows,
        });
      } catch (err) {
        console.error('Failed to load CEO dashboard:', err);
        setCompanyOKRs([]);
        setData({
          kpi: { submittedCount: 0, notSubmittedCount: 0, totalCount: 0 },
          leaders: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedWeek?.isoWeekId, userEmail]);

  const handleViewReport = (leaderId: string) => {
    if (!selectedWeek?.isoWeekId) return;
    navigate(`/ceo/reports/${selectedWeek.isoWeekId}/${leaderId}`);
  };

  if (isLoading || !selectedWeek) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">CEO Dashboard</h1>
          <p className="text-muted-foreground">Overview of team leader submissions</p>
        </div>

        <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard
          title="Submitted"
          value={data?.kpi.submittedCount || 0}
          subtitle="Leaders submitted"
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Not Submitted"
          value={data?.kpi.notSubmittedCount || 0}
          subtitle="Pending reports"
          icon={XCircle}
          variant="warning"
        />
        <KPICard title="Total Leaders" value={data?.kpi.totalCount || 0} subtitle="Team leaders" icon={Users} />
      </div>

      {/* Company-level OKRs (between cards and table) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Company-level OKRs</h2>
            <p className="text-sm text-muted-foreground">Progress and child objectives by team</p>
          </div>
        </div>

        {companyOKRs.length === 0 ? (
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">No company-level OKRs found for the selected period.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {companyOKRs.map((okr) => (
              <div key={okr.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-muted-foreground">Company OKR</div>
                    <div className="mt-1 text-base font-semibold truncate">{okr.title}</div>
                  </div>

                  <ProgressRing value={okr.progress} />
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium">Children</div>

                  {(!okr.children || okr.children.length === 0) ? (
                    <p className="mt-2 text-sm text-muted-foreground">No child objectives linked yet.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {okr.children.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{c.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Team: <span className="font-medium">{c.team_name ?? 'Unassigned'}</span>
                              {typeof c.parent_weight === 'number' ? (
                                <>
                                  {' '}• Weight: <span className="font-medium">{c.parent_weight}</span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground tabular-nums">{Math.round(clamp01(c.progress))}%</div>
                            <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{ width: `${clamp01(c.progress)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leaders table */}
      {data?.leaders.length === 0 ? (
        <EmptyState title="No team leaders found" description="There are no team leaders configured in the system." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.leaders.map((leader) => (
                <TableRow key={leader.id}>
                  <TableCell className="font-medium">{leader.name}</TableCell>
                  <TableCell>{leader.teamName}</TableCell>
                  <TableCell>
                    <StatusPill status={leader.status} />
                  </TableCell>
                  <TableCell>{leader.submittedAt ? new Date(leader.submittedAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    {leader.status === 'submitted' && (
                      <Button variant="ghost" size="sm" onClick={() => handleViewReport(leader.id)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
