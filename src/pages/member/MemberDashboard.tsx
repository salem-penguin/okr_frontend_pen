// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FileText, CheckCircle, Clock, Eye } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext';
// import * as api from '@/lib/mock-api';
// import { KPICard } from '@/components/shared/KPICard';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// export default function MemberDashboard() {
//   const { user } = useAuth();
//   const [currentWeek] = useState(() => api.getCurrentWeek());
//   const [currentReport, setCurrentReport] = useState<Awaited<ReturnType<typeof api.getReportForWeek>> | null>(null);
//   const [allReports, setAllReports] = useState<Awaited<ReturnType<typeof api.getReportsByUserId>>>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const loadData = async () => {
//       if (!user) return;
//       setIsLoading(true);
//       const [report, reports] = await Promise.all([
//         api.getReportForWeek(currentWeek.isoWeekId, user.id, 'member'),
//         api.getReportsByUserId(user.id),
//       ]);
//       setCurrentReport(report);
//       setAllReports(reports.filter(r => r.reportType === 'member'));
//       setIsLoading(false);
//     };
//     loadData();
//   }, [user, currentWeek.isoWeekId]);

//   if (!user?.teamId) {
//     return <EmptyState variant="no-team" title="No Team Assigned" description="You are not assigned to a team. Please contact an administrator." />;
//   }

//   if (isLoading) return <LoadingState />;

//   const submittedCount = allReports.filter(r => r.status === 'submitted').length;

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold">My Dashboard</h1>
//         <p className="text-muted-foreground">Track your weekly report submissions</p>
//       </div>

//       <Card>
//         <CardHeader className="flex flex-row items-center justify-between pb-2">
//           <CardTitle className="text-lg">Current Week: {currentWeek.displayLabel}</CardTitle>
//           <StatusPill status={currentReport?.status || 'not_submitted'} />
//         </CardHeader>
//         <CardContent>
//           {currentReport?.status === 'submitted' ? (
//             <div className="flex items-center gap-4">
//               <p className="text-sm text-muted-foreground">Submitted on {new Date(currentReport.submittedAt!).toLocaleDateString()}</p>
//               <Button variant="outline" size="sm" onClick={() => navigate(`/member/reports/${currentWeek.isoWeekId}`)}>
//                 <Eye className="mr-1 h-4 w-4" /> View Report
//               </Button>
//             </div>
//           ) : (
//             <Button onClick={() => navigate('/member/submit')}><FileText className="mr-2 h-4 w-4" /> Submit Weekly Report</Button>
//           )}
//         </CardContent>
//       </Card>

//       <div className="grid gap-4 sm:grid-cols-2">
//         <KPICard title="Reports Submitted" value={submittedCount} subtitle="All time" icon={CheckCircle} variant="success" />
//         <KPICard title="Current Status" value={currentReport ? 'Submitted' : 'Pending'} subtitle={currentWeek.displayLabel} icon={currentReport ? CheckCircle : Clock} variant={currentReport ? 'success' : 'warning'} />
//       </div>

//       <div>
//         <h2 className="text-lg font-semibold mb-4">Report History</h2>
//         {allReports.length === 0 ? (
//           <EmptyState title="No reports yet" description="You haven't submitted any reports yet." actionLabel="Submit Report" onAction={() => navigate('/member/submit')} />
//         ) : (
//           <div className="rounded-lg border bg-card">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Week</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Submitted</TableHead>
//                   <TableHead className="text-right">Action</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {allReports.map((report) => (
//                   <TableRow key={report.id}>
//                     <TableCell className="font-medium">{report.weekId}</TableCell>
//                     <TableCell><StatusPill status={report.status} /></TableCell>
//                     <TableCell>{report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : '—'}</TableCell>
//                     <TableCell className="text-right">
//                       <Button variant="ghost" size="sm" onClick={() => navigate(`/member/reports/${report.weekId}`)}>
//                         <Eye className="mr-1 h-4 w-4" /> View
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


// import { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FormField, Week } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import { apiFetch } from '@/api/client';

