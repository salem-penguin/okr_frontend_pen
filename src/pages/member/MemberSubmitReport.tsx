// import { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FormField, WeeklyReport, Week } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import * as api from '@/lib/mock-api';
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

// export default function MemberSubmitReport() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [selectedWeek, setSelectedWeek] = useState<Week>(api.getCurrentWeek());
//   const [baseFormFields, setBaseFormFields] = useState<FormField[]>([]);
//   const [extraFields, setExtraFields] = useState<FormField[]>([]);
//   const [formId, setFormId] = useState<string>('');
//   const [existingReport, setExistingReport] = useState<WeeklyReport | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);

//   // Combined fields for form rendering
//   const allFormFields = [...baseFormFields, ...extraFields];

//   const loadData = useCallback(async () => {
//     if (!user?.teamId) return;
    
//     setIsLoading(true);
//     try {
//       // Load active form (team-specific or default)
//       const form = await api.getActiveForm('member', user.teamId);
//       if (form) {
//         setBaseFormFields(form.fields);
//         setFormId(form.id);
//       } else {
//         // Use default form if none configured
//         setBaseFormFields(defaultMemberFormFields);
//         setFormId('default_member_form');
//       }

//       // Check for existing report
//       const report = await api.getReportForWeek(selectedWeek.isoWeekId, user.id, 'member');
//       setExistingReport(report);
      
//       // Load extra fields from existing draft/report
//       if (report?.payload?._extraFields) {
//         setExtraFields(report.payload._extraFields as FormField[]);
//       } else {
//         setExtraFields([]);
//       }
//     } catch (error) {
//       console.error('Failed to load data:', error);
//       toast.error('Failed to load report data');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [user?.id, user?.teamId, selectedWeek.isoWeekId]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const handleSaveDraft = useCallback(async (values: Record<string, unknown>) => {
//     if (!user?.teamId) return;

//     try {
//       // Store extra fields in the payload
//       const payloadWithExtras = {
//         ...values,
//         _extraFields: extraFields,
//       };
      
//       await api.saveDraft(
//         selectedWeek.isoWeekId,
//         user.id,
//         user.teamId,
//         'member',
//         formId,
//         allFormFields,
//         payloadWithExtras
//       );
//       setLastSaved(new Date());
//     } catch (error) {
//       console.error('Failed to save draft:', error);
//     }
//   }, [user?.id, user?.teamId, selectedWeek.isoWeekId, formId, allFormFields, extraFields]);

//   const handleSubmit = async (values: Record<string, unknown>) => {
//     if (!user?.teamId) return;

//     setIsSubmitting(true);
//     try {
//       // Store extra fields in the payload
//       const payloadWithExtras = {
//         ...values,
//         _extraFields: extraFields,
//       };
      
//       // Save draft first
//       const draft = await api.saveDraft(
//         selectedWeek.isoWeekId,
//         user.id,
//         user.teamId,
//         'member',
//         formId,
//         allFormFields,
//         payloadWithExtras
//       );

//       // Submit the report
//       await api.submitReport(draft.id);
      
//       toast.success('Report submitted successfully!');
//       navigate('/member');
//     } catch (error) {
//       console.error('Failed to submit report:', error);
//       toast.error('Failed to submit report');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

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

//   if (isLoading) {
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
//             <CardDescription>
//               You have already submitted your report for {selectedWeek.displayLabel}
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="flex flex-col items-center gap-4">
//             <StatusPill status="submitted" />
//             <p className="text-sm text-muted-foreground">
//               Submitted on {existingReport.submittedAt?.toLocaleDateString()}
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
//           <WeekSelector
//             selectedWeek={selectedWeek}
//             onWeekChange={setSelectedWeek}
//           />
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
//           <p className="text-muted-foreground mt-1">
//             {selectedWeek.displayLabel}
//           </p>
//         </div>
//         <WeekSelector
//           selectedWeek={selectedWeek}
//           onWeekChange={setSelectedWeek}
//         />
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
//               {lastSaved && (
//                 <span className="block mt-1 text-xs">
//                   Last saved: {lastSaved.toLocaleTimeString()}
//                 </span>
//               )}
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

//         {/* Extra Fields Builder */}
//         <ExtraFieldsBuilder
//           extraFields={extraFields}
//           onExtraFieldsChange={setExtraFields}
//         />
//       </div>
//     </div>
//   );
// }
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Week } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/api/client';

