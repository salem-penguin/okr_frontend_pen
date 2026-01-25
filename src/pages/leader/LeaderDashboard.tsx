// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Users, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext';
// import { Week } from '@/types';
// import * as api from '@/lib/mock-api';
// import { KPICard } from '@/components/shared/KPICard';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { WeekSelector } from '@/components/shared/WeekSelector';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Button } from '@/components/ui/button';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// export default function LeaderDashboard() {
//   const { user } = useAuth();
//   const [weeks] = useState(() => api.getWeeks(12));
//   const [selectedWeek, setSelectedWeek] = useState(() => api.getCurrentWeek());
//   const [data, setData] = useState<Awaited<ReturnType<typeof api.getMemberDashboardData>> | null>(null);
//   const [myReport, setMyReport] = useState<Awaited<ReturnType<typeof api.getReportForWeek>> | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadData = async () => {
//       if (!user?.teamId) return;
//       setIsLoading(true);
//       const [memberData, report] = await Promise.all([
//         api.getMemberDashboardData(selectedWeek.isoWeekId, user.teamId),
//         api.getReportForWeek(selectedWeek.isoWeekId, user.id, 'leader'),
//       ]);
//       setData(memberData);
//       setMyReport(report);
//       setIsLoading(false);
//     };
//     loadData();
//   }, [selectedWeek.isoWeekId, user?.teamId, user?.id]);

//   if (!user?.teamId) {
//     return <EmptyState variant="no-team" title="No Team Assigned" description="You are not assigned to a team. Please contact an administrator." />;
//   }

//   if (isLoading) return <LoadingState />;

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>
//           <p className="text-muted-foreground">Manage your team's weekly reports</p>
//         </div>
//         <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
//       </div>

//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between pb-2">
//           <CardTitle className="text-lg">My Weekly Report</CardTitle>
//           <StatusPill status={myReport?.status || 'not_submitted'} />
//         </CardHeader>
//         <CardContent>
//           {myReport?.status === 'submitted' ? (
//             <p className="text-sm text-muted-foreground">Submitted on {new Date(myReport.submittedAt!).toLocaleDateString()}</p>
//           ) : (
//             <Button onClick={() => navigate('/leader/submit')}><FileText className="mr-2 h-4 w-4" /> Submit Report</Button>
//           )}
//         </CardContent>
//       </Card>

//       <div className="grid gap-4 sm:grid-cols-3">
//         <KPICard title="Submitted" value={data?.kpi.submittedCount || 0} subtitle="Members submitted" icon={CheckCircle} variant="success" />
//         <KPICard title="Not Submitted" value={data?.kpi.notSubmittedCount || 0} subtitle="Pending" icon={XCircle} variant="warning" />
//         <KPICard title="Team Size" value={data?.kpi.totalCount || 0} subtitle="Total members" icon={Users} />
//       </div>

//       {data?.members.length === 0 ? (
//         <EmptyState title="No team members" description="Your team has no members yet." />
//       ) : (
//         <div className="rounded-lg border bg-card">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Submitted</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {data?.members.map((member) => (
//                 <TableRow key={member.id}>
//                   <TableCell className="font-medium">{member.name}</TableCell>
//                   <TableCell><StatusPill status={member.status} /></TableCell>
//                   <TableCell>{member.submittedAt ? new Date(member.submittedAt).toLocaleDateString() : '—'}</TableCell>
//                   <TableCell className="text-right">
//                     {member.status === 'submitted' && (
//                       <Button variant="ghost" size="sm" onClick={() => navigate(`/leader/reports/${selectedWeek.isoWeekId}/${member.id}`)}>
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


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// --------------------
// Backend response types
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  display_label: string;
};

type ReportStatus = 'draft' | 'submitted';
type DashboardStatus = 'submitted' | 'not_submitted';

type MyReportResponse = {
  item: {
    id: string;
    status: ReportStatus;
    submitted_at: string | null;
  } | null;
};