// import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
// import { WeekSelector } from '@/components/shared/WeekSelector';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { ExtraFieldsBuilder } from '@/components/form-builder/ExtraFieldsBuilder';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Eye, FileText, CheckCircle } from 'lucide-react';
// import { toast } from 'sonner';

// // Default member form fields (fallback if no form is configured)
// const defaultMemberFormFields: FormField[] = [
//   { id: 'accomplished', type: 'textarea', label: 'What did you accomplish this week?', placeholder: 'List your completed tasks...', required: true },
//   { id: 'next_week', type: 'textarea', label: 'What are you working on next week?', placeholder: 'Planned tasks for next week...', required: true },
//   { id: 'blockers', type: 'textarea', label: 'Any blockers or concerns?', placeholder: 'Issues that need attention...', required: false },
//   { id: 'need_support', type: 'checkbox', label: 'I need support from my manager', required: false },
// ];

// // --------------------
// // Backend response types
// // --------------------
// type CurrentWeekResponse = {
//   week_id: string;
//   start_date: string; // ISO
//   end_date: string;   // ISO
//   display_label: string;
// };

// type MeResponse = {
//   id: string;
//   name: string;
//   email: string;
//   role: string;
//   team: { id: string; name: string; leader_id: string | null } | null;
// };

// type ActiveFormResponse = {
//   id: string;
//   scope: 'member' | 'leader';
//   team_id: string | null;
//   leader_id: string | null;
//   version: number;
//   is_active: boolean;
//   fields: FormField[];
//   created_at: string;
//   updated_at: string;
// };

// type ReportStatus = 'draft' | 'submitted';

// type MyReportResponse = {
//   item: {
//     id: string;
//     week_id: string;
//     user_id: string;
//     team_id: string;
//     report_type: 'member' | 'leader';
//     status: ReportStatus;
//     form_id: string;
//     form_snapshot: unknown;
//     payload: Record<string, unknown>;
//     created_at: string;
//     updated_at: string;
//     submitted_at: string | null;
//   } | null;
// };

// type SaveDraftRequest = {
//   week_id: string;
//   report_type: 'member' | 'leader';
//   form_id: string;
//   payload: Record<string, unknown>;
// };

// type SaveDraftResponse = {
//   id: string;
//   week_id: string;
//   user_id: string;
//   team_id: string;
//   report_type: 'member' | 'leader';
//   status: ReportStatus;
//   form_id: string;
//   payload: Record<string, unknown>;
//   submitted_at: string | null;
//   created_at: string;
//   updated_at: string;
// };

// type SubmitRequest = {
//   week_id: string;
//   report_type: 'member' | 'leader';
// };

// type SubmitResponse = {
//   id: string;
//   week_id: string;
//   user_id: string;
//   report_type: 'member' | 'leader';
//   status: 'submitted';
//   submitted_at: string | null;
// };

// // --------------------
// // Helpers
// // --------------------
// function toWeek(w: CurrentWeekResponse): Week {
//   return {
//     isoWeekId: w.week_id,
//     weekStartDate: new Date(w.start_date),
//     weekEndDate: new Date(w.end_date),
//     displayLabel: w.display_label ?? w.week_id,
//   };
// }

// export default function MemberSubmitReport() {
//   const { user } = useAuth();
//   const userEmail = user?.email;

//   const navigate = useNavigate();

//   const [weeks, setWeeks] = useState<Week[]>([]);
//   const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

//   const [baseFormFields, setBaseFormFields] = useState<FormField[]>([]);
//   const [extraFields, setExtraFields] = useState<FormField[]>([]);
//   const [formId, setFormId] = useState<string>('');

//   const [existingReport, setExistingReport] = useState<MyReportResponse['item']>(null);

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);

//   const allFormFields = [...baseFormFields, ...extraFields];

//   // Boot: load current week
//   useEffect(() => {
//     const boot = async () => {
//       if (!userEmail) return;

//       setIsLoading(true);
//       try {
//         const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
//         const currentWeek = toWeek(cw);

//         setSelectedWeek(currentWeek);
//         setWeeks([currentWeek]); // until /weeks?limit=12 exists
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     boot();
//   }, [userEmail]);

