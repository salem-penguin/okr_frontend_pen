// // src/pages/ceo/CompanyOKRs.tsx
// import { useEffect, useMemo, useState } from "react";
// import { apiFetch } from "@/api/client";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { LoadingState } from "@/components/shared/LoadingState";
// import { EmptyState } from "@/components/shared/EmptyState";
// import { Plus, Pencil, Trash2 } from "lucide-react";
// import { toast } from "sonner";

// // --------------------
// // Types
// // --------------------
// type KR = { id: string; title: string };
// type Objective = { id: string; title: string; key_results: KR[] };

// type CompanyOKRsResponse = {
//   quarter: {
//     quarter_id: string;
//     start_date: string;
//     end_date: string;
//     seconds_remaining: number;
//   };
//   objectives: Objective[];
// };

// type AddObjectiveRequest = { title: string };
// type AddKeyResultRequest = { objective_id: string; title: string };

// // --------------------
// // Helpers
// // --------------------
// function formatCountdown(totalSeconds: number) {
//   const s = Math.max(0, Math.floor(totalSeconds));
//   const days = Math.floor(s / 86400);
//   const hours = Math.floor((s % 86400) / 3600);
//   const minutes = Math.floor((s % 3600) / 60);

//   if (days > 0) return `${days}d ${hours}h ${minutes}m`;
//   if (hours > 0) return `${hours}h ${minutes}m`;
//   return `${minutes}m`;
// }

// // Minimal prompt helpers (no extra dialog component required)
// async function promptText(label: string, placeholder = ""): Promise<string | null> {
//   const v = window.prompt(label, placeholder);
//   if (v === null) return null;
//   const trimmed = v.trim();
//   return trimmed.length ? trimmed : null;
// }

// export default function CompanyOKRs() {
//   const [data, setData] = useState<CompanyOKRsResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isBusy, setIsBusy] = useState(false);

//   const secondsRemaining = data?.quarter.seconds_remaining ?? 0;

//   const countdownLabel = useMemo(
//     () => formatCountdown(secondsRemaining),
//     [secondsRemaining]
//   );

//   const load = async () => {
//     setIsLoading(true);
//     try {
//       const res = await apiFetch<CompanyOKRsResponse>("/okrs/company/current");
//       setData(res);
//     } catch (e) {
//       console.error("Failed to load company OKRs:", e);
//       toast.error("Failed to load company OKRs");
//       setData(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   // Optional: live countdown tick in UI (does NOT auto-change quarter)
//   useEffect(() => {
//     if (!data) return;
//     const t = setInterval(() => {
//       setData((prev) => {
//         if (!prev) return prev;
//         return {
//           ...prev,
//           quarter: {
//             ...prev.quarter,
//             seconds_remaining: Math.max(0, prev.quarter.seconds_remaining - 1),
//           },
//         };
//       });
//     }, 1000);
//     return () => clearInterval(t);
//   }, [data?.quarter.quarter_id]);

//   const handleAddObjective = async () => {
//     const title = await promptText("Objective title:", "e.g., Improve product quality");
//     if (!title) return;

//     setIsBusy(true);
//     try {
//       await apiFetch("/okrs/company/objectives", {
//         method: "POST",
//         body: JSON.stringify({ title } satisfies AddObjectiveRequest),
//       });
//       toast.success("Objective added");
//       await load();
//     } catch (e) {
//       console.error("Failed to add objective:", e);
//       toast.error("Failed to add objective");
//     } finally {
//       setIsBusy(false);
//     }
//   };

//   const handleAddKeyResult = async (objectiveId: string) => {
//     const title = await promptText("Key Result:", "e.g., Achieve 99.9% uptime");
//     if (!title) return;

//     setIsBusy(true);
//     try {
//       await apiFetch("/okrs/company/key-results", {
//         method: "POST",
//         body: JSON.stringify({ objective_id: objectiveId, title } satisfies AddKeyResultRequest),
//       });
//       toast.success("Key Result added");
//       await load();
//     } catch (e) {
//       console.error("Failed to add key result:", e);
//       toast.error("Failed to add key result");
//     } finally {
//       setIsBusy(false);
//     }
//   };