type ReportsListResponse = {
  items: Array<{
    submitter: { id: string; name: string };
    status: ReportStatus;
    submitted_at: string | null;
  }>;
  count: number;
};
type TeamMembersResponse = {
  items: Array<{ id: string; name: string; email: string; role: string }>;
  count: number;
};
type WeeksListResponse = {
  items: CurrentWeekResponse[];
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

export default function LeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const [data, setData] = useState<{
    kpi: { submittedCount: number; notSubmittedCount: number; totalCount: number };
    members: { id: string; name: string; status: DashboardStatus; submittedAt: string | null }[];
  } | null>(null);

  const [myReport, setMyReport] = useState<{
    status: DashboardStatus;
    submittedAt: string | null;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const userEmail = user?.email;

  // Boot: load current week from API and set selector state
  // useEffect(() => {
  //   const boot = async () => {
  //     if (!userEmail) return;

  //     setIsLoading(true);
  //     try {
  //       const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
  //       const currentWeek = toWeek(cw);

  //       setSelectedWeek(currentWeek);

  //       // Until you implement GET /weeks?limit=12, keep selector showing only current week.
  //       setWeeks([currentWeek]);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   boot();
  // }, [userEmail]);
  useEffect(() => {
  const boot = async () => {
    if (!userEmail) return;

    setIsLoading(true);
    try {
      // 1) Load last 12 weeks (backend: GET /weeks?limit=12)
      const weeksRes = await apiFetch<WeeksListResponse>('/weeks?limit=12');
      const weekObjects = (weeksRes.items ?? []).map(toWeek);

      // 2) Load current week (backend: GET /weeks/current)
      const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
      const currentWeek = toWeek(cw);

      // 3) Default selection: prefer current week if included, otherwise first week
      const found = weekObjects.find((w) => w.isoWeekId === currentWeek.isoWeekId);
      const selected = found ?? weekObjects[0] ?? currentWeek;

      setWeeks(weekObjects.length ? weekObjects : [currentWeek]);
      setSelectedWeek(selected);
    } catch (e) {
      console.error('Failed to boot weeks:', e);
      // fallback: at least try current week
      try {
        const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
        const currentWeek = toWeek(cw);
        setWeeks([currentWeek]);
        setSelectedWeek(currentWeek);
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  boot();
}, [userEmail]);


  // Load dashboard data whenever week changes
  // useEffect(() => {
  //   const loadData = async () => {
  //     if (!user?.teamId) return;
  //     if (!userEmail) return;
  //     if (!selectedWeek?.isoWeekId) return;

  //     setIsLoading(true);
  //     try {
  //       const weekId = selectedWeek.isoWeekId;

  //       // 1) My leader report for week
  //       const my = await apiFetch<MyReportResponse>(
  //         `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=leader`
  //       );

  //       setMyReport({
  //         status: toDashboardStatus(my.item?.status),
  //         submittedAt: my.item?.submitted_at ?? null,
  //       });

  //       // 2) Member reports list for KPI + table
  //       const list = await apiFetch<ReportsListResponse>(
  //         `/reports?week_id=${encodeURIComponent(weekId)}&report_type=member`
  //       );

  //       const members: { id: string; name: string; status: DashboardStatus; submittedAt: string | null }[] =
  //         list.items.map((r) => ({
  //           id: r.submitter.id,
  //           name: r.submitter.name,
  //           status: toDashboardStatus(r.status), // this is now strongly typed
  //           submittedAt: r.submitted_at,
  //         }));

  //       const submittedCount = members.filter((m) => m.status === 'submitted').length;
  //       const totalCount = members.length;
  //       const notSubmittedCount = totalCount - submittedCount;

  //       setData({
  //         kpi: { submittedCount, notSubmittedCount, totalCount },
  //         members,
  //       });
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   loadData();
  // }, [selectedWeek?.isoWeekId, user?.teamId, userEmail]);
  useEffect(() => {
  const loadData = async () => {
    if (!user?.teamId) return;
    if (!userEmail) return;
    if (!selectedWeek?.isoWeekId) return;

    setIsLoading(true);
    try {
      const weekId = selectedWeek.isoWeekId;

      // 1) My leader report for week
      const my = await apiFetch<MyReportResponse>(
        `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=leader`
      );

      setMyReport({
        status: toDashboardStatus(my.item?.status),
        submittedAt: my.item?.submitted_at ?? null,
      });

      // 2) Team roster: ALL members in my team (even if they did not submit)
      const roster = await apiFetch<TeamMembersResponse>(
        `/teams/${encodeURIComponent(user.teamId)}/members`
      );

      // 3) Member reports for week (ONLY those who created draft/submitted)
      const list = await apiFetch<ReportsListResponse>(
        `/reports?week_id=${encodeURIComponent(weekId)}&report_type=member`
      );

      // Index reports by member id
      const reportByUserId = new Map(
        (list.items ?? []).map((r) => [
          r.submitter.id,
          { status: r.status, submittedAt: r.submitted_at ?? null },
        ])
      );

      // Merge: ensure every team member appears
      const members: { id: string; name: string; status: DashboardStatus; submittedAt: string | null }[] =
        (roster.items ?? []).map((m) => {
          const rep = reportByUserId.get(m.id);
          return {
            id: m.id,
            name: m.name,
            status: toDashboardStatus(rep?.status),
            submittedAt: rep?.submittedAt ?? null,
          };
        });

      const submittedCount = members.filter((m) => m.status === 'submitted').length;
      const totalCount = members.length;
      const notSubmittedCount = totalCount - submittedCount;

      setData({
        kpi: { submittedCount, notSubmittedCount, totalCount },
        members,
      });
    } catch (e) {
      console.error('Failed to load leader dashboard:', e);
      setData({ kpi: { submittedCount: 0, notSubmittedCount: 0, totalCount: 0 }, members: [] });
    } finally {
      setIsLoading(false);
    }
  };

  loadData();
}, [selectedWeek?.isoWeekId, user?.teamId, userEmail]);


  if (!user?.teamId) {
    return (
      <EmptyState
        variant="no-team"
        title="No Team Assigned"
        description="You are not assigned to a team. Please contact an administrator."
      />
    );
  }

  if (isLoading || !selectedWeek) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>
          <p className="text-muted-foreground">Manage your team's weekly reports</p>
        </div>

        <WeekSelector
          weeks={weeks}
          selectedWeek={selectedWeek}
          onWeekChange={setSelectedWeek}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">My Weekly Report</CardTitle>
          <StatusPill status={myReport?.status || 'not_submitted'} />
        </CardHeader>
        <CardContent>
          {myReport?.status === 'submitted' ? (
            <p className="text-sm text-muted-foreground">
              Submitted on{' '}
              {myReport.submittedAt ? new Date(myReport.submittedAt).toLocaleDateString() : '—'}
            </p>
          ) : (
            <Button onClick={() => navigate('/leader/submit')}>
              <FileText className="mr-2 h-4 w-4" /> Submit Report
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPICard title="Submitted" value={data?.kpi.submittedCount || 0} subtitle="Members submitted" icon={CheckCircle} variant="success" />
        <KPICard title="Not Submitted" value={data?.kpi.notSubmittedCount || 0} subtitle="Pending" icon={XCircle} variant="warning" />
        <KPICard title="Team Size" value={data?.kpi.totalCount || 0} subtitle="Total members" icon={Users} />
      </div>

      {data?.members.length === 0 ? (
        <EmptyState title="No team members" description="Your team has no members yet." />
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell><StatusPill status={member.status} /></TableCell>
                  <TableCell>{member.submittedAt ? new Date(member.submittedAt).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-right">
                    {member.status === 'submitted' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/leader/reports/${selectedWeek.isoWeekId}/${member.id}`)}
                      >
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

