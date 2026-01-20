// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { WeeklyReport, User } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import * as api from '@/lib/mock-api';
// import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';

// export default function LeaderViewMemberReport() {
//   const { weekId, memberId } = useParams<{ weekId: string; memberId: string }>();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [report, setReport] = useState<WeeklyReport | null>(null);
//   const [member, setMember] = useState<User | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [accessDenied, setAccessDenied] = useState(false);

//   useEffect(() => {
//     async function loadData() {
//       if (!weekId || !memberId || !user) return;
      
//       setIsLoading(true);
//       try {
//         // Validate access - leader can only view their team members' reports
//         const hasAccess = await api.validateMemberAccess(user.id, memberId);
//         if (!hasAccess) {
//           setAccessDenied(true);
//           return;
//         }

//         const [reportData, memberData] = await Promise.all([
//           api.getReportForWeek(weekId, memberId, 'member'),
//           api.getUserById(memberId),
//         ]);
        
//         setReport(reportData);
//         setMember(memberData);
//       } catch (error) {
//         console.error('Failed to load report:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadData();
//   }, [weekId, memberId, user]);

//   if (isLoading) {
//     return <LoadingState message="Loading report..." />;
//   }

//   if (accessDenied) {
//     return (
//       <div className="p-6">
//       <EmptyState
//           title="Access Denied"
//           description="You don't have permission to view this report."
//           actionLabel="Back to Dashboard"
//           onAction={() => navigate('/leader')}
//         />
//       </div>
//     );
//   }

//   if (!report || !member) {
//     return (
//       <div className="p-6">
//       <EmptyState
//           title="Report Not Found"
//           description="No report found for this team member for the selected week."
//           actionLabel="Back to Dashboard"
//           onAction={() => navigate('/leader')}
//         />
//       </div>
//     );
//   }

//   const week = api.createWeekFromId(weekId!);

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <Button
//         variant="ghost"
//         onClick={() => navigate('/leader')}
//         className="mb-6"
//       >
//         <ArrowLeft className="h-4 w-4 mr-2" />
//         Back to Dashboard
//       </Button>

//       <Card className="mb-6">
//         <CardHeader>
//           <div className="flex items-start justify-between">
//             <div>
//               <CardTitle className="text-xl">Member Weekly Report</CardTitle>
//               <CardDescription className="mt-2 space-y-1">
//                 <div className="flex items-center gap-2">
//                   <UserIcon className="h-4 w-4" />
//                   <span>{member.name}</span>
//                 </div>
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
import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/api/client';

import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusPill } from '@/components/shared/StatusPill';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User as UserIcon } from 'lucide-react';
import type { FormField, FieldType } from '@/types';

// --------------------
// Helpers: normalize + merge extra fields
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
  // backend form_snapshot might be:
  // 1) { id, version, fields: [...] }
  // 2) [...]
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

// Extra fields are stored inside payload._extraFields
function extractExtraFields(payload: any): FormField[] {
  const raw = payload?._extraFields;
  if (!Array.isArray(raw)) return [];
  return normalizeFields(raw);
}

// Remove _extraFields from initialValues passed to renderer
function stripExtraFieldsFromValues(payload: any) {
  if (!payload || typeof payload !== 'object') return {};
  const { _extraFields, ...rest } = payload as Record<string, any>;
  return rest;
}

// --------------------
// Backend response types (match your /reports endpoint)
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
  form_snapshot: unknown;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type ReportsListResponse = {
  items: ReportsListItem[];
  count: number;
};

export default function LeaderViewMemberReport() {
  const { weekId, memberId } = useParams<{ weekId: string; memberId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportsListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!weekId || !memberId || !user) return;

      setIsLoading(true);
      setAccessDenied(false);

      try {
        // Leader access control is enforced in backend /reports:
        // - leader can see member reports only for their team
        const res = await apiFetch<ReportsListResponse>(
          `/reports?week_id=${encodeURIComponent(weekId)}&report_type=member`
        );

        const found = (res.items ?? []).find((r) => r.submitter.id === memberId) ?? null;

        if (!found) {
          // Could be "not found" OR "access denied".
          // If leader tries to view a member outside their team, backend will not return it.
          setAccessDenied(true);
          setReport(null);
          return;
        }

        setReport(found);
      } catch (err: any) {
        console.error('Failed to load report:', err);
        const status = err?.status ?? err?.response?.status;
        if (status === 403) setAccessDenied(true);
        setReport(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [weekId, memberId, user]);

  // ---- Derived render data (merge base + extra fields) ----
  const baseFields = useMemo(() => normalizeFields(report?.form_snapshot), [report?.form_snapshot]);
  const extraFields = useMemo(() => extractExtraFields(report?.payload), [report?.payload]);

  const fields = useMemo(() => {
    const map = new Map<string, FormField>();
    for (const f of baseFields) map.set(f.id, f);
    for (const f of extraFields) map.set(f.id, f); // extra overrides if same id
    return Array.from(map.values());
  }, [baseFields, extraFields]);

  const initialValues = useMemo(() => stripExtraFieldsFromValues(report?.payload), [report?.payload]);

  // --------------------
  // UI states
  // --------------------
  if (isLoading) {
    return <LoadingState message="Loading report..." />;
  }

  if (accessDenied) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          description="You don't have permission to view this report."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/leader')}
        />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <EmptyState
          title="Report Not Found"
          description="No report found for this team member for the selected week."
          actionLabel="Back to Dashboard"
          onAction={() => navigate('/leader')}
        />
      </div>
    );
  }

  const submittedDate = report.submitted_at ? new Date(report.submitted_at) : null;
  const weekLabel = weekId; // Until you add a week-by-id endpoint

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/leader')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">Member Weekly Report</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{report.submitter.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{weekLabel}</span>
                </div>
              </CardDescription>
            </div>

            <StatusPill status={report.status === 'submitted' ? 'submitted' : 'draft'} />
          </div>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            {report.status === 'submitted' ? (
              <>
                Submitted on {submittedDate ? submittedDate.toLocaleDateString() : '—'}
                {submittedDate ? ` at ${submittedDate.toLocaleTimeString()}` : ''}
              </>
            ) : (
              <>This report is still a draft.</>
            )}
          </p>
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
