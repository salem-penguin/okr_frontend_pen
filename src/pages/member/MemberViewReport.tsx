// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { WeeklyReport } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import * as api from '@/lib/mock-api';
// import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { ArrowLeft, Calendar } from 'lucide-react';

// export default function MemberViewReport() {
//   const { weekId } = useParams<{ weekId: string }>();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [report, setReport] = useState<WeeklyReport | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     async function loadData() {
//       if (!weekId || !user) return;
      
//       setIsLoading(true);
//       try {
//         const reportData = await api.getReportForWeek(weekId, user.id, 'member');
//         setReport(reportData);
//       } catch (error) {
//         console.error('Failed to load report:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadData();
//   }, [weekId, user]);

//   if (isLoading) {
//     return <LoadingState message="Loading report..." />;
//   }

//   if (!report) {
//     return (
//       <div className="p-6">
//       <EmptyState
//           title="Report Not Found"
//           description="You haven't submitted a report for this week."
//           actionLabel="Submit Report"
//           onAction={() => navigate('/member/submit')}
//         />
//       </div>
//     );
//   }

//   const week = api.createWeekFromId(weekId!);

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <Button
//         variant="ghost"
//         onClick={() => navigate('/member')}
//         className="mb-6"
//       >
//         <ArrowLeft className="h-4 w-4 mr-2" />
//         Back to Dashboard
//       </Button>

//       <Card className="mb-6">
//         <CardHeader>
//           <div className="flex items-start justify-between">
//             <div>
//               <CardTitle className="text-xl">My Weekly Report</CardTitle>
//               <CardDescription className="mt-2">
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
//           {report.submittedAt && (
//             <p className="text-sm text-muted-foreground">
//               Submitted on {report.submittedAt.toLocaleDateString()} at {report.submittedAt.toLocaleTimeString()}
//             </p>
//           )}
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
import { ArrowLeft, Calendar } from 'lucide-react';
import type { FormField, FieldType } from '@/types';

// --------------------
// Backend types
// --------------------
type ReportStatus = 'draft' | 'submitted';

type MyReportResponse = {
  item: {
    id: string;
    week_id: string;
    user_id: string;
    team_id: string;
    report_type: 'member' | 'leader';
    status: ReportStatus;
    form_id: string;
    form_snapshot: unknown; // {id, version, fields:[...]} or [...]
    payload: Record<string, unknown>;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};

// --------------------
// Helpers: normalize fields + merge extra fields from payload._extraFields
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

function normalizeFields(snapshot: unknown): FormField[] {
  const raw = Array.isArray(snapshot) ? snapshot : (snapshot as any)?.fields;
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

function extractExtraFields(payload: any): FormField[] {
  const raw = payload?._extraFields;
  if (!Array.isArray(raw)) return [];
  return normalizeFields(raw);
}

function stripExtraFieldsFromValues(payload: any) {
  if (!payload || typeof payload !== 'object') return {};
  const { _extraFields, ...rest } = payload as Record<string, any>;
  return rest;
}

export default function MemberViewReport() {
  const { weekId } = useParams<{ weekId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reportRow, setReportRow] = useState<MyReportResponse['item'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!weekId || !user) return;

      setIsLoading(true);
      try {
        const res = await apiFetch<MyReportResponse>(
          `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=member`
        );
        setReportRow(res.item);
      } catch (error) {
        console.error('Failed to load report:', error);
        setReportRow(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [weekId, user]);

  // Derived fields + initial values (supports payload._extraFields)
  const baseFields = useMemo(() => normalizeFields(reportRow?.form_snapshot), [reportRow?.form_snapshot]);
  const extraFields = useMemo(() => extractExtraFields(reportRow?.payload), [reportRow?.payload]);

  const fields = useMemo(() => {
    const map = new Map<string, FormField>();
    for (const f of baseFields) map.set(f.id, f);
    for (const f of extraFields) map.set(f.id, f); // extra overrides if same id
    return Array.from(map.values());
  }, [baseFields, extraFields]);

  const initialValues = useMemo(() => stripExtraFieldsFromValues(reportRow?.payload), [reportRow?.payload]);

  if (isLoading) {
    return <LoadingState message="Loading report..." />;
  }

  if (!reportRow) {
    return (
      <div className="p-6">
        <EmptyState
          title="Report Not Found"
          description="You haven't submitted a report for this week."
          actionLabel="Submit Report"
          onAction={() => navigate('/member/submit')}
        />
      </div>
    );
  }

  const submittedAt = reportRow.submitted_at ? new Date(reportRow.submitted_at) : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate('/member')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">My Weekly Report</CardTitle>
              <CardDescription className="mt-2">
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
          {submittedAt && (
            <p className="text-sm text-muted-foreground">
              Submitted on {submittedAt.toLocaleDateString()} at {submittedAt.toLocaleTimeString()}
            </p>
          )}
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