//   // NOTE: You asked for UI like the screenshot (Edit/Delete links).
//   // These endpoints are not yet created in your backend, so for now they show a message.
//   const handleEditObjective = async () => {
//     toast.info("Edit endpoint not implemented yet (backend required).");
//   };

//   const handleDeleteObjective = async () => {
//     toast.info("Delete endpoint not implemented yet (backend required).");
//   };

//   if (isLoading) return <LoadingState message="Loading company OKRs..." />;

//   if (!data) {
//     return (
//       <div className="p-6">
//         <EmptyState
//           title="Company OKRs"
//           description="Failed to load OKRs."
//           actionLabel="Retry"
//           onAction={load}
//         />
//       </div>
//     );
//   }

//   return (
//     <div className="p-6 max-w-4xl mx-auto space-y-6">
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold">Company OKRs</h1>
//           <p className="text-muted-foreground">
//             Quarter: <span className="font-medium">{data.quarter.quarter_id}</span>
//           </p>
//         </div>

//         <Button onClick={handleAddObjective} disabled={isBusy}>
//           <Plus className="h-4 w-4 mr-2" />
//           Add New OKR
//         </Button>
//       </div>

//       <Alert>
//         <AlertDescription className="flex items-center justify-between gap-4">
//           <span>
//             Time remaining this quarter: <span className="font-medium">{countdownLabel}</span>
//           </span>
//           <span className="text-xs text-muted-foreground">
//             {data.quarter.start_date} → {data.quarter.end_date}
//           </span>
//         </AlertDescription>
//       </Alert>

//       {data.objectives.length === 0 ? (
//         <EmptyState
//           title="No OKRs yet"
//           description="Add your first company objective for this quarter."
//           actionLabel="Add New OKR"
//           onAction={handleAddObjective}
//         />
//       ) : (
//         <div className="space-y-4">
//           {data.objectives.map((obj) => (
//             <Card key={obj.id} className="border">
//               <CardHeader className="flex flex-row items-start justify-between gap-4">
//                 <CardTitle className="text-xl">{obj.title}</CardTitle>

//                 <div className="flex items-center gap-4">
//                   <button
//                     type="button"
//                     onClick={handleEditObjective}
//                     className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
//                     disabled={isBusy}
//                   >
//                     <Pencil className="h-4 w-4" />
//                     Edit
//                   </button>

//                   <button
//                     type="button"
//                     onClick={handleDeleteObjective}
//                     className="text-sm text-red-600 hover:underline inline-flex items-center gap-1"
//                     disabled={isBusy}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                     Delete
//                   </button>
//                 </div>
//               </CardHeader>

//               <CardContent className="space-y-3">
//                 <ul className="ml-6 list-disc space-y-2">
//                   {obj.key_results?.length ? (
//                     obj.key_results.map((kr) => (
//                       <li key={kr.id} className="text-sm">
//                         {kr.title}
//                       </li>
//                     ))
//                   ) : (
//                     <li className="text-sm text-muted-foreground">No key results yet.</li>
//                   )}
//                 </ul>

//                 <div className="pt-2">
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleAddKeyResult(obj.id)}
//                     disabled={isBusy}
//                   >
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add Key Result
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// import { useEffect, useMemo, useState } from "react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Alert, AlertDescription } from "@/components/ui/alert";
// import { LoadingState } from "@/components/shared/LoadingState";
// import { EmptyState } from "@/components/shared/EmptyState";
// import { toast } from "sonner";
// import { apiFetch } from "@/api/client";
// import { Plus, Target } from "lucide-react";

// type CurrentCompanyOKRsResponse = {
//   quarter: {
//     quarter_id: string;
//     start_date: string;
//     end_date: string;
//     seconds_remaining: number;
//   };
//   okr: { id: string; quarter_id: string; quarter_start: string; quarter_end: string } | null;
//   objectives: { id: string; title: string; key_results: { id: string; title: string }[] }[];
// };

// function formatDuration(seconds: number) {
//   const s = Math.max(0, seconds);
//   const days = Math.floor(s / 86400);
//   const hours = Math.floor((s % 86400) / 3600);
//   const mins = Math.floor((s % 3600) / 60);
//   return `${days}d ${hours}h ${mins}m`;
// }

// export default function CompanyOKRs() {
//   const [data, setData] = useState<CurrentCompanyOKRsResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);