//   const loadData = useCallback(async () => {
//     if (!userEmail) return;
//     if (!selectedWeek?.isoWeekId) return;

//     setIsLoading(true);
//     try {
//       const me = await apiFetch<MeResponse>('/me');
//       if (!me.team?.id) {
//         setBaseFormFields([]);
//         setFormId('');
//         setExistingReport(null);
//         setExtraFields([]);
//         return;
//       }

//       // 1) Load active member form for the team (or fallback)
//       try {
//         const form = await apiFetch<ActiveFormResponse>(
//           `/forms/active?scope=member&team_id=${encodeURIComponent(me.team.id)}`
//         );
//         setBaseFormFields(form.fields ?? []);
//         setFormId(form.id);
//       } catch (err) {
//         // 404 -> no active form
//         setBaseFormFields(defaultMemberFormFields);
//         setFormId('default_member_form'); // not in DB, but we will NOT submit draft with this id if we have no DB form
//       }

//       // 2) Check for existing report for this week
//       const report = await apiFetch<MyReportResponse>(
//         `/reports/me?week_id=${encodeURIComponent(selectedWeek.isoWeekId)}&report_type=member`
//       );
//       setExistingReport(report.item);

//       // 3) Restore extra fields if present
//       const payload = report.item?.payload ?? {};
//       const restored = (payload as any)?._extraFields;
//       setExtraFields(Array.isArray(restored) ? (restored as FormField[]) : []);
//     } catch (error) {
//       console.error('Failed to load report data:', error);
//       toast.error('Failed to load report data');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userEmail, selectedWeek?.isoWeekId]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const handleSaveDraft = useCallback(
//     async (values: Record<string, unknown>) => {
//       if (!userEmail) return;
//       if (!selectedWeek?.isoWeekId) return;

//       try {
//         const me = await apiFetch<MeResponse>('/me');
//         if (!me.team?.id) return;

//         // IMPORTANT:
//         // Your backend requires a REAL form_id that exists and is active for that team.
//         // If no form exists (we fell back to defaults), saving draft will fail.
//         if (!formId || formId === 'default_member_form') {
//           toast.error('No active form configured for your team. Ask your leader/CEO to create one.');
//           return;
//         }

//         const payloadWithExtras = {
//           ...values,
//           _extraFields: extraFields,
//         };

//         const body: SaveDraftRequest = {
//           week_id: selectedWeek.isoWeekId,
//           report_type: 'member',
//           form_id: formId,
//           payload: payloadWithExtras,
//         };

//         const draft = await apiFetch<SaveDraftResponse>('/reports/draft', {
//           method: 'POST',
//           body: JSON.stringify(body),
//         });

//         setExistingReport((prev) =>
//           prev
//             ? { ...prev, status: 'draft', payload: draft.payload, form_id: draft.form_id, submitted_at: null }
//             : {
//                 id: draft.id,
//                 week_id: draft.week_id,
//                 user_id: draft.user_id,
//                 team_id: draft.team_id,
//                 report_type: draft.report_type,
//                 status: draft.status,
//                 form_id: draft.form_id,
//                 form_snapshot: null,
//                 payload: draft.payload,
//                 created_at: draft.created_at,
//                 updated_at: draft.updated_at,
//                 submitted_at: draft.submitted_at,
//               }
//         );

//         setLastSaved(new Date());
//       } catch (error) {
//         console.error('Failed to save draft:', error);
//         toast.error('Failed to save draft');
//       }
//     },
//     [userEmail, selectedWeek?.isoWeekId, formId, extraFields]
//   );

//   const handleSubmit = async (values: Record<string, unknown>) => {
//     if (!userEmail) return;
//     if (!selectedWeek?.isoWeekId) return;

//     setIsSubmitting(true);
//     try {
//       const me = await apiFetch<MeResponse>('/me');
//       if (!me.team?.id) throw new Error('No team assigned');

//       if (!formId || formId === 'default_member_form') {
//         toast.error('No active form configured for your team. Ask your leader/CEO to create one.');
//         return;
//       }

//       const payloadWithExtras = {
//         ...values,
//         _extraFields: extraFields,
//       };

