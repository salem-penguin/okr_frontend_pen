// import { useState, useEffect, useCallback } from 'react';
// import { FormField, Team, User } from '@/types';
// import * as api from '@/lib/mock-api';
// import { FormBuilder } from '@/components/form-builder/FormBuilder';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Users } from 'lucide-react';

// export default function CEOFormBuilder() {
//   const [teams, setTeams] = useState<Team[]>([]);
//   const [leaders, setLeaders] = useState<User[]>([]);
//   const [selectedTarget, setSelectedTarget] = useState<string>('default');
//   const [initialFields, setInitialFields] = useState<FormField[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isLoadingForm, setIsLoadingForm] = useState(false);

//   // Load teams and leaders on mount
//   useEffect(() => {
//     async function loadTeamsAndLeaders() {
//       try {
//         const [teamsData, leadersData] = await Promise.all([
//           api.getTeams(),
//           api.getTeamLeaders(),
//         ]);
//         setTeams(teamsData);
//         setLeaders(leadersData);
//       } catch (error) {
//         console.error('Failed to load teams:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadTeamsAndLeaders();
//   }, []);

//   // Load form when target changes
//   const loadForm = useCallback(async () => {
//     setIsLoadingForm(true);
//     try {
//       // For 'default', we pass no teamId
//       // For specific leaders, we get form for that leader's team
//       let form;
//       if (selectedTarget === 'default') {
//         form = await api.getActiveLeaderForm();
//       } else {
//         form = await api.getActiveLeaderForm(selectedTarget);
//       }
      
//       if (form) {
//         setInitialFields(form.fields);
//       } else {
//         // Default form fields
//         setInitialFields([
//           { id: 'accomplishments', type: 'textarea', label: 'Key Accomplishments This Week', placeholder: "List your team's main achievements...", required: true },
//           { id: 'challenges', type: 'textarea', label: 'Challenges & Blockers', placeholder: 'Any obstacles faced...', required: true },
//           { id: 'next_week', type: 'textarea', label: 'Goals for Next Week', placeholder: 'What are the priorities for next week...', required: true },
//           { id: 'morale', type: 'number', label: 'Team Morale (1-10)', placeholder: '8', required: true },
//           { id: 'notes', type: 'textarea', label: 'Additional Notes', placeholder: 'Any other updates...', required: false },
//         ]);
//       }
//     } catch (error) {
//       console.error('Failed to load form:', error);
//     } finally {
//       setIsLoadingForm(false);
//     }
//   }, [selectedTarget]);

//   useEffect(() => {
//     if (!isLoading) {
//       loadForm();
//     }
//   }, [loadForm, isLoading]);

//   const handleSave = async (fields: FormField[]) => {
//     // If default, save without leaderId
//     // If specific leader, save with leaderId
//     if (selectedTarget === 'default') {
//       await api.saveLeaderFormSchema(fields);
//     } else {
//       await api.saveLeaderFormSchema(fields, selectedTarget);
//     }
//   };

//   const getTargetLabel = () => {
//     if (selectedTarget === 'default') {
//       return 'Default Leader Report Form';
//     }
//     const leader = leaders.find(l => l.id === selectedTarget);
//     const team = teams.find(t => t.leaderId === selectedTarget);
//     return `${leader?.name || 'Leader'} - ${team?.name || 'Team'}`;
//   };

//   if (isLoading) {
//     return <LoadingState message="Loading form builder..." />;
//   }

//   return (
//     <div className="p-6 space-y-6">
//       {/* Target Selector */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Users className="h-5 w-5" />
//             Select Form Target
//           </CardTitle>
//           <CardDescription>
//             Choose which leader's report form to customize. The default form applies to all leaders without a custom form.
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Select value={selectedTarget} onValueChange={setSelectedTarget}>
//             <SelectTrigger className="max-w-md">
//               <SelectValue placeholder="Select target..." />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="default">
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium">Default Form</span>
//                   <span className="text-muted-foreground text-xs">(All leaders)</span>
//                 </div>
//               </SelectItem>
//               {leaders.map((leader) => {
//                 const team = teams.find(t => t.leaderId === leader.id);
//                 return (
//                   <SelectItem key={leader.id} value={leader.id}>
//                     <div className="flex items-center gap-2">
//                       <span>{leader.name}</span>
//                       <span className="text-muted-foreground text-xs">({team?.name})</span>
//                     </div>
//                   </SelectItem>
//                 );
//               })}
//             </SelectContent>
//           </Select>
//         </CardContent>
//       </Card>