//   const [newObjectiveTitle, setNewObjectiveTitle] = useState("");
//   const [krDrafts, setKrDrafts] = useState<Record<string, string>>({});

//   const secondsRemaining = data?.quarter.seconds_remaining ?? 0;
//   const remainingLabel = useMemo(() => formatDuration(secondsRemaining), [secondsRemaining]);

//   const load = async () => {
//     setIsLoading(true);
//     try {
//       const res = await apiFetch<CurrentCompanyOKRsResponse>("/okrs/company/current");
//       setData(res);
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load company OKRs");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();

//     // optional live countdown refresh every 60s
//     const t = setInterval(() => {
//       setData(prev => {
//         if (!prev) return prev;
//         return {
//           ...prev,
//           quarter: {
//             ...prev.quarter,
//             seconds_remaining: Math.max(0, prev.quarter.seconds_remaining - 60),
//           },
//         };
//       });
//     }, 60_000);

//     return () => clearInterval(t);
//   }, []);

//   const addObjective = async () => {
//     const title = newObjectiveTitle.trim();
//     if (!title) {
//       toast.error("Objective title is required");
//       return;
//     }

//     try {
//       await apiFetch("/okrs/company/objectives", {
//         method: "POST",
//         body: JSON.stringify({ title }),
//       });
//       setNewObjectiveTitle("");
//       toast.success("Objective added");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to add objective");
//     }
//   };

//   const addKeyResult = async (objectiveId: string) => {
//     const title = (krDrafts[objectiveId] ?? "").trim();
//     if (!title) {
//       toast.error("Key result title is required");
//       return;
//     }

//     try {
//       await apiFetch("/okrs/company/key-results", {
//         method: "POST",
//         body: JSON.stringify({ objective_id: objectiveId, title }),
//       });
//       setKrDrafts(prev => ({ ...prev, [objectiveId]: "" }));
//       toast.success("Key result added");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to add key result");
//     }
//   };

//   if (isLoading) return <LoadingState message="Loading company OKRs..." />;

//   if (!data) {
//     return (
//       <EmptyState
//         title="No data"
//         description="Unable to load company OKRs."
//         actionLabel="Retry"
//         onAction={load}
//       />
//     );
//   }

//   return (
//     <div className="space-y-6 p-6">
//       <div>
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <Target className="h-6 w-6" />
//           Company OKRs
//         </h1>
//         <p className="text-muted-foreground">
//           Quarter <span className="font-medium">{data.quarter.quarter_id}</span> ({data.quarter.start_date} → {data.quarter.end_date})
//         </p>
//       </div>

//       <Alert>
//         <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
//           <span>
//             Time remaining in this quarter: <span className="font-medium">{remainingLabel}</span>
//           </span>
//           <Button variant="outline" onClick={load}>
//             Refresh
//           </Button>
//         </AlertDescription>
//       </Alert>

//       <Card>
//         <CardHeader>
//           <CardTitle>Add Objective</CardTitle>
//           <CardDescription>Define the company objectives for the quarter.</CardDescription>
//         </CardHeader>
//         <CardContent className="flex flex-col sm:flex-row gap-3">
//           <Input
//             value={newObjectiveTitle}
//             onChange={(e) => setNewObjectiveTitle(e.target.value)}
//             placeholder="e.g., Improve customer retention by 15%"
//           />
//           <Button onClick={addObjective}>
//             <Plus className="h-4 w-4 mr-2" />
//             Add Objective
//           </Button>
//         </CardContent>
//       </Card>

//       <div className="space-y-4">
//         {data.objectives.length === 0 ? (
//           <EmptyState
//             title="No objectives yet"
//             description="Start by adding your first objective."
//           />
//         ) : (
//           data.objectives.map((obj) => (
//             <Card key={obj.id}>
//               <CardHeader>
//                 <CardTitle className="text-lg">{obj.title}</CardTitle>
//                 <CardDescription>{obj.key_results.length} key results</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <div className="space-y-2">
//                   {obj.key_results.length === 0 ? (
//                     <p className="text-sm text-muted-foreground">No key results yet.</p>
//                   ) : (
//                     <ul className="list-disc pl-5 space-y-1">
//                       {obj.key_results.map((kr) => (
//                         <li key={kr.id} className="text-sm">
//                           {kr.title}
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-3">
//                   <Input
//                     value={krDrafts[obj.id] ?? ""}
//                     onChange={(e) => setKrDrafts((p) => ({ ...p, [obj.id]: e.target.value }))}
//                     placeholder="Add a key result..."
//                   />
//                   <Button variant="secondary" onClick={() => addKeyResult(obj.id)}>
//                     <Plus className="h-4 w-4 mr-2" />
//                     Add KR
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))
//         )}
//       </div>
//     </div>
//   );
// }