import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
import { WeekSelector } from '@/components/shared/WeekSelector';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusPill } from '@/components/shared/StatusPill';
import { ExtraFieldsBuilder } from '@/components/form-builder/ExtraFieldsBuilder';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Default member form fields (fallback if no form is configured)
const defaultMemberFormFields: FormField[] = [
  { id: 'accomplished', type: 'textarea', label: 'What did you accomplish this week?', placeholder: 'List your completed tasks...', required: true },
  { id: 'next_week', type: 'textarea', label: 'What are you working on next week?', placeholder: 'Planned tasks for next week...', required: true },
  { id: 'blockers', type: 'textarea', label: 'Any blockers or concerns?', placeholder: 'Issues that need attention...', required: false },
  { id: 'need_support', type: 'checkbox', label: 'I need support from my manager', required: false },
];

// --------------------
// Backend response types
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  display_label: string;
};

type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: { id: string; name: string; leader_id: string | null } | null;
};

type ActiveFormResponse = {
  id: string;
  scope: 'member' | 'leader';
  team_id: string | null;
  leader_id: string | null;
  version: number;
  is_active: boolean;
  fields: FormField[];
  created_at: string;
  updated_at: string;
};

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
    form_snapshot: unknown;
    payload: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    submitted_at: string | null;
  } | null;
};

type SaveDraftRequest = {
  week_id: string;
  report_type: 'member' | 'leader';
  form_id: string;
  payload: Record<string, unknown>;
};