//       // 1) Save draft first (required by your submit endpoint which expects draft status)
//       const draft = await apiFetch<SaveDraftResponse>('/reports/draft', {
//         method: 'POST',
//         body: JSON.stringify({
//           week_id: selectedWeek.isoWeekId,
//           report_type: 'member',
//           form_id: formId,
//           payload: payloadWithExtras,
//         } satisfies SaveDraftRequest),
//       });

//       // 2) Submit the report (your backend expects week_id + report_type)
//       await apiFetch<SubmitResponse>('/reports/submit', {
//         method: 'POST',
//         body: JSON.stringify({
//           week_id: selectedWeek.isoWeekId,
//           report_type: 'member',
//         } satisfies SubmitRequest),
//       });

//       toast.success('Report submitted successfully!');
//       // Team leader of this team will now see it under:
//       // /reports?week_id=...&report_type=member (leader scope by team_id)
//       navigate('/member');
//     } catch (error) {
//       console.error('Failed to submit report:', error);
//       toast.error('Failed to submit report');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // UI Gates
//   if (!user?.teamId) {
//     return (
//       <div className="p-6">
//         <EmptyState
//           title="No Team Assigned"
//           description="You are not assigned to a team. Please contact an administrator."
//         />
//       </div>
//     );
//   }

//   if (isLoading || !selectedWeek) {
//     return <LoadingState message="Loading report form..." />;
//   }

//   // Already submitted for this week
//   if (existingReport?.status === 'submitted') {
//     return (
//       <div className="p-6 max-w-3xl mx-auto">
//         <Card>
//           <CardHeader className="text-center">
//             <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
//               <CheckCircle className="h-6 w-6 text-primary" />
//             </div>
//             <CardTitle>Report Already Submitted</CardTitle>
//             <CardDescription>You have already submitted your report for {selectedWeek.displayLabel}</CardDescription>
//           </CardHeader>
//           <CardContent className="flex flex-col items-center gap-4">
//             <StatusPill status="submitted" />
//             <p className="text-sm text-muted-foreground">
//               Submitted on {existingReport.submitted_at ? new Date(existingReport.submitted_at).toLocaleDateString() : '—'}
//             </p>
//             <div className="flex gap-3">
//               <Button variant="outline" onClick={() => navigate('/member')}>
//                 Back to Dashboard
//               </Button>
//               <Button onClick={() => navigate(`/member/reports/${selectedWeek.isoWeekId}`)}>
//                 <Eye className="h-4 w-4 mr-2" />
//                 View Report
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//         <div className="mt-6">
//           <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold flex items-center gap-2">
//             <FileText className="h-6 w-6" />
//             Submit Weekly Report
//           </h1>
//           <p className="text-muted-foreground mt-1">{selectedWeek.displayLabel}</p>
//         </div>

//         <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
//       </div>

//       {existingReport?.status === 'draft' && (
//         <Alert className="mb-6">
//           <AlertDescription className="flex items-center justify-between">
//             <span>You have a draft saved. Continue where you left off.</span>
//             <StatusPill status="draft" />
//           </AlertDescription>
//         </Alert>
//       )}

//       <div className="space-y-6">
//         <Card>
//           <CardHeader>
//             <CardTitle>Weekly Report</CardTitle>
//             <CardDescription>
//               Fill out your weekly report. Reports auto-save as drafts.
//               {lastSaved && <span className="block mt-1 text-xs">Last saved: {lastSaved.toLocaleTimeString()}</span>}
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <DynamicFormRenderer
//               fields={allFormFields}
//               initialValues={existingReport?.payload || {}}
//               onSubmit={handleSubmit}
//               onSaveDraft={handleSaveDraft}
//               isSubmitting={isSubmitting}
//               submitLabel="Submit Report"
//               showDraftButton={true}
//             />
//           </CardContent>
//         </Card>

//         <ExtraFieldsBuilder extraFields={extraFields} onExtraFieldsChange={setExtraFields} />
//       </div>
//     </div>
//   );
// }


import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, Eye } from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/api/client';