// src/pages/ceo/CompanyOKRs.tsx
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";

import { ChevronUp, ChevronDown, Plus, RefreshCw } from "lucide-react";

// --------------------
// Types
// --------------------
type KRStatus = "not_started" | "in_progress" | "completed";

type KR = {
  id: string;
  title: string;
  status: KRStatus;
  progress: number;
};

type Objective = {
  id: string;
  title: string;
  progress: number;
  key_results: KR[];
};

type TeamBlock = {
  team_id: string | null;
  team_name: string;
  objectives: Objective[];
};

type CurrentOKRsResponse = {
  quarter: {
    quarter_id: string;
    start_date: string;
    end_date: string;
    seconds_remaining: number;
  };
  teams: TeamBlock[];
};

type TeamOption = { id: string; name: string };
type TeamsResponse = { items: TeamOption[]; count: number };

// --------------------
// Helpers
// --------------------
function formatDuration(seconds: number) {
  const s = Math.max(0, seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

function statusLabel(s: KRStatus) {
  if (s === "completed") return { text: "Completed", cls: "text-green-600" };
  if (s === "in_progress") return { text: "In Progress", cls: "text-amber-600" };
  return { text: "Not Started", cls: "text-muted-foreground" };
}

function safeArray<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

export default function CompanyOKRs() {
  const { user } = useAuth();
  const isCEO = user?.role === "ceo";

  const [data, setData] = useState<CurrentOKRsResponse | null>(null);
  const [teamsOptions, setTeamsOptions] = useState<TeamOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // collapse per team
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  // Add objective
  const [newObjectiveTitle, setNewObjectiveTitle] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(""); // "" => unassigned

  // Add KR (inline per objective)
  const [krDraftByObjective, setKrDraftByObjective] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const remaining = useMemo(
    () => formatDuration(data?.quarter.seconds_remaining ?? 0),
    [data?.quarter.seconds_remaining]
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<CurrentOKRsResponse>("/okrs/company/current");

      // Hard-safe normalize so we never crash on .length
      const normalized: CurrentOKRsResponse = {
        quarter: res.quarter,
        teams: safeArray(res.teams).map((t) => ({
          ...t,
          objectives: safeArray(t.objectives).map((o) => ({
            ...o,
            key_results: safeArray(o.key_results),
          })),
        })),
      };

      setData(normalized);

      // default open all team sections
      setOpenTeams((prev) => {
        const next: Record<string, boolean> = { ...prev };
        for (const t of normalized.teams) {
          const k = t.team_id ?? "unassigned";
          if (typeof next[k] !== "boolean") next[k] = true;
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load OKRs");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await apiFetch<TeamsResponse>("/okrs/teams");
      setTeamsOptions(safeArray(res.items));
    } catch (e) {
      console.error(e);
      // Do not block page if teams fail; CEO can still add "Unassigned"
      toast.error("Failed to load teams");
      setTeamsOptions([]);
    }
  };

  useEffect(() => {
    load();
    if (isCEO) loadTeams();

    // countdown tick (1 minute)
    const t = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          quarter: {
            ...prev.quarter,
            seconds_remaining: Math.max(0, (prev.quarter.seconds_remaining ?? 0) - 60),
          },
        };
      });
    }, 60_000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addObjective = async () => {
    if (!isCEO) return;

    const title = newObjectiveTitle.trim();
    if (!title) return toast.error("Objective title is required");

    setIsSaving(true);
    try {
      await apiFetch("/okrs/company/objectives", {
        method: "POST",
        body: JSON.stringify({
          title,
          team_id: selectedTeamId ? selectedTeamId : null,
        }),
      });

      setNewObjectiveTitle("");
      setSelectedTeamId("");
      toast.success("Objective added");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add objective");
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyResult = async (objectiveId: string) => {
    if (!isCEO) return;

    const title = (krDraftByObjective[objectiveId] || "").trim();
    if (!title) return toast.error("Key Result title is required");

    setIsSaving(true);
    try {
      // MUST be POST per your backend
      await apiFetch("/okrs/company/key-results", {
        method: "POST",
        body: JSON.stringify({
          objective_id: objectiveId,
          title,
        }),
      });

      setKrDraftByObjective((prev) => ({ ...prev, [objectiveId]: "" }));
      toast.success("Key Result added");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add key result");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isCEO) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          description="This page is available for CEO only."
        />
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading OKR progress..." />;

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          title="No data"
          description="Unable to load OKRs."
          actionLabel="Retry"
          onAction={load}
        />
      </div>
    );
  }

  const teams = safeArray(data.teams);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Company OKRs</h1>
          <p className="text-muted-foreground">
            {data.quarter.quarter_id} ({data.quarter.start_date} → {data.quarter.end_date}) • Time left:{" "}
            <span className="font-medium">{remaining}</span>
          </p>
        </div>

        <Button variant="outline" onClick={load} disabled={isSaving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Add Objective */}
      <Card>
        <CardHeader>
          <CardTitle>Add new Objective</CardTitle>
          <CardDescription>
            Assign each objective to a team. Progress and status will be updated by the assigned team.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input
              value={newObjectiveTitle}
              onChange={(e) => setNewObjectiveTitle(e.target.value)}
              placeholder="Objective title..."
            />
          </div>

          <div className="sm:col-span-1">
            <select
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">Unassigned (Company-level)</option>
              {teamsOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <Button onClick={addObjective} disabled={isSaving}>
              <Plus className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* OKR list */}
      {teams.length === 0 ? (
        <EmptyState
          title="No OKRs yet"
          description="Add objectives and key results for this quarter."
        />
      ) : (
        <div className="space-y-6">
          {teams.map((team) => {
            const key = team.team_id ?? "unassigned";
            const isOpen = openTeams[key] ?? true;

            return (
              <Card key={key} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                    <CardDescription>
                      Progress is updated by the assigned team.
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpenTeams((p) => ({ ...p, [key]: !isOpen }))}
                    className="h-8 w-8"
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardHeader>

                {isOpen && (
                  <CardContent className="space-y-6">
                    {safeArray(team.objectives).length === 0 ? (
                      <EmptyState
                        title="No objectives"
                        description="Add an objective for this team."
                      />
                    ) : (
                      safeArray(team.objectives).map((obj) => (
                        <div key={obj.id} className="space-y-3 rounded-lg border border-border p-4">
                          {/* Objective header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="font-semibold">{obj.title}</div>
                            <div className="text-sm text-muted-foreground">{obj.progress ?? 0}%</div>
                          </div>

                          {/* Progress bar (read only for CEO) */}
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(100, Math.max(0, obj.progress ?? 0))}%` }}
                            />
                          </div>

                          {/* Key results list */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Key Results</div>

                            {safeArray(obj.key_results).length === 0 ? (
                              <p className="text-sm text-muted-foreground">No key results yet.</p>
                            ) : (
                              <ul className="space-y-2">
                                {safeArray(obj.key_results).map((kr) => {
                                  const s = statusLabel(kr.status);
                                  return (
                                    <li
                                      key={kr.id}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border border-border p-3"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <div className="text-sm font-medium">{kr.title}</div>
                                        <div className={`text-xs ${s.cls}`}>
                                          {s.text} • {kr.progress ?? 0}%
                                        </div>
                                      </div>

                                      {/* CEO sees read-only info only */}
                                      <div className="text-xs text-muted-foreground">
                                        Updated by team
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>

                          {/* Add KR */}
                          <div className="grid gap-2 sm:grid-cols-6 pt-2">
                            <div className="sm:col-span-5">
                              <Input
                                value={krDraftByObjective[obj.id] ?? ""}
                                onChange={(e) =>
                                  setKrDraftByObjective((prev) => ({
                                    ...prev,
                                    [obj.id]: e.target.value,
                                  }))
                                }
                                placeholder="Add a key result..."
                              />
                            </div>
                            <div className="sm:col-span-1">
                              <Button
                                className="w-full"
                                onClick={() => addKeyResult(obj.id)}
                                disabled={isSaving}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
