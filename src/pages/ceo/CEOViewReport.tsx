// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { WeeklyReport, User, Team } from '@/types';
// import * as api from '@/lib/mock-api';
// import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, Calendar, User as UserIcon, Building } from 'lucide-react';

// export default function CEOViewReport() {
//   const { weekId, leaderId } = useParams<{ weekId: string; leaderId: string }>();
//   const navigate = useNavigate();
//   const [report, setReport] = useState<WeeklyReport | null>(null);
//   const [leader, setLeader] = useState<User | null>(null);
//   const [team, setTeam] = useState<Team | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     async function loadData() {
//       if (!weekId || !leaderId) return;
      
//       setIsLoading(true);
//       try {
//         const [reportData, leaderData] = await Promise.all([
//           api.getReportForWeek(weekId, leaderId, 'leader'),
//           api.getUserById(leaderId),
//         ]);
        
//         setReport(reportData);
//         setLeader(leaderData);
        
//         if (leaderData?.teamId) {
//           const teamData = await api.getTeamById(leaderData.teamId);
//           setTeam(teamData);
//         }
//       } catch (error) {
//         console.error('Failed to load report:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadData();
//   }, [weekId, leaderId]);

//   if (isLoading) {
//     return <LoadingState message="Loading report..." />;
//   }

//   if (!report || !leader) {
//     return (
//       <div className="p-6">
//       <EmptyState
//           title="Report Not Found"
//           description="No report found for the selected week."
//           actionLabel="Back to Dashboard"
//           onAction={() => navigate('/ceo')}
//         />
//       </div>
//     );
//   }

//   const week = api.createWeekFromId(weekId!);

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <Button
//         variant="ghost"
//         onClick={() => navigate('/ceo')}
//         className="mb-6"
//       >
//         <ArrowLeft className="h-4 w-4 mr-2" />
//         Back to Dashboard
//       </Button>

//       <Card className="mb-6">
//         <CardHeader>
//           <div className="flex items-start justify-between">
//             <div>
//               <CardTitle className="text-xl">Leader Weekly Report</CardTitle>
//               <CardDescription className="mt-2 space-y-1">
//                 <div className="flex items-center gap-2">
//                   <UserIcon className="h-4 w-4" />
//                   <span>{leader.name}</span>
//                 </div>
//                 {team && (
//                   <div className="flex items-center gap-2">
//                     <Building className="h-4 w-4" />
//                     <span>{team.name}</span>
//                   </div>
//                 )}
//                 <div className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   <span>{week.displayLabel}</span>
//                 </div>
//               </CardDescription>
//             </div>
//             <StatusPill status={report.status} />
//           </div>
//         </CardHeader>
//         <CardContent>
//           <p className="text-sm text-muted-foreground">
//             Submitted on {report.submittedAt?.toLocaleDateString()} at {report.submittedAt?.toLocaleTimeString()}
//           </p>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Report Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <DynamicFormRenderer
//             fields={report.formSnapshot}
//             initialValues={report.payload}
//             onSubmit={() => {}}
//             isReadOnly={true}
//             showDraftButton={false}
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// ########################################
// ########################################
// import { useEffect, useMemo, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import type { FormField, FieldType } from '@/types';
// import { apiFetch } from '@/api/client';

// import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { StatusPill } from '@/components/shared/StatusPill'; // if you don't export like this, keep your original import
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, Calendar, User as UserIcon, Building } from 'lucide-react';

// // --------------------
// // Backend types (FastAPI response)
// // --------------------
// type ReportStatus = 'draft' | 'submitted';

// type ReportsListItem = {
//   id: string;
//   week_id: string;
//   team: { id: string; name: string };
//   submitter: { id: string; name: string; email: string; role: string };
//   report_type: 'member' | 'leader';
//   status: ReportStatus;
//   form_id: string;
//   form_snapshot: unknown; // stored snapshot
//   payload: any;
//   created_at: string;
//   updated_at: string;
//   submitted_at: string | null;
// };

// type ReportsListResponse = {
//   items: ReportsListItem[];
//   count: number;
// };

// type LeadersListResponse = {
//   items: Array<{
//     id: string;
//     name: string;
//     email: string;
//     role: string;
//     team: { id: string; name: string; leader_id: string | null } | null;
//   }>;
//   count: number;
// };

// // --------------------
// // Helpers: normalize form_snapshot -> FormField[]
// // --------------------
// const ALLOWED_FIELD_TYPES: FieldType[] = [
//   'text',
//   'textarea',
//   'number',
//   'select',
//   'checkbox',
//   'date',
// ] as FieldType[];

// function isFieldType(x: unknown): x is FieldType {
//   return typeof x === 'string' && (ALLOWED_FIELD_TYPES as string[]).includes(x);
// }