import { KPICard } from '@/components/shared/KPICard';
import { StatusPill } from '@/components/shared/StatusPill';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type CurrentWeekResponse = {
  week_id: string;
  start_date: string;
  end_date: string;
  display_label: string;
};

type ReportStatus = 'draft' | 'submitted';

type MyReportForWeekResponse = {
  item: {
    id: string;
    status: ReportStatus;
    submitted_at: string | null;
    payload: Record<string, unknown>;
    form_id: string;
  } | null;
};

type MyReportsListResponse = {
  items: Array<{
    id: string;
    week_id: string;
    report_type: 'member' | 'leader';
    status: ReportStatus;
    submitted_at: string | null;
  }>;
  count: number;
};

export default function MemberDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentWeek, setCurrentWeek] = useState<CurrentWeekResponse | null>(null);
  const [currentReport, setCurrentReport] = useState<MyReportForWeekResponse['item'] | null>(null);
  const [allReports, setAllReports] = useState<Array<{
    id: string;
    weekId: string;
    status: ReportStatus;
    submittedAt: string | null;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const submittedCount = useMemo(
    () => allReports.filter(r => r.status === 'submitted').length,
    [allReports]
  );

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // 1) current week
        const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
        setCurrentWeek(cw);

        // 2) current report for this week
        const my = await apiFetch<MyReportForWeekResponse>(
          `/reports/me?week_id=${encodeURIComponent(cw.week_id)}&report_type=member`
        );
        setCurrentReport(my.item);

        // 3) history (requires backend endpoint /reports/my)
        const history = await apiFetch<MyReportsListResponse>('/reports/my?report_type=member');

        const mapped = (history.items ?? [])
          .map(r => ({
            id: r.id,
            weekId: r.week_id,
            status: r.status,
            submittedAt: r.submitted_at ?? null,
          }))
          .sort((a, b) => (a.weekId < b.weekId ? 1 : a.weekId > b.weekId ? -1 : 0));

        setAllReports(mapped);
      } catch (e) {
        console.error('MemberDashboard load failed:', e);
        setCurrentWeek(null);
        setCurrentReport(null);
        setAllReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  if (!user?.teamId) {
    return (
      <EmptyState
        variant="no-team"
        title="No Team Assigned"
        description="You are not assigned to a team. Please contact an administrator."
      />
    );
  }

  if (isLoading) return <LoadingState />;

  if (!currentWeek) {
    return (
      <div className="p-6">
        <EmptyState
          title="Unable to load dashboard"
          description="Could not load current week."
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const pillStatus =
    currentReport?.status === 'submitted' ? 'submitted' :
    currentReport?.status === 'draft' ? 'draft' :
    'not_submitted';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">Track your weekly report submissions</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Current Week: {currentWeek.display_label}</CardTitle>
          <StatusPill status={pillStatus as any} />
        </CardHeader>
        <CardContent>
          {currentReport?.status === 'submitted' ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                Submitted on {currentReport.submitted_at ? new Date(currentReport.submitted_at).toLocaleDateString() : '—'}
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate(`/member/reports/${currentWeek.week_id}`)}>
                <Eye className="mr-1 h-4 w-4" /> View Report
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate('/member/submit')}>
              <FileText className="mr-2 h-4 w-4" /> Submit Weekly Report
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <KPICard title="Reports Submitted" value={submittedCount} subtitle="All time" icon={CheckCircle} variant="success" />
        <KPICard
          title="Current Status"
          value={currentReport?.status === 'submitted' ? 'Submitted' : 'Pending'}
          subtitle={currentWeek.display_label}
          icon={currentReport?.status === 'submitted' ? CheckCircle : Clock}
          variant={currentReport?.status === 'submitted' ? 'success' : 'warning'}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Report History</h2>

        {allReports.length === 0 ? (
          <EmptyState
            title="No reports yet"
            description="You haven't submitted any reports yet."
            actionLabel="Submit Report"
            onAction={() => navigate('/member/submit')}
          />
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.weekId}</TableCell>
                    <TableCell><StatusPill status={r.status} /></TableCell>
                    <TableCell>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/member/reports/${r.weekId}`)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
