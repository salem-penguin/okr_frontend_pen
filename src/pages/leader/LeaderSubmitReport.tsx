
// import { useState, useEffect, useCallback, useMemo } from 'react';
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

// // --------------------
// // Backend types
// // --------------------
// type CurrentWeekResponse = {
//   week_id: string;
//   start_date: string; // ISO
//   end_date: string; // ISO
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
//     status: ReportStatus;
//     submitted_at: string | null;
//     payload: Record<string, unknown>;
//     form_id: string;
//   } | null;
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

// // Default leader form fields (fallback if no form is configured)
// const defaultLeaderFormFields: FormField[] = [
//   { id: 'accomplishments', type: 'textarea', label: 'Key Accomplishments This Week', placeholder: "List your team's main achievements...", required: true },
//   { id: 'challenges', type: 'textarea', label: 'Challenges & Blockers', placeholder: 'Any obstacles faced...', required: true },
//   { id: 'next_week', type: 'textarea', label: 'Goals for Next Week', placeholder: 'What are the priorities for next week...', required: true },
//   { id: 'morale', type: 'number', label: 'Team Morale (1-10)', placeholder: '8', required: true },
//   { id: 'notes', type: 'textarea', label: 'Additional Notes', placeholder: 'Any other updates...', required: false },
// ];

// export default function LeaderSubmitReport() {
//   const { user } = useAuth();
//   const userEmail = user?.email;
//   const navigate = useNavigate();

//   const [weeks, setWeeks] = useState<Week[]>([]);
//   const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

//   const [baseFormFields, setBaseFormFields] = useState<FormField[]>([]);
//   const [extraFields, setExtraFields] = useState<FormField[]>([]);
//   const [formId, setFormId] = useState<string>('');

//   const [existingReport, setExistingReport] = useState<{
//     id: string;
//     status: ReportStatus;
//     submittedAt: string | null;
//     payload: Record<string, unknown>;
//   } | null>(null);

//   const [isLoading, setIsLoading] = useState(true);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [lastSaved, setLastSaved] = useState<Date | null>(null);

//   const allFormFields = useMemo(() => [...baseFormFields, ...extraFields], [baseFormFields, extraFields]);

//   // Boot: load current week (until /weeks list exists)
//   useEffect(() => {
//     const boot = async () => {
//       if (!userEmail) return;

//       setIsLoading(true);
//       try {
//         const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
//         const currentWeek = toWeek(cw);
//         setSelectedWeek(currentWeek);
//         setWeeks([currentWeek]);
//       } catch (err) {
//         console.error('Failed to load current week:', err);
//         toast.error('Failed to load current week');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     boot();
//   }, [userEmail]);

//   const loadData = useCallback(async () => {
//     if (!userEmail) return;
//     if (!user?.teamId) return;
//     if (!selectedWeek?.isoWeekId) return;

//     setIsLoading(true);
//     try {
//       const me = await apiFetch<MeResponse>('/me');
//       const weekId = selectedWeek.isoWeekId;

//       // 1) Load active leader form for THIS leader id (this is what CEO edits)
//       try {
//   const form = await apiFetch<ActiveFormResponse>(
//     `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
//   );
//   setBaseFormFields(form.fields ?? defaultLeaderFormFields);
//   setFormId(form.id);
// } catch (err: any) {
//   // Only fallback on 404 (no active schema)
//   const status = err?.status || err?.response?.status;
//   if (status === 404) {
//     setBaseFormFields(defaultLeaderFormFields);
//     setFormId('default_leader_form');
//   } else {
//     throw err; // real error (auth/db)
//   }
// }


//       // 2) Existing report draft/submitted
//       const my = await apiFetch<MyReportResponse>(
//         `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=leader`
//       );

//       if (my.item) {
//         setExistingReport({
//           id: my.item.id,
//           status: my.item.status,
//           submittedAt: my.item.submitted_at ?? null,
//           payload: my.item.payload ?? {},
//         });

