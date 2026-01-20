// import { useState, useEffect } from 'react';
// import { FormField } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import * as api from '@/lib/mock-api';
// import { FormBuilder } from '@/components/form-builder/FormBuilder';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';

// export default function LeaderFormBuilder() {
//   const { user } = useAuth();
//   const [initialFields, setInitialFields] = useState<FormField[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [teamName, setTeamName] = useState<string>('');

//   useEffect(() => {
//     async function loadForm() {
//       if (!user?.teamId) return;
      
//       try {
//         // Get team name
//         const team = await api.getTeamById(user.teamId);
//         if (team) setTeamName(team.name);

//         // Try to get team-specific form first, then fallback to default
//         const form = await api.getActiveForm('member', user.teamId);
//         if (form) {
//           setInitialFields(form.fields);
//         }
//       } catch (error) {
//         console.error('Failed to load form:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     loadForm();
//   }, [user?.teamId]);

//   const handleSave = async (fields: FormField[]) => {
//     if (!user?.teamId) return;
    
//     await api.saveMemberFormSchema(fields, user.teamId);
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
//     return <LoadingState message="Loading form builder..." />;
//   }

//   return (
//     <div className="p-6">
//       <FormBuilder
//         initialFields={initialFields}
//         onSave={handleSave}
//         title={`${teamName} Member Report Form`}
//         description="Customize the weekly report form for your team members. Changes will apply to new reports only."
//       />
//     </div>
//   );
// }


// #################################################
// #################################################
// #################################################
// #################################################


// import { useState, useEffect } from 'react';
// import { FormField } from '@/types';
// import { useAuth } from '@/contexts/AuthContext';
// import { apiFetch } from '@/api/client';
// import { FormBuilder } from '@/components/form-builder/FormBuilder';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';

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

// type SaveFormSchemaRequest = {
//   scope: 'member' | 'leader';
//   team_id?: string;
//   leader_id?: string;
//   fields: FormField[];
// };

// export default function LeaderFormBuilder() {
//   const { user } = useAuth();

//   const [initialFields, setInitialFields] = useState<FormField[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [teamName, setTeamName] = useState<string>('');

//   const userEmail = user?.email;

//   useEffect(() => {
//     async function loadForm() {
//       if (!userEmail) return;

//       setIsLoading(true);
//       try {
//         const me = await apiFetch<MeResponse>('/me');

//         if (!me.team?.id) {
//           setTeamName('');
//           setInitialFields([]);
//           return;
//         }

//         setTeamName(me.team.name);

//         const form = await apiFetch<ActiveFormResponse>(
//           `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
//         )


//         setInitialFields(form.fields ?? []);
//       } catch (error) {
//         console.error('Failed to load form:', error);
//         setInitialFields([]);
//       } finally {
//         setIsLoading(false);
//       }
//     }

//     loadForm();
//   }, [userEmail]);

//   const handleSave = async (fields: FormField[]) => {
//     if (!userEmail) return;

//     setIsLoading(true);
//     try {
//       const me = await apiFetch<MeResponse>('/me');
//       if (!me.team?.id) throw new Error('No team assigned');

//       const payload: SaveFormSchemaRequest = {
//         scope: 'leader',
//         team_id: me.id,
//         fields,
//       };

//       await apiFetch('/forms/schemas', {
//         method: 'POST',
//         body: JSON.stringify(payload),
//       });

//       const form = await apiFetch<ActiveFormResponse>(
//         `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
//       );

//       setInitialFields(form.fields ?? []);
//     } catch (error) {
//       console.error('Failed to save form:', error);
//     } finally {
//       setIsLoading(false);
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
//     return <LoadingState message="Loading form builder..." />;
//   }

//   return (
//     <div className="p-6">
//       <FormBuilder
//         initialFields={initialFields}
//         onSave={handleSave}
//         title={`${teamName} Member Report Form`}
//         description="Customize the weekly report form for your team members. Changes will apply to new reports only."
//       />
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { FormField } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/api/client';
import { FormBuilder } from '@/components/form-builder/FormBuilder';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';

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

type SaveFormSchemaRequest = {
  scope: 'member' | 'leader';
  team_id?: string;
  leader_id?: string;
  fields: FormField[];
};

export default function LeaderFormBuilder() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const [initialFields, setInitialFields] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [teamName, setTeamName] = useState<string>('');

  useEffect(() => {
    const loadForm = async () => {
      if (!userEmail) return;

      setIsLoading(true);
      try {
        const me = await apiFetch<MeResponse>('/me');

        // For leader form, team membership is not strictly required by backend,
        // but your UI wants to show a friendly header.
        if (!me.team?.id) {
          setTeamName('');
          setInitialFields([]);
          return;
        }

        setTeamName(me.team.name);

        const form = await apiFetch<ActiveFormResponse>(
          `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
        );

        setInitialFields(form.fields ?? []);
      } catch (error) {
        console.error('Failed to load form:', error);
        setInitialFields([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadForm();
  }, [userEmail]);

  const handleSave = async (fields: FormField[]) => {
    if (!userEmail) return;

    setIsLoading(true);
    try {
      const me = await apiFetch<MeResponse>('/me');

      // Optional UI constraint: keep as you had it
      if (!me.team?.id) throw new Error('No team assigned');

      const payload: SaveFormSchemaRequest = {
        scope: 'leader',
        leader_id: me.id, // ✅ correct for leader scope
        fields,
      };

      await apiFetch('/forms/schemas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const updated = await apiFetch<ActiveFormResponse>(
        `/forms/active?scope=leader&leader_id=${encodeURIComponent(me.id)}`
      );

      setInitialFields(updated.fields ?? []);
    } catch (error) {
      console.error('Failed to save form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If you want ONLY leaders to access this page, consider also checking user.role === 'team_leader'
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

  if (isLoading) {
    return <LoadingState message="Loading form builder..." />;
  }

  return (
    <div className="p-6">
      <FormBuilder
        initialFields={initialFields}
        onSave={handleSave}
        title={`${teamName} Leader Report Form`} // ✅ fix title
        description="Customize your weekly leader report form. Changes will apply to new reports only." // ✅ fix description
      />
    </div>
  );
}