// function normalizeFields(formSnapshot: unknown): FormField[] {
//   // form_snapshot might be { id, version, fields: [...] } OR directly [...]
//   const raw = Array.isArray(formSnapshot) ? formSnapshot : (formSnapshot as any)?.fields;
//   if (!Array.isArray(raw)) return [];

//   return raw
//     .filter((f: any) => f && typeof f === 'object')
//     .filter((f: any) => typeof f.id === 'string' && isFieldType(f.type))
//     .map((f: any) => ({
//       id: f.id,
//       type: f.type as FieldType,
//       label: typeof f.label === 'string' ? f.label : f.id,
//       required: Boolean(f.required),
//       placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
//       options: f.options,
//     }));
// }

// function extractExtraFields(payload: any): FormField[] {
//   const raw = payload?._extraFields;
//   if (!Array.isArray(raw)) return [];

//   // Reuse the same normalization logic so we only accept safe field shapes
//   return normalizeFields(raw);
// }

// function stripExtraFieldsFromValues(payload: any) {
//   if (!payload || typeof payload !== 'object') return {};
//   const { _extraFields, ...rest } = payload as Record<string, any>;
//   return rest;
// }

// export default function CEOViewReport() {
//   const { weekId, leaderId } = useParams<{ weekId: string; leaderId: string }>();
//   const navigate = useNavigate();

//   const [reportRow, setReportRow] = useState<ReportsListItem | null>(null);
//   const [leader, setLeader] = useState<LeadersListResponse['items'][number] | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   // derived UI data
//   const fields = useMemo(() => normalizeFields(reportRow?.form_snapshot), [reportRow?.form_snapshot]);

//   useEffect(() => {
//     const loadData = async () => {
//       if (!weekId || !leaderId) return;

//       setIsLoading(true);
//       try {
//         // 1) Load leader report row for that leader+week
//         //    We'll query leader reports for the week, then pick the one for leaderId.
//         const list = await apiFetch<ReportsListResponse>(
//           `/reports?week_id=${encodeURIComponent(weekId)}&report_type=leader`
//         );

//         const row = (list.items ?? []).find((r) => r.submitter.id === leaderId) ?? null;
//         setReportRow(row);

//         // 2) Load leader info (since you only have /users list endpoint)
//         const leadersRes = await apiFetch<LeadersListResponse>('/users?role=team_leader');
//         const l = (leadersRes.items ?? []).find((x) => x.id === leaderId) ?? null;
//         setLeader(l);
//       } catch (error) {
//         console.error('Failed to load CEO report:', error);
//         setReportRow(null);
//         setLeader(null);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [weekId, leaderId]);

//   if (isLoading) {
//     return <LoadingState message="Loading report..." />;
//   }

//   // If no row, it means there is no report record (draft/submitted) for that leader+week
//   if (!reportRow || !leader) {
//     return (
//       <div className="p-6">
//         <EmptyState
//           title="Report Not Found"
//           description="No leader report found for the selected week."
//           actionLabel="Back to Dashboard"
//           onAction={() => navigate('/ceo')}
//         />
//       </div>
//     );
//   }

//   const submittedLabel = reportRow.submitted_at
//     ? `${new Date(reportRow.submitted_at).toLocaleDateString()} at ${new Date(reportRow.submitted_at).toLocaleTimeString()}`
//     : '—';

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <Button variant="ghost" onClick={() => navigate('/ceo')} className="mb-6">
//         <ArrowLeft className="h-4 w-4 mr-2" />
//         Back to Dashboard
//       </Button>

//       <Card className="mb-6">
//         <CardHeader>
//           <div className="flex items-start justify-between">
//             <div>
//               <CardTitle className="text-xl">Leader Weekly Report</CardTitle>
//               <CardDescription className="mt-2 space-y-1">
//                 <div className="flex items-center gap-2">
//                   <UserIcon className="h-4 w-4" />
//                   <span>{leader.name}</span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Building className="h-4 w-4" />
//                   <span>{reportRow.team?.name ?? leader.team?.name ?? '—'}</span>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   <span>{weekId}</span>
//                 </div>
//               </CardDescription>
//             </div>

//             <StatusPill status={reportRow.status} />
//           </div>
//         </CardHeader>

//         <CardContent>
//           <p className="text-sm text-muted-foreground">
//             Submitted on {submittedLabel}
//           </p>
//         </CardContent>
//       </Card>

//       <Card>
//         <CardHeader>
//           <CardTitle>Report Details</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <DynamicFormRenderer
//             fields={fields}
//             initialValues={reportRow.payload ?? {}}
//             onSubmit={() => {}}
//             isReadOnly={true}
//             showDraftButton={false}
//           />
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
// // #########################################
// // ##########################################

import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FormField, FieldType } from '@/types';
import { apiFetch } from '@/api/client';

import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusPill } from '@/components/shared/StatusPill';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User as UserIcon, Building } from 'lucide-react';

// --------------------
// Backend types (FastAPI response)
// --------------------
type ReportStatus = 'draft' | 'submitted';