type SaveDraftResponse = {
  id: string;
  week_id: string;
  user_id: string;
  team_id: string;
  report_type: 'member' | 'leader';
  status: ReportStatus;
  form_id: string;
  payload: Record<string, unknown>;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

type SubmitRequest = {
  week_id: string;
  report_type: 'member' | 'leader';
};

type SubmitResponse = {
  id: string;
  week_id: string;
  user_id: string;
  report_type: 'member' | 'leader';
  status: 'submitted';
  submitted_at: string | null;
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

export default function MemberSubmitReport() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const [baseFormFields, setBaseFormFields] = useState<FormField[]>([]);
  const [extraFields, setExtraFields] = useState<FormField[]>([]);
  const [formId, setFormId] = useState<string>('');

  const [existingReport, setExistingReport] = useState<MyReportResponse['item']>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const allFormFields = [...baseFormFields, ...extraFields];

  // Boot: load current week
  useEffect(() => {
    const boot = async () => {
      if (!userEmail) return;

      setIsLoading(true);
      try {
        const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
        const currentWeek = toWeek(cw);

        setSelectedWeek(currentWeek);
        setWeeks([currentWeek]); // until /weeks?limit=12 exists
      } finally {
        setIsLoading(false);
      }
    };

    boot();
  }, [userEmail]);

  const loadData = useCallback(async () => {
    if (!userEmail) return;
    if (!selectedWeek?.isoWeekId) return;

    setIsLoading(true);
    try {
      const me = await apiFetch<MeResponse>('/me');
      if (!me.team?.id) {
        setBaseFormFields([]);
        setFormId('');
        setExistingReport(null);
        setExtraFields([]);
        return;
      }

      // 1) Load active member form for the team (or fallback)
      try {
        const form = await apiFetch<ActiveFormResponse>(
          `/forms/active?scope=member&team_id=${encodeURIComponent(me.team.id)}`
        );
        setBaseFormFields(form.fields ?? []);
        setFormId(form.id);
      } catch (err) {
        // 404 -> no active form
        setBaseFormFields(defaultMemberFormFields);
        setFormId('default_member_form'); // not in DB, but we will NOT submit draft with this id if we have no DB form
      }

      // 2) Check for existing report for this week
      const report = await apiFetch<MyReportResponse>(
        `/reports/me?week_id=${encodeURIComponent(selectedWeek.isoWeekId)}&report_type=member`
      );
      setExistingReport(report.item);

      // 3) Restore extra fields if present
      const payload = report.item?.payload ?? {};
      const restored = (payload as any)?._extraFields;
      setExtraFields(Array.isArray(restored) ? (restored as FormField[]) : []);
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, selectedWeek?.isoWeekId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDraft = useCallback(
    async (values: Record<string, unknown>) => {
      if (!userEmail) return;
      if (!selectedWeek?.isoWeekId) return;

      try {
        const me = await apiFetch<MeResponse>('/me');
        if (!me.team?.id) return;

        // IMPORTANT:
        // Your backend requires a REAL form_id that exists and is active for that team.
        // If no form exists (we fell back to defaults), saving draft will fail.
        if (!formId || formId === 'default_member_form') {
          toast.error('No active form configured for your team. Ask your leader/CEO to create one.');
          return;
        }

        const payloadWithExtras = {
          ...values,
          _extraFields: extraFields,
        };

        const body: SaveDraftRequest = {
          week_id: selectedWeek.isoWeekId,
          report_type: 'member',
          form_id: formId,
          payload: payloadWithExtras,
        };

        const draft = await apiFetch<SaveDraftResponse>('/reports/draft', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        setExistingReport((prev) =>
          prev
            ? { ...prev, status: 'draft', payload: draft.payload, form_id: draft.form_id, submitted_at: null }
            : {
                id: draft.id,
                week_id: draft.week_id,
                user_id: draft.user_id,
                team_id: draft.team_id,
                report_type: draft.report_type,
                status: draft.status,
                form_id: draft.form_id,
                form_snapshot: null,
                payload: draft.payload,
                created_at: draft.created_at,
                updated_at: draft.updated_at,
                submitted_at: draft.submitted_at,
              }
        );

        setLastSaved(new Date());
      } catch (error) {
        console.error('Failed to save draft:', error);
        toast.error('Failed to save draft');
      }
    },
    [userEmail, selectedWeek?.isoWeekId, formId, extraFields]
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!userEmail) return;
    if (!selectedWeek?.isoWeekId) return;

    setIsSubmitting(true);
    try {
      const me = await apiFetch<MeResponse>('/me');
      if (!me.team?.id) throw new Error('No team assigned');

      if (!formId || formId === 'default_member_form') {
        toast.error('No active form configured for your team. Ask your leader/CEO to create one.');
        return;
      }

      const payloadWithExtras = {
        ...values,
        _extraFields: extraFields,
      };

      // 1) Save draft first (required by your submit endpoint which expects draft status)
      const draft = await apiFetch<SaveDraftResponse>('/reports/draft', {
        method: 'POST',
        body: JSON.stringify({
          week_id: selectedWeek.isoWeekId,
          report_type: 'member',
          form_id: formId,
          payload: payloadWithExtras,
        } satisfies SaveDraftRequest),
      });

      // 2) Submit the report (your backend expects week_id + report_type)
      await apiFetch<SubmitResponse>('/reports/submit', {
        method: 'POST',
        body: JSON.stringify({
          week_id: selectedWeek.isoWeekId,
          report_type: 'member',
        } satisfies SubmitRequest),
      });

      toast.success('Report submitted successfully!');
      // Team leader of this team will now see it under:
      // /reports?week_id=...&report_type=member (leader scope by team_id)
      navigate('/member');
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // UI Gates
  if (!user?.teamId) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Team Assigned"
          description="You are not assigned to a team. Please contact an administrator."
        />
      </div>
    );
  }

  if (isLoading || !selectedWeek) {
    return <LoadingState message="Loading report form..." />;
  }

  // Already submitted for this week
  if (existingReport?.status === 'submitted') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Report Already Submitted</CardTitle>
            <CardDescription>You have already submitted your report for {selectedWeek.displayLabel}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <StatusPill status="submitted" />
            <p className="text-sm text-muted-foreground">
              Submitted on {existingReport.submitted_at ? new Date(existingReport.submitted_at).toLocaleDateString() : '—'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/member')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate(`/member/reports/${selectedWeek.isoWeekId}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Submit Weekly Report
          </h1>
          <p className="text-muted-foreground mt-1">{selectedWeek.displayLabel}</p>
        </div>

        <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
      </div>

      {existingReport?.status === 'draft' && (
        <Alert className="mb-6">
          <AlertDescription className="flex items-center justify-between">
            <span>You have a draft saved. Continue where you left off.</span>
            <StatusPill status="draft" />
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Report</CardTitle>
            <CardDescription>
              Fill out your weekly report. Reports auto-save as drafts.
              {lastSaved && <span className="block mt-1 text-xs">Last saved: {lastSaved.toLocaleTimeString()}</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicFormRenderer
              fields={allFormFields}
              initialValues={existingReport?.payload || {}}
              onSubmit={handleSubmit}
              onSaveDraft={handleSaveDraft}
              isSubmitting={isSubmitting}
              submitLabel="Submit Report"
              showDraftButton={true}
            />
          </CardContent>
        </Card>

        <ExtraFieldsBuilder extraFields={extraFields} onExtraFieldsChange={setExtraFields} />
      </div>
    </div>
  );
}