//       {/* Form Builder */}
//       {isLoadingForm ? (
//         <LoadingState message="Loading form..." />
//       ) : (
//         <FormBuilder
//           key={selectedTarget} // Force re-render when target changes
//           initialFields={initialFields}
//           onSave={handleSave}
//           title={getTargetLabel()}
//           description={
//             selectedTarget === 'default'
//               ? 'Customize the default weekly report form that all team leaders will fill out.'
//               : `Customize the report form for this specific leader. This overrides the default form.`
//           }
//         />
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useMemo } from 'react';
import { FormField } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/api/client';
import { FormBuilder } from '@/components/form-builder/FormBuilder';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users } from 'lucide-react';

// --------------------
// Backend response types (match FastAPI)
// --------------------
type MeResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  team: { id: string; name: string; leader_id: string | null } | null;
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

type SaveFormSchemaRequest = {
  scope: 'member' | 'leader';
  team_id?: string;
  leader_id?: string;
  fields: FormField[];
};

export default function CEOFormBuilder() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [leaders, setLeaders] = useState<LeadersListResponse['items']>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');

  const [initialFields, setInitialFields] = useState<FormField[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  const selectedLeader = useMemo(
    () => leaders.find((l) => l.id === selectedLeaderId) ?? null,
    [leaders, selectedLeaderId]
  );

  // Boot: verify CEO + load leaders list
  useEffect(() => {
    const boot = async () => {
      if (!userEmail) return;

      setIsLoadingPage(true);
      try {
        const me = await apiFetch<MeResponse>('/me');

        if (me.role !== 'ceo') {
          setLeaders([]);
          setSelectedLeaderId('');
          setInitialFields([]);
          return;
        }

        const res = await apiFetch<LeadersListResponse>('/users?role=team_leader');

        const items = res.items ?? [];
        setLeaders(items);

        if (items.length > 0) {
          setSelectedLeaderId(items[0].id);
        } else {
          setSelectedLeaderId('');
          setInitialFields([]);
        }
      } catch (err) {
        console.error('Failed to load CEO form builder:', err);
        setLeaders([]);
        setSelectedLeaderId('');
        setInitialFields([]);
      } finally {
        setIsLoadingPage(false);
      }
    };

    boot();
  }, [userEmail]);

  // Load form whenever selected leader changes
  useEffect(() => {
    const loadForm = async () => {
      if (!userEmail) return;
      if (!selectedLeaderId) return;

      setIsLoadingForm(true);
      try {
        const form = await apiFetch<ActiveFormResponse>(
          `/forms/active?scope=leader&leader_id=${encodeURIComponent(selectedLeaderId)}`
        );
        setInitialFields(form.fields ?? []);
      } catch (err) {
        // If there is no active form for that leader, backend returns 404.
        // Decide UX: empty fields (current) OR use a default template.
        console.error('Failed to load leader form (may be missing):', err);
        setInitialFields([]);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadForm();
  }, [selectedLeaderId, userEmail]);

  const handleSave = async (fields: FormField[]) => {
    if (!userEmail) return;
    if (!selectedLeaderId) return;

    setIsLoadingForm(true);
    try {
      const me = await apiFetch<MeResponse>('/me');
      if (me.role !== 'ceo') throw new Error('Forbidden');

      const payload: SaveFormSchemaRequest = {
        scope: 'leader',
        leader_id: selectedLeaderId, // ✅ CEO specifies leader
        fields,
      };

      await apiFetch('/forms/schemas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const updated = await apiFetch<ActiveFormResponse>(
        `/forms/active?scope=leader&leader_id=${encodeURIComponent(selectedLeaderId)}`
      );

      setInitialFields(updated.fields ?? []);
    } catch (err) {
      console.error('Failed to save leader form schema:', err);
    } finally {
      setIsLoadingForm(false);
    }
  };

  if (isLoadingPage) {
    return <LoadingState message="Loading form builder..." />;
  }

  // Gate (optional, but consistent)
  if (user?.role && user.role !== 'ceo') {
    return (
      <div className="p-6">
        <EmptyState title="Access Denied" description="This page is available to CEOs only." />
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          title="No team leaders found"
          description="There are no team leaders configured in the system."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Leader Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Team Leader
          </CardTitle>
          <CardDescription>
            Choose which team leader&apos;s report form to customize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLeaderId} onValueChange={setSelectedLeaderId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a team leader..." />
            </SelectTrigger>
            <SelectContent>
              {leaders.map((leader) => (
                <SelectItem key={leader.id} value={leader.id}>
                  <div className="flex items-center gap-2">
                    <span>{leader.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({leader.team?.name ?? 'No team'})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Form Builder */}
      {isLoadingForm ? (
        <LoadingState message="Loading form..." />
      ) : (
        <FormBuilder
          key={selectedLeaderId}
          initialFields={initialFields}
          onSave={handleSave}
          title={
            selectedLeader
              ? `${selectedLeader.name} — Leader Report Form`
              : 'Leader Report Form'
          }
          description="Customize the weekly report form for this team leader. Changes apply to new reports only."
        />
      )}
    </div>
  );
}