//         const extras = (my.item.payload?._extraFields as FormField[] | undefined) ?? [];
//         setExtraFields(extras);
//       } else {
//         setExistingReport(null);
//         setExtraFields([]);
//       }
//     } catch (error) {
//       console.error('Failed to load data:', error);
//       toast.error('Failed to load report data');
//     } finally {
//       setIsLoading(false);
//     }
//   }, [userEmail, user?.teamId, selectedWeek?.isoWeekId]);

//   useEffect(() => {
//     loadData();
//   }, [loadData]);

//   const handleSaveDraft = useCallback(
//     async (values: Record<string, unknown>) => {
//       if (!selectedWeek?.isoWeekId) return;

//       try {
//         const payloadWithExtras = { ...values, _extraFields: extraFields };

//         await apiFetch('/reports/draft', {
//           method: 'POST',
//           body: JSON.stringify({
//             week_id: selectedWeek.isoWeekId,
//             report_type: 'leader',
//             form_id: formId,
//             payload: payloadWithExtras,
//           }),
//         });

//         setLastSaved(new Date());
//         toast.success('Draft saved');
//       } catch (error) {
//         console.error('Failed to save draft:', error);
//         toast.error('Failed to save draft');
//       }
//     },
//     [selectedWeek?.isoWeekId, formId, extraFields]
//   );

//   const handleSubmit = async (values: Record<string, unknown>) => {
//     if (!selectedWeek?.isoWeekId) return;

//     setIsSubmitting(true);
//     try {
//       const payloadWithExtras = { ...values, _extraFields: extraFields };

//       // Save draft first (upsert)
//       await apiFetch('/reports/draft', {
//         method: 'POST',
//         body: JSON.stringify({
//           week_id: selectedWeek.isoWeekId,
//           report_type: 'leader',
//           form_id: formId,
//           payload: payloadWithExtras,
//         }),
//       });

//       // Submit
//       await apiFetch('/reports/submit', {
//         method: 'POST',
//         body: JSON.stringify({
//           week_id: selectedWeek.isoWeekId,
//           report_type: 'leader',
//         }),
//       });

//       toast.success('Report submitted successfully!');
//       navigate('/leader');
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

//   if (isLoading || !selectedWeek) {
//     return <LoadingState message="Loading report form..." />;
//   }

//   // Already submitted
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
//               Submitted on {existingReport.submittedAt ? new Date(existingReport.submittedAt).toLocaleDateString() : '—'}
//             </p>
//             <div className="flex gap-3">
//               <Button variant="outline" onClick={() => navigate('/leader')}>
//                 Back to Dashboard
//               </Button>
//               <Button onClick={() => navigate(`/leader/reports/${selectedWeek.isoWeekId}/${user.id}`)}>
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
//             <CardTitle>Leader Weekly Report</CardTitle>
//             <CardDescription>
//               Fill out your weekly report for your team. Reports auto-save as drafts.
//               {lastSaved && (
//                 <span className="block mt-1 text-xs">Last saved: {lastSaved.toLocaleTimeString()}</span>
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

//         <ExtraFieldsBuilder extraFields={extraFields} onExtraFieldsChange={setExtraFields} />
//       </div>
//     </div>
//   );
// }
// src/pages/leader/LeaderSubmitReport.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
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

// --------------------
// Backend types
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string; // ISO
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
    status: ReportStatus;
    submitted_at: string | null;
    payload: Record<string, unknown>;
    form_id: string;
  } | null;
};

// Team OKRs response (leader)
type TeamOKRsResponse = {
  quarter: { quarter_id: string; start_date: string; end_date: string; seconds_remaining: number };
  team: {
    team_id: string;
    team_name: string;
    objectives: Array<{
      id: string;
      title: string;
      progress: number;
      key_results: Array<{ id: string; title: string; status: string; progress: number; weight: number }>;
    }>;
  };
};

type KROption = { id: string; label: string };

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