type ReportsListItem = {
  id: string;
  week_id: string;
  team: { id: string; name: string };
  submitter: { id: string; name: string; email: string; role: string };
  report_type: 'member' | 'leader';
  status: ReportStatus;
  form_id: string;
  form_snapshot: unknown; // stored snapshot
  payload: any;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type ReportsListResponse = {
  items: ReportsListItem[];
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
// Helpers: normalize form_snapshot/payload -> FormField[]
// --------------------
const ALLOWED_FIELD_TYPES: FieldType[] = [
  'text',
  'textarea',
  'number',
  'select',
  'checkbox',
  'date',
] as FieldType[];

function isFieldType(x: unknown): x is FieldType {
  return typeof x === 'string' && (ALLOWED_FIELD_TYPES as string[]).includes(x);
}

function normalizeFields(formSnapshot: unknown): FormField[] {
  // form_snapshot might be { id, version, fields: [...] } OR directly [...]
  const raw = Array.isArray(formSnapshot) ? formSnapshot : (formSnapshot as any)?.fields;
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((f: any) => f && typeof f === 'object')
    .filter((f: any) => typeof f.id === 'string' && isFieldType(f.type))
    .map((f: any) => ({
      id: f.id,
      type: f.type as FieldType,
      label: typeof f.label === 'string' ? f.label : f.id,
      required: Boolean(f.required),
      placeholder: typeof f.placeholder === 'string' ? f.placeholder : undefined,
      options: f.options,
    }));
}

// Extra fields are stored by the leader inside reportRow.payload._extraFields
function extractExtraFields(payload: any): FormField[] {
  const raw = payload?._extraFields;
  if (!Array.isArray(raw)) return [];
  return normalizeFields(raw);
}

// Remove _extraFields from values passed to the renderer
function stripExtraFieldsFromValues(payload: any) {
  if (!payload || typeof payload !== 'object') return {};
  const { _extraFields, ...rest } = payload as Record<string, any>;
  return rest;
}

export default function CEOViewReport() {
  const { weekId, leaderId } = useParams<{ weekId: string; leaderId: string }>();
  const navigate = useNavigate();

  const [reportRow, setReportRow] = useState<ReportsListItem | null>(null);
  const [leader, setLeader] = useState<LeadersListResponse['items'][number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!weekId || !leaderId) return;

      setIsLoading(true);
      try {
        // 1) Load leader report row for that leader+week
        const list = await apiFetch<ReportsListResponse>(
          `/reports?week_id=${encodeURIComponent(weekId)}&report_type=leader`
        );

        const row = (list.items ?? []).find((r) => r.submitter.id === leaderId) ?? null;
        setReportRow(row);

        // 2) Load leader info (since you only have /users list endpoint)
        const leadersRes = await apiFetch<LeadersListResponse>('/users?role=team_leader');
        const l = (leadersRes.items ?? []).find((x) => x.id === leaderId) ?? null;
        setLeader(l);
      } catch (error) {
        console.error('Failed to load CEO report:', error);
        setReportRow(null);
        setLeader(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [weekId, leaderId]);

  // ---- Derived render data ----
  const baseFields = useMemo(() => normalizeFields(reportRow?.form_snapshot), [reportRow?.form_snapshot]);
  const extraFields = useMemo(() => extractExtraFields(reportRow?.payload), [reportRow?.payload]);

  // Merge base + extra and deduplicate by id (extra overrides base if same id)
  const fields = useMemo(() => {
    const map = new Map<string, FormField>();
    for (const f of baseFields) map.set(f.id, f);
    for (const f of extraFields) map.set(f.id, f);
    return Array.from(map.values());
  }, [baseFields, extraFields]);

  const initialValues = useMemo(() => stripExtraFieldsFromValues(reportRow?.payload), [reportRow?.payload]);

  // --------------------
  // UI states
  // --------------------
  if (isLoading) {
    return <LoadingState message="Loading report..." />;
  }

  // If no row, it means there is no report record (draft/submitted) for that leader+week
  if (!reportRow || !leader) {
    return (
      <div className="p-6">
        <EmptyState
          title="Report Not Found"
          description="No leader report found for the selected week."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/ceo')}
        />
      </div>
    );
  }

  const submittedLabel = reportRow.submitted_at
    ? `${new Date(reportRow.submitted_at).toLocaleDateString()} at ${new Date(reportRow.submitted_at).toLocaleTimeString()}`
    : '—';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/ceo')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Leader Weekly Report</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{leader.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{reportRow.team?.name ?? leader.team?.name ?? '—'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{weekId}</span>
                </div>
              </CardDescription>
            </div>

            <StatusPill status={reportRow.status} />
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">Submitted on {submittedLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicFormRenderer
            fields={fields}
            initialValues={initialValues}
            onSubmit={() => {}}
            isReadOnly={true}
            showDraftButton={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