// Default leader form fields (fallback if no form is configured)
const defaultLeaderFormFields: FormField[] = [
  { id: 'accomplishments', type: 'textarea', label: 'Key Accomplishments This Week', placeholder: "List your team's main achievements...", required: true },
  { id: 'challenges', type: 'textarea', label: 'Challenges & Blockers', placeholder: 'Any obstacles faced...', required: true },
  { id: 'next_week', type: 'textarea', label: 'Goals for Next Week', placeholder: 'What are the priorities for next week...', required: true },
  { id: 'morale', type: 'number', label: 'Team Morale (1-10)', placeholder: '8', required: true },
  { id: 'notes', type: 'textarea', label: 'Additional Notes', placeholder: 'Any other updates...', required: false },
];

function valueToNote(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function buildKrUpdates(
  values: Record<string, unknown>,
  fields: FormField[],
  map: Record<string, string | null>
) {
  const updates: Array<Record<string, unknown>> = [];

  for (const f of fields) {
    const krId = map[f.id];
    if (!krId) continue; // Extra (not linked)

    const noteValue = valueToNote(values[f.id]);
    if (!noteValue) continue;

    updates.push({
      kr_id: krId,
      note: `[${f.label}] ${noteValue}`,
      field_id: f.id,
      field_label: f.label,
    });
  }

  return updates;
}

export default function LeaderSubmitReport() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userEmail = user?.email;
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [weekLoadError, setWeekLoadError] = useState<string | null>(null);

  const [baseFormFields, setBaseFormFields] = useState<FormField[]>([]);
  const [extraFields, setExtraFields] = useState<FormField[]>([]);
  const [formId, setFormId] = useState<string>('');

  const [existingReport, setExistingReport] = useState<{
    id: string;
    status: ReportStatus;
    submittedAt: string | null;
    payload: Record<string, unknown>;
  } | null>(null);

  // KR mapping state
  const [krOptions, setKrOptions] = useState<KROption[]>([]);
  const [fieldKrMap, setFieldKrMap] = useState<Record<string, string | null>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const allFormFields = useMemo(() => [...baseFormFields, ...extraFields], [baseFormFields, extraFields]);

  // Ensure every field has a default mapping (null => Extra)
  useEffect(() => {
    setFieldKrMap((prev) => {
      const next = { ...prev };
      for (const f of allFormFields) {
        if (!(f.id in next)) next[f.id] = null;
      }
      for (const key of Object.keys(next)) {
        if (!allFormFields.some((f) => f.id === key)) delete next[key];
      }
      return next;
    });
  }, [allFormFields]);

  // Boot: load current week
  const loadCurrentWeek = useCallback(async () => {
    if (!userEmail) return;

    setIsLoading(true);
    setWeekLoadError(null);
    try {
      const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
      const currentWeek = toWeek(cw);
      setSelectedWeek(currentWeek);
      setWeeks([currentWeek]);
    } catch (err) {
      console.error('Failed to load current week:', err);
      setSelectedWeek(null);
      setWeeks([]);
      setWeekLoadError('Failed to load current week');
      toast.error('Failed to load current week');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadCurrentWeek();
  }, [loadCurrentWeek]);

  const loadData = useCallback(async () => {
    if (!userEmail) return;
    if (!user?.teamId) return;
    if (!selectedWeek?.isoWeekId) return;

    setIsLoading(true);
    try {
      const me = await apiFetch<MeResponse>('/me');
      const weekId = selectedWeek.isoWeekId;

      // 0) Load team OKRs (KR dropdown options)
      try {
        const okrs = await apiFetch<TeamOKRsResponse>('/okrs/team/current');
        const opts: KROption[] = [];

        for (const obj of okrs.team?.objectives ?? []) {
          for (const kr of obj.key_results ?? []) {
            opts.push({ id: kr.id, label: `${obj.title} — ${kr.title}` });
          }
        }

        setKrOptions(opts);
      } catch {
        setKrOptions([]); // non-fatal
      }

      // 1) Load active leader form
      try {
        const form = await apiFetch<ActiveFormResponse>(
          `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
        );
        setBaseFormFields(form.fields ?? defaultLeaderFormFields);
        setFormId(form.id);
      } catch (err: any) {
        const status = err?.status || err?.response?.status;
        if (status === 404) {
          setBaseFormFields(defaultLeaderFormFields);
          setFormId('default_leader_form');
        } else {
          throw err;
        }
      }

      // 2) Existing report draft/submitted
      const my = await apiFetch<MyReportResponse>(
        `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=leader`
      );

      if (my.item) {
        setExistingReport({
          id: my.item.id,
          status: my.item.status,
          submittedAt: my.item.submitted_at ?? null,
          payload: my.item.payload ?? {},
        });

        const extras = (my.item.payload?._extraFields as FormField[] | undefined) ?? [];
        setExtraFields(extras);

        const map = (my.item.payload?._fieldKrMap as Record<string, string | null> | undefined) ?? {};
        setFieldKrMap(map);
      } else {
        setExistingReport(null);
        setExtraFields([]);
        setFieldKrMap({});
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  }, [userEmail, user?.teamId, selectedWeek?.isoWeekId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveDraft = useCallback(
    async (values: Record<string, unknown>) => {
      if (!selectedWeek?.isoWeekId) return;

      try {
        const kr_updates = buildKrUpdates(values, allFormFields, fieldKrMap);

        const payloadWithExtras = {
          ...values,
          _extraFields: extraFields,
          _fieldKrMap: fieldKrMap,
          kr_updates,
        };

        await apiFetch('/reports/draft', {
          method: 'POST',
          body: JSON.stringify({
            week_id: selectedWeek.isoWeekId,
            report_type: 'leader',
            form_id: formId,
            payload: payloadWithExtras,
          }),
        });

        setLastSaved(new Date());
        toast.success('Draft saved');
      } catch (error) {
        console.error('Failed to save draft:', error);
        toast.error('Failed to save draft');
      }
    },
    [selectedWeek?.isoWeekId, formId, extraFields, allFormFields, fieldKrMap]
  );

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!selectedWeek?.isoWeekId) return;

    setIsSubmitting(true);
    try {
      const kr_updates = buildKrUpdates(values, allFormFields, fieldKrMap);

      const payloadWithExtras = {
        ...values,
        _extraFields: extraFields,
        _fieldKrMap: fieldKrMap,
        kr_updates,
      };

      // Save draft first (upsert)
      await apiFetch('/reports/draft', {
        method: 'POST',
        body: JSON.stringify({
          week_id: selectedWeek.isoWeekId,
          report_type: 'leader',
          form_id: formId,
          payload: payloadWithExtras,
        }),
      });

      // Submit
      await apiFetch('/reports/submit', {
        method: 'POST',
        body: JSON.stringify({
          week_id: selectedWeek.isoWeekId,
          report_type: 'leader',
        }),
      });

      toast.success('Report submitted successfully!');
      navigate('/leader');
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <LoadingState message="Loading user..." />;
  }

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

  if (!selectedWeek && !isLoading) {
    return (
      <div className="p-6">
        <EmptyState
          title="No Active Week"
          description={weekLoadError ?? 'No active week is available right now.'}
        />
        <div className="mt-4">
          <Button variant="outline" onClick={loadCurrentWeek}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading report form..." />;
  }

  // Already submitted
  if (existingReport?.status === 'submitted') {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Report Already Submitted</CardTitle>
            <CardDescription>
              You have already submitted your report for {selectedWeek.displayLabel}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <StatusPill status="submitted" />
            <p className="text-sm text-muted-foreground">
              Submitted on{' '}
              {existingReport.submittedAt ? new Date(existingReport.submittedAt).toLocaleDateString() : '—'}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate('/leader')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => navigate(`/leader/reports/${selectedWeek.isoWeekId}/${user.id}`)}>
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
            <CardTitle>Leader Weekly Report</CardTitle>
            <CardDescription>
              Fill out your weekly report for your team. Reports auto-save as drafts.
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
              // ✅ Dropdown beside EACH field
              showKrSelector={true}
              krOptions={krOptions}
              fieldKrMap={fieldKrMap}
              onFieldKrChange={(fieldId, krId) => {
                setFieldKrMap((prev) => ({ ...prev, [fieldId]: krId }));
              }}
            />
          </CardContent>
        </Card>

        <ExtraFieldsBuilder extraFields={extraFields} onExtraFieldsChange={setExtraFields} />
      </div>
    </div>
  );
}
