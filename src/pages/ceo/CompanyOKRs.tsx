// // src/pages/ceo/CompanyOKRs.tsx
// import React, { useEffect, useMemo, useState } from "react";
// import { apiFetch } from "@/api/client";
// import { useAuth } from "@/contexts/AuthContext";
// import { toast } from "sonner";

// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { LoadingState } from "@/components/shared/LoadingState";
// import { EmptyState } from "@/components/shared/EmptyState";

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// import {
//   ChevronUp,
//   ChevronDown,
//   Plus,
//   RefreshCw,
//   Save,
//   MessageSquare,
//   Loader2,
// } from "lucide-react";

// // --------------------
// // Updates (CEO comments)
// // --------------------
// type KRUpdateItem = {
//   id: string;
//   kr_id: string;
//   kr_title: string;
//   objective_id: string;
//   objective_title: string;
//   team: { id: string; name: string } | null;
//   week_id: string;
//   week_label: string | null;
//   note: string;
//   meta: any;
//   created_at: string;
//   author: { id: string; name: string; email: string } | null;
// };

// type CompanyKRUpdatesResponse = { items: KRUpdateItem[]; count: number };

// // --------------------
// // Types
// // --------------------
// type KRStatus = "not_started" | "in_progress" | "completed";

// type KR = {
//   id: string;
//   title: string;
//   status: KRStatus;
//   progress: number;
//   weight: number;
// };

// type ObjectiveTimeline = {
//   timeline_start: string;
//   timeline_end: string;
//   is_expired: boolean;
//   days_remaining: number;
//   needs_extension_prompt: boolean;
// };

// type Objective = {
//   id: string;
//   title: string;
//   progress: number;
//   parent_id?: string | null;
//   parent_weight?: number | null;
//   key_results: KR[];
//   timeline?: ObjectiveTimeline;
// };

// type TeamBlock = {
//   team_id: string | null;
//   team_name: string;
//   objectives: Objective[];
// };

// type CurrentOKRsResponse = {
//   quarter: {
//     quarter_id: string;
//     start_date: string;
//     end_date: string;
//     seconds_remaining: number;
//   };
//   teams: TeamBlock[];
// };

// type TeamOption = { id: string; name: string };
// type TeamsResponse = { items: TeamOption[]; count: number };

// type CompanyLevelObjectiveOption = { id: string; title: string };
// type CompanyLevelObjectivesResponse = { items: CompanyLevelObjectiveOption[]; count: number };

// type CurrentWeekResponse = {
//   week_id: string;
//   start_date: string;
//   end_date: string;
//   display_label: string;
// };

// type CompanyOKRChild = {
//   id: string;
//   title: string;
//   team_name: string | null;
//   progress: number;
//   parent_weight?: number;
// };

// type CompanyLevelOKR = {
//   id: string;
//   title: string;
//   progress: number;
//   children: CompanyOKRChild[];
// };

// type CompanyLevelOKRsResponse = {
//   items: CompanyLevelOKR[];
//   count: number;
// };

// // --------------------
// // Helpers
// // --------------------
// function formatDuration(seconds: number) {
//   const s = Math.max(0, seconds);
//   const days = Math.floor(s / 86400);
//   const hours = Math.floor((s % 86400) / 3600);
//   const mins = Math.floor((s % 3600) / 60);
//   return `${days}d ${hours}h ${mins}m`;
// }

// function safeArray<T>(x: T[] | undefined | null): T[] {
//   return Array.isArray(x) ? x : [];
// }

// function clamp01(x: number) {
//   return Math.min(100, Math.max(0, Number(x || 0)));
// }

// function krStatusFromProgress(p: number): KRStatus {
//   const v = clamp01(p);
//   if (v >= 100) return "completed";
//   if (v > 0) return "in_progress";
//   return "not_started";
// }

// function statusLabel(s: KRStatus) {
//   if (s === "completed") return { text: "Completed", cls: "text-emerald-600 dark:text-emerald-400" };
//   if (s === "in_progress") return { text: "In Progress", cls: "text-amber-700 dark:text-amber-400" };
//   return { text: "Not Started", cls: "text-muted-foreground" };
// }

// function toDateInputValue(iso?: string) {
//   if (!iso) return "";
//   return iso.slice(0, 10);
// }

// // --------------------
// // Theme-safe design tokens
// // --------------------
// const GLASS =
//   "border border-border/60 bg-card/60 backdrop-blur-xl " +
//   "shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)] " +
//   "ring-1 ring-primary/10";

// const GLASS_SUB = "border border-border/60 bg-background/40 backdrop-blur";

// function Pill({
//   children,
//   tone = "neutral",
// }: {
//   children: React.ReactNode;
//   tone?: "neutral" | "amber" | "emerald";
// }) {
//   const toneCls =
//     tone === "emerald"
//       ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
//       : tone === "amber"
//       ? "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300"
//       : "bg-muted/40 text-muted-foreground border-border/60";

//   return (
//     <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${toneCls}`}>
//       {children}
//     </span>
//   );
// }

// function ProgressBar({ value }: { value: number }) {
//   const v = clamp01(value);
//   return (
//     <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
//       <div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} />
//     </div>
//   );
// }

// // ✅ Radix Select cannot use empty string as item value
// const COMPANY_SENTINEL = "__company__";

// export default function CompanyOKRs() {
//   const { user } = useAuth();
//   const isCEO = user?.role === "ceo";

//   // ✅ CEO comments cache (all KRs)
//   const [krUpdatesByKrId, setKrUpdatesByKrId] = useState<Record<string, KRUpdateItem[]>>({});
//   const [isLoadingKrUpdates, setIsLoadingKrUpdates] = useState(false);
//   const [activeKr, setActiveKr] = useState<{ id: string; title: string } | null>(null);

//   const [data, setData] = useState<CurrentOKRsResponse | null>(null);
//   const [teamsOptions, setTeamsOptions] = useState<TeamOption[]>([]);
//   const [companyLevelOptions, setCompanyLevelOptions] = useState<CompanyLevelObjectiveOption[]>([]);
//   const [companyLevelProgress, setCompanyLevelProgress] = useState<CompanyLevelOKR[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

//   // Add objective
//   const [newObjectiveTitle, setNewObjectiveTitle] = useState("");
//   const [selectedTeamId, setSelectedTeamId] = useState<string>(COMPANY_SENTINEL);
//   const [selectedParentId, setSelectedParentId] = useState<string>("");
//   const [parentWeight, setParentWeight] = useState<number>(10);

//   // Add KR
//   const [krDraftByObjective, setKrDraftByObjective] = useState<Record<string, string>>({});
//   const [krWeightByObjective, setKrWeightByObjective] = useState<Record<string, number>>({});
//   const [isSaving, setIsSaving] = useState(false);

//   // Timeline drafts
//   const [tlDraftByObj, setTlDraftByObj] = useState<Record<string, { start: string; end: string }>>({});
//   const [isSavingTimelineByObj, setIsSavingTimelineByObj] = useState<Record<string, boolean>>({});

//   // Parent weight drafts
//   const [parentWeightDraftByObj, setParentWeightDraftByObj] = useState<Record<string, number>>({});
//   const [isSavingParentWeightByObj, setIsSavingParentWeightByObj] = useState<Record<string, boolean>>({});

//   // KR weight drafts
//   const [krWeightDraftById, setKrWeightDraftById] = useState<Record<string, number>>({});
//   const [isSavingKrWeightById, setIsSavingKrWeightById] = useState<Record<string, boolean>>({});

//   // UX controls
//   const [query, setQuery] = useState("");
//   const [onlyAttention, setOnlyAttention] = useState(false);
//   const [openObjectiveById, setOpenObjectiveById] = useState<Record<string, boolean>>({});

//   const isCompanyMode = selectedTeamId === COMPANY_SENTINEL;

//   const loadAllKrUpdates = async () => {
//     setIsLoadingKrUpdates(true);
//     try {
//       const res = await apiFetch<CompanyKRUpdatesResponse>("/okrs/company/key-results/updates?limit=500");

//       // Sort newest-first globally then group
//       const items = safeArray(res.items).slice().sort((a, b) => {
//         const ta = Date.parse(a.created_at || "");
//         const tb = Date.parse(b.created_at || "");
//         return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
//       });

//       const map: Record<string, KRUpdateItem[]> = {};
//       for (const it of items) {
//         (map[it.kr_id] ||= []).push(it);
//       }
//       setKrUpdatesByKrId(map);
//     } catch (e) {
//       console.error(e);
//       setKrUpdatesByKrId({});
//       toast.error("Failed to load KR comments");
//     } finally {
//       setIsLoadingKrUpdates(false);
//     }
//   };

//   const parentTitleById = useMemo(() => {
//     const m: Record<string, string> = {};
//     for (const p of companyLevelOptions) m[p.id] = p.title;
//     return m;
//   }, [companyLevelOptions]);

//   const parentProgressById = useMemo(() => {
//     const m: Record<string, number> = {};
//     for (const p of companyLevelProgress) m[p.id] = clamp01(p.progress);
//     return m;
//   }, [companyLevelProgress]);

//   const childrenByParentId = useMemo(() => {
//     const m: Record<string, CompanyOKRChild[]> = {};
//     for (const p of companyLevelProgress) m[p.id] = safeArray(p.children);
//     return m;
//   }, [companyLevelProgress]);

//   const remaining = useMemo(
//     () => formatDuration(data?.quarter.seconds_remaining ?? 0),
//     [data?.quarter.seconds_remaining]
//   );

//   const summary = useMemo(() => {
//     const parents = companyLevelOptions.length;
//     const children = companyLevelProgress.reduce((acc, p) => acc + safeArray(p.children).length, 0);
//     const teams = safeArray(data?.teams).filter((t) => !!t.team_id).length;

//     let attention = 0;
//     for (const t of safeArray(data?.teams)) {
//       for (const o of safeArray(t.objectives)) {
//         const tl = o.timeline;
//         const needs = (tl?.is_expired ?? false) || (tl?.needs_extension_prompt ?? false) || clamp01(o.progress) < 20;
//         if (needs) attention += 1;
//       }
//     }
//     return { parents, children, teams, attention };
//   }, [companyLevelOptions.length, companyLevelProgress, data?.teams]);

//   const load = async () => {
//     setIsLoading(true);
//     try {
//       const res = await apiFetch<CurrentOKRsResponse>("/okrs/company/current");

//       const normalized: CurrentOKRsResponse = {
//         quarter: res.quarter,
//         teams: safeArray(res.teams).map((t) => ({
//           ...t,
//           objectives: safeArray(t.objectives).map((o: any) => ({
//             ...o,
//             parent_id: o?.parent_id ?? o?.parent_company_level_objective_id ?? null,
//             parent_weight: o?.parent_weight ?? 0,
//             key_results: safeArray(o.key_results).map((kr: any) => ({
//               ...kr,
//               progress: kr?.progress ?? 0,
//               weight: kr?.weight ?? 1,
//             })),
//           })),
//         })),
//       };

//       setData(normalized);

//       // ✅ load comments cache for CEO
//       await loadAllKrUpdates();

//       try {
//         const cw = await apiFetch<CurrentWeekResponse>("/weeks/current");
//         const lvl = await apiFetch<CompanyLevelOKRsResponse>(
//           `/okrs/company/level-progress?week_id=${encodeURIComponent(cw.week_id)}`
//         );
//         setCompanyLevelProgress(safeArray(lvl.items));
//       } catch (e) {
//         console.warn("Failed to load company-level progress", e);
//         setCompanyLevelProgress([]);
//       }

//       setOpenTeams((prev) => {
//         const next: Record<string, boolean> = { ...prev };
//         for (const t of normalized.teams) {
//           const k = t.team_id ?? "unassigned";
//           if (typeof next[k] !== "boolean") next[k] = true;
//         }
//         return next;
//       });

//       setOpenObjectiveById((prev) => {
//         const next = { ...prev };
//         for (const t of normalized.teams) {
//           for (const o of safeArray(t.objectives)) {
//             if (typeof next[o.id] !== "boolean") next[o.id] = true;
//           }
//         }
//         return next;
//       });

//       setTlDraftByObj((prev) => {
//         const next = { ...prev };
//         for (const team of normalized.teams) {
//           for (const obj of safeArray(team.objectives)) {
//             if (!next[obj.id]) {
//               next[obj.id] = {
//                 start: toDateInputValue(obj.timeline?.timeline_start),
//                 end: toDateInputValue(obj.timeline?.timeline_end),
//               };
//             }
//           }
//         }
//         return next;
//       });

//       setKrWeightByObjective((prev) => {
//         const next = { ...prev };
//         for (const team of normalized.teams) {
//           for (const obj of safeArray(team.objectives)) {
//             if (typeof next[obj.id] !== "number") next[obj.id] = 1;
//           }
//         }
//         return next;
//       });

//       setParentWeightDraftByObj((prev) => {
//         const next = { ...prev };
//         for (const team of normalized.teams) {
//           for (const obj of safeArray(team.objectives)) {
//             const serverW = Number(obj.parent_weight ?? 0);
//             if (typeof next[obj.id] !== "number") next[obj.id] = serverW;
//           }
//         }
//         return next;
//       });

//       setKrWeightDraftById((prev) => {
//         const next = { ...prev };
//         for (const team of normalized.teams) {
//           for (const obj of safeArray(team.objectives)) {
//             for (const kr of safeArray(obj.key_results)) {
//               const serverW = Number(kr.weight ?? 1);
//               if (typeof next[kr.id] !== "number") next[kr.id] = serverW;
//             }
//           }
//         }
//         return next;
//       });
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load OKRs");
//       setData(null);
//       setCompanyLevelProgress([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const loadTeams = async () => {
//     try {
//       const res = await apiFetch<TeamsResponse>("/okrs/teams");
//       setTeamsOptions(safeArray(res.items));
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load teams");
//       setTeamsOptions([]);
//     }
//   };

//   const loadCompanyLevel = async () => {
//     try {
//       const res = await apiFetch<CompanyLevelObjectivesResponse>("/okrs/company/level-objectives");
//       setCompanyLevelOptions(safeArray(res.items));
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to load company-level OKRs");
//       setCompanyLevelOptions([]);
//     }
//   };

//   useEffect(() => {
//     load();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   useEffect(() => {
//     if (isCEO) {
//       loadTeams();
//       loadCompanyLevel();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isCEO]);

//   useEffect(() => {
//     const t = setInterval(() => {
//       setData((prev) => {
//         if (!prev) return prev;
//         return {
//           ...prev,
//           quarter: {
//             ...prev.quarter,
//             seconds_remaining: Math.max(0, (prev.quarter.seconds_remaining ?? 0) - 60),
//           },
//         };
//       });
//     }, 60_000);
//     return () => clearInterval(t);
//   }, []);

//   const addObjective = async () => {
//     if (!isCEO) return;

//     const title = newObjectiveTitle.trim();
//     if (!title) return toast.error("Objective title is required");

//     // Parent
//     if (isCompanyMode) {
//       setIsSaving(true);
//       try {
//         await apiFetch("/okrs/company/level-objectives", {
//           method: "POST",
//           body: JSON.stringify({ title }),
//         });
//         setNewObjectiveTitle("");
//         toast.success("Company-level objective added");
//         await loadCompanyLevel();
//         await load();
//       } catch (e) {
//         console.error(e);
//         toast.error("Failed to add company-level objective");
//       } finally {
//         setIsSaving(false);
//       }
//       return;
//     }

//     // Child
//     if (!selectedParentId) return toast.error("Parent company-level OKR is required");

//     const w = Number(parentWeight);
//     if (!Number.isFinite(w) || w < 1 || w > 100) return toast.error("Parent weight must be between 1 and 100");

//     setIsSaving(true);
//     try {
//       await apiFetch("/okrs/company/objectives", {
//         method: "POST",
//         body: JSON.stringify({
//           title,
//           team_id: selectedTeamId,
//           parent_id: selectedParentId,
//           parent_weight: w,
//         }),
//       });

//       setNewObjectiveTitle("");
//       setSelectedTeamId(COMPANY_SENTINEL);
//       setSelectedParentId("");
//       setParentWeight(10);

//       toast.success("Team objective added");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to add team objective");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const addKeyResult = async (objectiveId: string) => {
//     if (!isCEO) return;

//     const title = (krDraftByObjective[objectiveId] || "").trim();
//     const weight = Number(krWeightByObjective[objectiveId] ?? 1);

//     if (!title) return toast.error("Key Result title is required");
//     if (!Number.isFinite(weight) || weight < 1 || weight > 100) return toast.error("Weight must be between 1 and 100");

//     setIsSaving(true);
//     try {
//       await apiFetch("/okrs/company/key-results", {
//         method: "POST",
//         body: JSON.stringify({ objective_id: objectiveId, title, weight }),
//       });

//       setKrDraftByObjective((prev) => ({ ...prev, [objectiveId]: "" }));
//       setKrWeightByObjective((prev) => ({ ...prev, [objectiveId]: 1 }));

//       toast.success("Key Result added");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to add key result");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const saveObjectiveTimeline = async (objectiveId: string) => {
//     if (!isCEO) return;

//     const draft = tlDraftByObj[objectiveId];
//     const start = (draft?.start || "").trim();
//     const end = (draft?.end || "").trim();

//     if (!start || !end) return toast.error("Timeline start and end are required");
//     if (end < start) return toast.error("timeline_end must be >= timeline_start");

//     setIsSavingTimelineByObj((p) => ({ ...p, [objectiveId]: true }));
//     try {
//       await apiFetch(`/okrs/company/objectives/${objectiveId}/timeline`, {
//         method: "PATCH",
//         body: JSON.stringify({ timeline_start: start, timeline_end: end }),
//       });
//       toast.success("Timeline updated");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to update timeline");
//     } finally {
//       setIsSavingTimelineByObj((p) => ({ ...p, [objectiveId]: false }));
//     }
//   };

//   const saveObjectiveParentWeight = async (objectiveId: string, weight: number) => {
//     if (!isCEO) return;

//     const w = Number(weight);
//     if (!Number.isFinite(w) || w < 1 || w > 100) return toast.error("Parent weight must be between 1 and 100");

//     setIsSavingParentWeightByObj((p) => ({ ...p, [objectiveId]: true }));
//     try {
//       await apiFetch("/okrs/company/objectives/parent-weight", {
//         method: "PATCH",
//         body: JSON.stringify({ objective_id: objectiveId, parent_weight: w }),
//       });
//       toast.success("Parent weight updated");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to update parent weight");
//     } finally {
//       setIsSavingParentWeightByObj((p) => ({ ...p, [objectiveId]: false }));
//     }
//   };

//   const saveKRWeight = async (krId: string, weight: number) => {
//     if (!isCEO) return;

//     const w = Number(weight);
//     if (!Number.isFinite(w) || w < 1 || w > 100) return toast.error("KR weight must be between 1 and 100");

//     setIsSavingKrWeightById((p) => ({ ...p, [krId]: true }));
//     try {
//       await apiFetch("/okrs/company/key-results/weight", {
//         method: "PATCH",
//         body: JSON.stringify({ id: krId, weight: w }),
//       });
//       toast.success("KR weight updated");
//       await load();
//     } catch (e) {
//       console.error(e);
//       toast.error("Failed to update KR weight");
//     } finally {
//       setIsSavingKrWeightById((p) => ({ ...p, [krId]: false }));
//     }
//   };

//   if (!isCEO) {
//     return (
//       <div className="p-6">
//         <EmptyState title="Access Denied" description="This page is available for CEO only." />
//       </div>
//     );
//   }

//   if (isLoading) return <LoadingState message="Loading OKR progress..." />;

//   if (!data) {
//     return (
//       <div className="p-6">
//         <EmptyState title="No data" description="Unable to load OKRs." actionLabel="Retry" onAction={load} />
//       </div>
//     );
//   }

//   const teams = safeArray(data.teams);
//   const hasParents = companyLevelOptions.length > 0;

//   return (
//     <div className="p-6 space-y-6 relative">
//       {/* Background accents */}
//       <div className="pointer-events-none fixed inset-0 -z-10">
//         <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
//         <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
//       </div>

//       {/* Header */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="space-y-1">
//           <div className="flex items-center gap-2">
//             <h1 className="text-2xl font-bold">Company OKRs</h1>
//             <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
//               {data.quarter.quarter_id}
//             </span>
//           </div>

//           <p className="text-muted-foreground">
//             {data.quarter.start_date} → {data.quarter.end_date} • Time left:{" "}
//             <span className="font-medium">{remaining}</span>
//           </p>

//           <div className="mt-2 flex flex-wrap gap-2">
//             <Pill>
//               Parents: <span className="ml-1 font-medium text-foreground">{summary.parents}</span>
//             </Pill>
//             <Pill>
//               Children: <span className="ml-1 font-medium text-foreground">{summary.children}</span>
//             </Pill>
//             <Pill>
//               Teams: <span className="ml-1 font-medium text-foreground">{summary.teams}</span>
//             </Pill>
//             {summary.attention > 0 ? (
//               <Pill tone="amber">
//                 Needs attention: <span className="ml-1 font-medium text-foreground">{summary.attention}</span>
//               </Pill>
//             ) : (
//               <Pill tone="emerald">Healthy</Pill>
//             )}
//           </div>
//         </div>

//         <div className="flex flex-col gap-2 sm:items-end">
//           <div className="flex gap-2">
//             <Button variant="outline" onClick={load} disabled={isSaving}>
//               <RefreshCw className="h-4 w-4 mr-2" />
//               Refresh
//             </Button>

//             <Button variant={onlyAttention ? "default" : "outline"} onClick={() => setOnlyAttention((p) => !p)}>
//               Attention
//             </Button>
//           </div>

//           <div className={`w-full sm:w-[360px] rounded-xl ${GLASS} p-2`}>
//             <Input
//               className="h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
//               placeholder="Search objectives or KRs..."
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Add Objective */}
//       <Card className={`${GLASS} overflow-hidden`}>
//         <CardHeader>
//           <CardTitle>Add new Objective</CardTitle>
//           <CardDescription>
//             Create Company-level OKRs (parents) or Team OKRs (children). Team objectives contribute to a parent via weight.
//           </CardDescription>
//         </CardHeader>

//         <CardContent className="grid gap-3 sm:grid-cols-6">
//           <div className="sm:col-span-3">
//             <Input
//               value={newObjectiveTitle}
//               onChange={(e) => setNewObjectiveTitle(e.target.value)}
//               placeholder="Objective title..."
//             />
//           </div>

//           <div className="sm:col-span-3">
//             <Select
//               value={selectedTeamId}
//               onValueChange={(v) => {
//                 setSelectedTeamId(v);

//                 // if switching to team-mode, auto-pick first parent
//                 if (v !== COMPANY_SENTINEL) {
//                   setSelectedParentId((prev) => prev || (companyLevelOptions[0]?.id ?? ""));
//                 } else {
//                   setSelectedParentId("");
//                 }
//               }}
//             >
//               <SelectTrigger className="h-10">
//                 <SelectValue placeholder="Select mode / team..." />
//               </SelectTrigger>

//               <SelectContent className="border-border/60 bg-popover/90 text-popover-foreground backdrop-blur-xl">
//                 <SelectItem value={COMPANY_SENTINEL}>Company-level (Parent OKR)</SelectItem>
//                 {teamsOptions.map((t) => (
//                   <SelectItem key={t.id} value={t.id}>
//                     {t.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           {/* Parent + weight (team mode only) */}
//           {!isCompanyMode ? (
//             <>
//               {!hasParents ? (
//                 <div className="sm:col-span-6 text-sm text-amber-600">
//                   You must create at least one Company-level OKR first.
//                 </div>
//               ) : (
//                 <>
//                   <div className="sm:col-span-4">
//                     <Select value={selectedParentId} onValueChange={setSelectedParentId}>
//                       <SelectTrigger className="h-10">
//                         <SelectValue placeholder="Select parent company-level OKR..." />
//                       </SelectTrigger>

//                       <SelectContent className="border-border/60 bg-popover/90 text-popover-foreground backdrop-blur-xl">
//                         {companyLevelOptions.map((p) => (
//                           <SelectItem key={p.id} value={p.id}>
//                             {p.title}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>

//                     <div className="mt-1 text-xs text-muted-foreground">
//                       This team objective will be linked as a child of the selected company-level OKR.
//                     </div>
//                   </div>

//                   <div className="sm:col-span-2">
//                     <Input
//                       type="number"
//                       min={1}
//                       max={100}
//                       value={parentWeight}
//                       onChange={(e) => setParentWeight(Number(e.target.value || 1))}
//                       placeholder="Parent weight (1-100)"
//                     />
//                     <div className="mt-1 text-xs text-muted-foreground">
//                       Weight of this team objective under the parent (children total ≤ 100).
//                     </div>
//                   </div>
//                 </>
//               )}
//             </>
//           ) : (
//             <div className="sm:col-span-6 text-xs text-muted-foreground">
//               Creating a company-level OKR (parent). Teams’ OKRs will be linked to this later.
//             </div>
//           )}

//           <div className="sm:col-span-6">
//             <Button onClick={addObjective} disabled={isSaving || (!isCompanyMode && !hasParents)}>
//               <Plus className="h-4 w-4 mr-2" />
//               {isCompanyMode ? "Add Company-level Objective" : "Add Team Objective"}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* OKR list */}
//       {teams.length === 0 ? (
//         <EmptyState title="No OKRs yet" description="Add objectives and key results for this quarter." />
//       ) : (
//         <div className="space-y-6">
//           {teams.map((team) => {
//             const key = team.team_id ?? "unassigned";
//             const isOpen = openTeams[key] ?? true;
//             const isUnassigned = !team.team_id;

//             const objectiveList: Objective[] = isUnassigned
//               ? companyLevelOptions.map((p) => {
//                   const parentProgress = parentProgressById[p.id] ?? 0;
//                   const children = safeArray(childrenByParentId[p.id]).sort((a, b) => clamp01(b.progress) - clamp01(a.progress));

//                   return {
//                     id: p.id,
//                     title: p.title,
//                     progress: parentProgress,
//                     parent_id: null,
//                     parent_weight: null,
//                     timeline: undefined,
//                     // NOTE: these are "child objectives", not true KRs => we won't show comments here
//                     key_results: children.map((c) => ({
//                       id: c.id,
//                       title: `${c.title}: ${c.team_name ?? "Unassigned"}`,
//                       status: krStatusFromProgress(c.progress),
//                       progress: clamp01(c.progress),
//                       weight: Number(c.parent_weight ?? 0) || 1,
//                     })),
//                   };
//                 })
//               : safeArray(team.objectives);

//             const q = query.trim().toLowerCase();
//             const filteredObjectives = q
//               ? objectiveList.filter((o) => {
//                   const inObj = o.title.toLowerCase().includes(q);
//                   const inKrs = safeArray(o.key_results).some((k) => k.title.toLowerCase().includes(q));
//                   return inObj || inKrs;
//                 })
//               : objectiveList;

//             const filteredObjectives2 = onlyAttention
//               ? filteredObjectives.filter((o) => {
//                   const tl = o.timeline;
//                   const needs =
//                     (tl?.is_expired ?? false) ||
//                     (tl?.needs_extension_prompt ?? false) ||
//                     clamp01(o.progress) < 20 ||
//                     safeArray(o.key_results).length === 0;
//                   return needs;
//                 })
//               : filteredObjectives;

//             return (
//               <Card key={key} className={`${GLASS} overflow-hidden`}>
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <div className="space-y-1">
//                     <CardTitle className="text-lg">
//                       {isUnassigned ? "Company-level OKRs (Parents)" : team.team_name}
//                     </CardTitle>
//                     <CardDescription>
//                       {isUnassigned
//                         ? "Company-level (parent) OKRs. Each child row shows assigned team + progress."
//                         : "Progress is updated by the assigned team."}
//                     </CardDescription>
//                   </div>

//                   <div className="flex items-center gap-2">
//                     {!isUnassigned ? (
//                       <Pill>
//                         Objectives:{" "}
//                         <span className="ml-1 font-medium text-foreground">{safeArray(team.objectives).length}</span>
//                       </Pill>
//                     ) : null}

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       onClick={() => setOpenTeams((p) => ({ ...p, [key]: !isOpen }))}
//                       className="h-8 w-8"
//                     >
//                       {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
//                     </Button>
//                   </div>
//                 </CardHeader>

//                 {isOpen && (
//                   <CardContent className="space-y-6">
//                     {filteredObjectives2.length === 0 ? (
//                       <EmptyState
//                         title={isUnassigned ? "No company-level objectives" : "No objectives match filters"}
//                         description={isUnassigned ? "Add a company-level (parent) objective above." : "Try clearing search/attention."}
//                       />
//                     ) : (
//                       filteredObjectives2.map((obj) => {
//                         const tl = obj.timeline;
//                         const draft = tlDraftByObj[obj.id] || { start: "", end: "" };
//                         const isSavingTl = !!isSavingTimelineByObj[obj.id];

//                         const serverStart = toDateInputValue(tl?.timeline_start);
//                         const serverEnd = toDateInputValue(tl?.timeline_end);
//                         const isTlDirty = draft.start !== (serverStart || "") || draft.end !== (serverEnd || "");

//                         const serverParentWeight = Number(obj.parent_weight ?? 0);
//                         const draftParentWeight = Number(parentWeightDraftByObj[obj.id] ?? serverParentWeight);
//                         const isChild = !!obj.parent_id;
//                         const isSavingPW = !!isSavingParentWeightByObj[obj.id];
//                         const isParentWeightDirty = isChild && draftParentWeight !== serverParentWeight;

//                         const parentTitle = obj.parent_id ? parentTitleById[obj.parent_id] : "";
//                         const isObjOpen = openObjectiveById[obj.id] ?? true;

//                         const objectiveNeedsAttention =
//                           (!isUnassigned && ((tl?.is_expired ?? false) || (tl?.needs_extension_prompt ?? false))) ||
//                           clamp01(obj.progress) < 20;

//                         return (
//                           <div key={obj.id} className={`rounded-2xl ${GLASS} p-4`}>
//                             <button
//                               type="button"
//                               onClick={() => setOpenObjectiveById((p) => ({ ...p, [obj.id]: !isObjOpen }))}
//                               className="w-full text-left"
//                             >
//                               <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
//                                 <div className="space-y-1 min-w-0">
//                                   <div className="flex items-center gap-2">
//                                     <div className="font-semibold truncate">{obj.title}</div>
//                                     {objectiveNeedsAttention ? <Pill tone="amber">Attention</Pill> : <Pill tone="emerald">OK</Pill>}
//                                   </div>

//                                   {!isUnassigned && isChild ? (
//                                     <div className="text-xs text-muted-foreground">
//                                       Parent:{" "}
//                                       <span className="font-medium text-foreground">{parentTitle || obj.parent_id}</span>
//                                     </div>
//                                   ) : (
//                                     <div className="text-xs text-muted-foreground">
//                                       {isUnassigned ? "Company-level Objective (Parent)" : "Team Objective"}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="shrink-0 text-right">
//                                   <Pill>
//                                     Progress:{" "}
//                                     <span className="ml-1 font-medium text-foreground">{Math.round(clamp01(obj.progress))}%</span>
//                                   </Pill>
//                                   <div className="mt-2 w-48 max-w-full">
//                                     <ProgressBar value={obj.progress ?? 0} />
//                                   </div>
//                                 </div>
//                               </div>
//                             </button>

//                             {isObjOpen && (
//                               <div className="mt-4 space-y-4">
//                                 {!isUnassigned && isChild && (
//                                   <div className={`rounded-xl ${GLASS_SUB} p-3`}>
//                                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                                       <div className="text-sm font-medium">Objective weight under parent</div>

//                                       <div className="flex items-center gap-2">
//                                         <Input
//                                           className="h-8 w-24"
//                                           type="number"
//                                           min={1}
//                                           max={100}
//                                           value={draftParentWeight}
//                                           onChange={(e) =>
//                                             setParentWeightDraftByObj((p) => ({
//                                               ...p,
//                                               [obj.id]: Number(e.target.value || 1),
//                                             }))
//                                           }
//                                         />

//                                         <Button
//                                           size="sm"
//                                           variant="outline"
//                                           disabled={!isParentWeightDirty || isSavingPW || isSaving}
//                                           onClick={() => saveObjectiveParentWeight(obj.id, draftParentWeight)}
//                                         >
//                                           <Save className="h-4 w-4 mr-2" />
//                                           Save
//                                         </Button>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 )}

//                                 {!isUnassigned && (
//                                   <div className={`rounded-xl ${GLASS_SUB} p-3 space-y-2`}>
//                                     <div className="flex flex-wrap items-center justify-between gap-2">
//                                       <div className="text-sm font-medium">Objective Timeline</div>

//                                       {tl ? (
//                                         <div className="flex flex-wrap gap-2">
//                                           <Pill tone={tl.is_expired ? "amber" : "emerald"}>
//                                             {tl.is_expired ? "Expired" : "Active"}
//                                           </Pill>
//                                           {tl.needs_extension_prompt ? <Pill tone="amber">Extension recommended</Pill> : null}
//                                           <Pill>
//                                             Days left:{" "}
//                                             <span className="ml-1 font-medium text-foreground">{tl.days_remaining}</span>
//                                           </Pill>
//                                         </div>
//                                       ) : (
//                                         <Pill>Timeline not available</Pill>
//                                       )}
//                                     </div>

//                                     <div className="grid gap-3 sm:grid-cols-3">
//                                       <div className="space-y-1">
//                                         <div className="text-xs text-muted-foreground">Start</div>
//                                         <Input
//                                           type="date"
//                                           value={draft.start}
//                                           onChange={(e) =>
//                                             setTlDraftByObj((p) => ({
//                                               ...p,
//                                               [obj.id]: { ...draft, start: e.target.value },
//                                             }))
//                                           }
//                                         />
//                                       </div>

//                                       <div className="space-y-1">
//                                         <div className="text-xs text-muted-foreground">End</div>
//                                         <Input
//                                           type="date"
//                                           value={draft.end}
//                                           onChange={(e) =>
//                                             setTlDraftByObj((p) => ({
//                                               ...p,
//                                               [obj.id]: { ...draft, end: e.target.value },
//                                             }))
//                                           }
//                                         />
//                                       </div>

//                                       <div className="flex items-end">
//                                         <Button onClick={() => saveObjectiveTimeline(obj.id)} disabled={!isTlDirty || isSavingTl || isSaving}>
//                                           <Save className="h-4 w-4 mr-2" />
//                                           Save
//                                         </Button>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 )}

//                                 <div className="space-y-2">
//                                   <div className="flex items-center justify-between">
//                                     <div className="text-sm font-medium">
//                                       {isUnassigned ? "Assigned Team Objectives (Children)" : "Key Results"}
//                                     </div>
//                                     <div className="text-xs text-muted-foreground">{safeArray(obj.key_results).length} items</div>
//                                   </div>

//                                   {safeArray(obj.key_results).length === 0 ? (
//                                     <div className={`rounded-xl ${GLASS_SUB} p-3 text-sm text-muted-foreground`}>
//                                       {isUnassigned ? "No child objectives linked yet." : "No key results yet."}
//                                     </div>
//                                   ) : (
//                                     <ul className="space-y-2">
//                                       {safeArray(obj.key_results).map((kr) => {
//                                         const s = statusLabel(kr.status);

//                                         const serverKRWeight = Number(kr.weight ?? 1);
//                                         const draftKRWeight = Number(krWeightDraftById[kr.id] ?? serverKRWeight);
//                                         const isSavingKrW = !!isSavingKrWeightById[kr.id];
//                                         const isKrWeightDirty = draftKRWeight !== serverKRWeight;

//                                         // ✅ comments for this KR (newest-first already)
//                                         const comments = krUpdatesByKrId[kr.id] ?? [];
//                                         const commentsCount = comments.length;
//                                         const latest = comments[0];

//                                         return (
//                                           <li key={kr.id} className={`rounded-xl ${GLASS_SUB} p-3`}>
//                                             <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                                               <div className="min-w-0">
//                                                 <div className="text-sm font-medium truncate">{kr.title}</div>
//                                                 <div className={`text-xs ${s.cls} mt-1`}>
//                                                   {s.text} • {Math.round(clamp01(kr.progress))}%
//                                                 </div>
//                                                 <div className="mt-2 w-56 max-w-full">
//                                                   <ProgressBar value={kr.progress} />
//                                                 </div>

//                                                 {/* ✅ Comments button (only for real KRs; hide in "unassigned" parent view) */}
//                                                 {!isUnassigned && (
//                                                   <div className="mt-3 flex items-center gap-2">
//                                                     <Button
//                                                       size="sm"
//                                                       variant="outline"
//                                                       onClick={() => setActiveKr({ id: kr.id, title: kr.title })}
//                                                     >
//                                                       <MessageSquare className="h-4 w-4 mr-2" />
//                                                       Comments {commentsCount > 0 ? `(${commentsCount})` : ""}
//                                                     </Button>

//                                                     {isLoadingKrUpdates ? (
//                                                       <span className="text-xs text-muted-foreground flex items-center gap-2">
//                                                         <Loader2 className="h-3 w-3 animate-spin" />
//                                                         loading…
//                                                       </span>
//                                                     ) : commentsCount > 0 ? (
//                                                       <span className="text-xs text-muted-foreground truncate max-w-[360px]">
//                                                         Latest: {latest?.note}
//                                                       </span>
//                                                     ) : (
//                                                       <span className="text-xs text-muted-foreground">No comments yet</span>
//                                                     )}
//                                                   </div>
//                                                 )}
//                                               </div>

//                                               {isUnassigned ? (
//                                                 <div className="text-xs text-muted-foreground">
//                                                   Weight: <span className="font-medium text-foreground">{serverKRWeight}</span>
//                                                 </div>
//                                               ) : (
//                                                 <div className="flex flex-col sm:items-end gap-2">
//                                                   <div className="flex items-center gap-2">
//                                                     <div className="text-xs text-muted-foreground">Weight:</div>

//                                                     <Input
//                                                       className="h-8 w-24"
//                                                       type="number"
//                                                       min={1}
//                                                       max={100}
//                                                       value={draftKRWeight}
//                                                       onChange={(e) =>
//                                                         setKrWeightDraftById((p) => ({
//                                                           ...p,
//                                                           [kr.id]: Number(e.target.value || 1),
//                                                         }))
//                                                       }
//                                                     />

//                                                     <Button
//                                                       size="sm"
//                                                       variant="outline"
//                                                       disabled={!isKrWeightDirty || isSavingKrW || isSaving}
//                                                       onClick={() => saveKRWeight(kr.id, draftKRWeight)}
//                                                     >
//                                                       <Save className="h-4 w-4 mr-2" />
//                                                       Save
//                                                     </Button>
//                                                   </div>

//                                                   <div className="text-xs text-muted-foreground">Progress updated by team</div>
//                                                 </div>
//                                               )}
//                                             </div>
//                                           </li>
//                                         );
//                                       })}
//                                     </ul>
//                                   )}
//                                 </div>

//                                 {!isUnassigned && (
//                                   <div className={`rounded-xl ${GLASS_SUB} p-3`}>
//                                     <div className="text-sm font-medium mb-2">Add Key Result</div>

//                                     <div className="grid gap-2 sm:grid-cols-7">
//                                       <div className="sm:col-span-4">
//                                         <Input
//                                           value={krDraftByObjective[obj.id] ?? ""}
//                                           onChange={(e) =>
//                                             setKrDraftByObjective((prev) => ({
//                                               ...prev,
//                                               [obj.id]: e.target.value,
//                                             }))
//                                           }
//                                           placeholder="Key result title..."
//                                         />
//                                       </div>

//                                       <div className="sm:col-span-2">
//                                         <Input
//                                           type="number"
//                                           min={1}
//                                           max={100}
//                                           value={krWeightByObjective[obj.id] ?? 1}
//                                           onChange={(e) =>
//                                             setKrWeightByObjective((prev) => ({
//                                               ...prev,
//                                               [obj.id]: Number(e.target.value || 1),
//                                             }))
//                                           }
//                                           placeholder="Weight (1-100)"
//                                         />
//                                       </div>

//                                       <div className="sm:col-span-1">
//                                         <Button className="w-full" onClick={() => addKeyResult(obj.id)} disabled={isSaving}>
//                                           <Plus className="h-4 w-4 mr-2" />
//                                           Add
//                                         </Button>
//                                       </div>
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         );
//                       })
//                     )}
//                   </CardContent>
//                 )}
//               </Card>
//             );
//           })}
//         </div>
//       )}

//       {/* ✅ KR Comments Dialog */}
//       <Dialog open={!!activeKr} onOpenChange={(v) => !v && setActiveKr(null)}>
//         <DialogContent className="max-w-2xl">
//           <DialogHeader>
//             <DialogTitle>KR Comments</DialogTitle>
//           </DialogHeader>

//           {!activeKr ? null : (
//             <div className="space-y-3">
//               <div className="text-sm font-medium">{activeKr.title}</div>

//               <div className="flex items-center justify-between">
//                 <div className="text-xs text-muted-foreground">
//                   Total: {(krUpdatesByKrId[activeKr.id]?.length ?? 0)}
//                 </div>

//                 <Button size="sm" variant="outline" onClick={loadAllKrUpdates} disabled={isLoadingKrUpdates}>
//                   <RefreshCw className="h-4 w-4 mr-2" />
//                   Refresh
//                 </Button>
//               </div>

//               <div className="max-h-[420px] overflow-auto space-y-2 pr-1">
//                 {(krUpdatesByKrId[activeKr.id] ?? []).length === 0 ? (
//                   <div className="text-sm text-muted-foreground">No comments yet.</div>
//                 ) : (
//                   (krUpdatesByKrId[activeKr.id] ?? []).map((u) => (
//                     <div key={u.id} className={`rounded-xl ${GLASS_SUB} p-3`}>
//                       <div className="flex items-center justify-between gap-3">
//                         <div className="text-xs text-muted-foreground">
//                           {u.week_label ?? u.week_id}
//                           {" • "}
//                           {u.author?.name ?? "Unknown"}
//                           {u.team?.name ? ` • ${u.team.name}` : ""}
//                         </div>
//                         <div className="text-xs text-muted-foreground">
//                           {new Date(u.created_at).toLocaleString()}
//                         </div>
//                       </div>

//                       <div className="mt-2 text-sm whitespace-pre-wrap">{u.note}</div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
// src/pages/ceo/CompanyOKRs.tsx
import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  RefreshCw,
  Save,
  MessageSquare,
  Loader2,
} from "lucide-react";

// --------------------
// Updates (CEO comments)
// --------------------
type KRUpdateItem = {
  id: string;
  kr_id: string;
  kr_title: string;
  objective_id: string;
  objective_title: string;
  team: { id: string; name: string } | null;
  week_id: string;
  week_label: string | null;
  note: string;
  meta: any;
  created_at: string;
  author: { id: string; name: string; email: string } | null;
};

type CompanyKRUpdatesResponse = { items: KRUpdateItem[]; count: number };

// --------------------
// Types
// --------------------
type KRStatus = "not_started" | "in_progress" | "completed";

type KR = {
  id: string;
  title: string;
  status: KRStatus;
  progress: number;
  weight: number;
};

type ObjectiveTimeline = {
  timeline_start: string;
  timeline_end: string;
  is_expired: boolean;
  days_remaining: number;
  needs_extension_prompt: boolean;
};

type Objective = {
  id: string;
  title: string;
  progress: number;
  parent_id?: string | null;
  parent_weight?: number | null;
  key_results: KR[];
  timeline?: ObjectiveTimeline;
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

type CompanyLevelObjectiveOption = { id: string; title: string };
type CompanyLevelObjectivesResponse = {
  items: CompanyLevelObjectiveOption[];
  count: number;
};

type CurrentWeekResponse = {
  week_id: string;
  start_date: string;
  end_date: string;
  display_label: string;
};

type CompanyOKRChild = {
  id: string;
  title: string;
  team_name: string | null;
  progress: number;
  parent_weight?: number;
};

type CompanyLevelOKR = {
  id: string;
  title: string;
  progress: number;
  children: CompanyOKRChild[];
};

type CompanyLevelOKRsResponse = {
  items: CompanyLevelOKR[];
  count: number;
};

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

function safeArray<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

function clamp01(x: number) {
  return Math.min(100, Math.max(0, Number(x || 0)));
}

function krStatusFromProgress(p: number): KRStatus {
  const v = clamp01(p);
  if (v >= 100) return "completed";
  if (v > 0) return "in_progress";
  return "not_started";
}

function statusLabel(s: KRStatus) {
  if (s === "completed")
    return { text: "Completed", cls: "text-emerald-600 dark:text-emerald-400" };
  if (s === "in_progress")
    return { text: "In Progress", cls: "text-amber-700 dark:text-amber-400" };
  return { text: "Not Started", cls: "text-muted-foreground" };
}

function toDateInputValue(iso?: string) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

// --------------------
// Design tokens
// --------------------
const GLASS =
  "border border-border/60 bg-card/60 backdrop-blur-xl " +
  "shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.35)] " +
  "ring-1 ring-primary/10";

const GLASS_SUB = "border border-border/60 bg-background/40 backdrop-blur";

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "emerald";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
      : tone === "amber"
      ? "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300"
      : "bg-muted/40 text-muted-foreground border-border/60";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneCls}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = clamp01(value);
  return (
    <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

// Radix Select cannot use empty string as item value
const COMPANY_SENTINEL = "__company__";

export default function CompanyOKRs() {
  const { user } = useAuth();
  const isCEO = user?.role === "ceo";

  // CEO comments cache (all KRs)
  const [krUpdatesByKrId, setKrUpdatesByKrId] = useState<
    Record<string, KRUpdateItem[]>
  >({});
  const [isLoadingKrUpdates, setIsLoadingKrUpdates] = useState(false);
  const [activeKr, setActiveKr] = useState<{ id: string; title: string } | null>(null);

  const [data, setData] = useState<CurrentOKRsResponse | null>(null);
  const [teamsOptions, setTeamsOptions] = useState<TeamOption[]>([]);
  const [companyLevelOptions, setCompanyLevelOptions] = useState<
    CompanyLevelObjectiveOption[]
  >([]);
  const [companyLevelProgress, setCompanyLevelProgress] = useState<
    CompanyLevelOKR[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openTeams, setOpenTeams] = useState<Record<string, boolean>>({});

  // Add objective
  const [newObjectiveTitle, setNewObjectiveTitle] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState(COMPANY_SENTINEL);
  const [selectedParentId, setSelectedParentId] = useState("");
  const [parentWeight, setParentWeight] = useState(10);

  // Add KR
  const [krDraftByObjective, setKrDraftByObjective] = useState<
    Record<string, string>
  >({});
  const [krWeightByObjective, setKrWeightByObjective] = useState<
    Record<string, number>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Timeline drafts
  const [tlDraftByObj, setTlDraftByObj] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [isSavingTimelineByObj, setIsSavingTimelineByObj] = useState<
    Record<string, boolean>
  >({});

  // Parent weight drafts
  const [parentWeightDraftByObj, setParentWeightDraftByObj] = useState<
    Record<string, number>
  >({});
  const [isSavingParentWeightByObj, setIsSavingParentWeightByObj] = useState<
    Record<string, boolean>
  >({});

  // KR weight drafts
  const [krWeightDraftById, setKrWeightDraftById] = useState<
    Record<string, number>
  >({});
  const [isSavingKrWeightById, setIsSavingKrWeightById] = useState<
    Record<string, boolean>
  >({});

  // UX controls
  const [query, setQuery] = useState("");
  const [onlyAttention, setOnlyAttention] = useState(false);
  const [openObjectiveById, setOpenObjectiveById] = useState<
    Record<string, boolean>
  >({});

  const isCompanyMode = selectedTeamId === COMPANY_SENTINEL;

  const loadAllKrUpdates = async () => {
    setIsLoadingKrUpdates(true);
    try {
      const res: any = await apiFetch("/okrs/company/key-results/updates?limit=500");
      const rawItems = safeArray(res?.items ?? res?.data?.items);
      const items: KRUpdateItem[] = rawItems
        .map((it: any) => ({
          ...it,
          id: String(it?.id ?? ""),
          kr_id: String(
            it?.kr_id ?? it?.key_result_id ?? it?.keyResultId ?? ""
          ).trim(),
          note: String(it?.note ?? it?.comment ?? it?.message ?? ""),
          created_at: String(it?.created_at ?? it?.createdAt ?? ""),
        }))
        .filter((it: KRUpdateItem) => !!it.kr_id);

      items.sort((a, b) => {
        const ta = Date.parse(a.created_at || "");
        const tb = Date.parse(b.created_at || "");
        return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
      });

      const map: Record<string, KRUpdateItem[]> = {};
      for (const it of items) {
        const key = String(it.kr_id);
        (map[key] ||= []).push(it);
      }
      setKrUpdatesByKrId(map);
    } catch (e) {
      console.error("Failed to load KR comments:", e);
      setKrUpdatesByKrId({});
      toast.error("Failed to load KR comments");
    } finally {
      setIsLoadingKrUpdates(false);
    }
  };

  const parentTitleById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of companyLevelOptions) m[p.id] = p.title;
    return m;
  }, [companyLevelOptions]);

  const parentProgressById = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of companyLevelProgress) m[p.id] = clamp01(p.progress);
    return m;
  }, [companyLevelProgress]);

  const childrenByParentId = useMemo(() => {
    const m: Record<string, CompanyOKRChild[]> = {};
    for (const p of companyLevelProgress) m[p.id] = safeArray(p.children);
    return m;
  }, [companyLevelProgress]);

  const remaining = useMemo(
    () => formatDuration(data?.quarter.seconds_remaining ?? 0),
    [data?.quarter.seconds_remaining]
  );

  const summary = useMemo(() => {
    const parents = companyLevelOptions.length;
    const children = companyLevelProgress.reduce(
      (acc, p) => acc + safeArray(p.children).length,
      0
    );
    const teams = safeArray(data?.teams).filter((t) => !!t.team_id).length;
    let attention = 0;
    for (const t of safeArray(data?.teams)) {
      for (const o of safeArray(t.objectives)) {
        const tl = o.timeline;
        const needs =
          (tl?.is_expired ?? false) ||
          (tl?.needs_extension_prompt ?? false) ||
          clamp01(o.progress) < 20;
        if (needs) attention += 1;
      }
    }
    return { parents, children, teams, attention };
  }, [companyLevelOptions.length, companyLevelProgress, data?.teams]);

  // ✅ KEY FIX: Always inject a synthetic "unassigned" block when company-level
  // objectives exist, regardless of whether the backend returned a null-team block.
  const teams = useMemo(() => {
    const raw = safeArray(data?.teams);
    const hasUnassigned = raw.some((t) => !t.team_id);
    if (!hasUnassigned && companyLevelOptions.length > 0) {
      const syntheticBlock: TeamBlock = {
        team_id: null,
        team_name: "Company-level OKRs (Parents)",
        objectives: [],
      };
      return [syntheticBlock, ...raw];
    }
    return raw;
  }, [data?.teams, companyLevelOptions]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/okrs/company/current");
      const normalized: CurrentOKRsResponse = {
        quarter: res.quarter,
        teams: safeArray(res.teams).map((t) => ({
          ...t,
          objectives: safeArray(t.objectives).map((o: any) => ({
            ...o,
            parent_id: o?.parent_id ?? o?.parent_company_level_objective_id ?? null,
            parent_weight: o?.parent_weight ?? 0,
            key_results: safeArray(o.key_results).map((kr: any) => ({
              ...kr,
              id: String(
                kr?.id ?? kr?.kr_id ?? kr?.key_result_id ?? kr?.keyResultId ?? ""
              ).trim(),
              progress: kr?.progress ?? 0,
              weight: kr?.weight ?? 1,
            })),
          })),
        })),
      };
      setData(normalized);

      await loadAllKrUpdates();

      try {
        const cw = await apiFetch("/weeks/current");
        const lvl = await apiFetch(
          `/okrs/company/level-progress?week_id=${encodeURIComponent(cw.week_id)}`
        );
        setCompanyLevelProgress(safeArray(lvl.items));
      } catch (e) {
        console.warn("Failed to load company-level progress", e);
        setCompanyLevelProgress([]);
      }

      setOpenTeams((prev) => {
        const next: Record<string, boolean> = { ...prev };
        // always open the unassigned block
        if (typeof next["unassigned"] !== "boolean") next["unassigned"] = true;
        for (const t of normalized.teams) {
          const k = t.team_id ?? "unassigned";
          if (typeof next[k] !== "boolean") next[k] = true;
        }
        return next;
      });

      setOpenObjectiveById((prev) => {
        const next = { ...prev };
        for (const t of normalized.teams) {
          for (const o of safeArray(t.objectives)) {
            if (typeof next[o.id] !== "boolean") next[o.id] = true;
          }
        }
        return next;
      });

      setTlDraftByObj((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            if (!next[obj.id]) {
              next[obj.id] = {
                start: toDateInputValue(obj.timeline?.timeline_start),
                end: toDateInputValue(obj.timeline?.timeline_end),
              };
            }
          }
        }
        return next;
      });

      setKrWeightByObjective((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            if (typeof next[obj.id] !== "number") next[obj.id] = 1;
          }
        }
        return next;
      });

      setParentWeightDraftByObj((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            const serverW = Number(obj.parent_weight ?? 0);
            if (typeof next[obj.id] !== "number") next[obj.id] = serverW;
          }
        }
        return next;
      });

      setKrWeightDraftById((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            for (const kr of safeArray(obj.key_results)) {
              const serverW = Number(kr.weight ?? 1);
              if (typeof next[kr.id] !== "number") next[kr.id] = serverW;
            }
          }
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load OKRs");
      setData(null);
      setCompanyLevelProgress([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await apiFetch("/okrs/teams");
      setTeamsOptions(safeArray(res.items));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load teams");
      setTeamsOptions([]);
    }
  };

  const loadCompanyLevel = async () => {
    try {
      const res = await apiFetch("/okrs/company/level-objectives");
      setCompanyLevelOptions(safeArray(res.items));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load company-level OKRs");
      setCompanyLevelOptions([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isCEO) {
      loadTeams();
      loadCompanyLevel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCEO]);

  useEffect(() => {
    if (activeKr) {
      loadAllKrUpdates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKr?.id]);

  useEffect(() => {
    const t = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          quarter: {
            ...prev.quarter,
            seconds_remaining: Math.max(
              0,
              (prev.quarter.seconds_remaining ?? 0) - 60
            ),
          },
        };
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const addObjective = async () => {
    if (!isCEO) return;
    const title = newObjectiveTitle.trim();
    if (!title) return toast.error("Objective title is required");

    if (isCompanyMode) {
      setIsSaving(true);
      try {
        await apiFetch("/okrs/company/level-objectives", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        setNewObjectiveTitle("");
        toast.success("Company-level objective added");
        await loadCompanyLevel();
        await load();
      } catch (e) {
        console.error(e);
        toast.error("Failed to add company-level objective");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!selectedParentId) return toast.error("Parent company-level OKR is required");
    const w = Number(parentWeight);
    if (!Number.isFinite(w) || w < 1 || w > 100)
      return toast.error("Parent weight must be between 1 and 100");

    setIsSaving(true);
    try {
      await apiFetch("/okrs/company/objectives", {
        method: "POST",
        body: JSON.stringify({
          title,
          team_id: selectedTeamId,
          parent_id: selectedParentId,
          parent_weight: w,
        }),
      });
      setNewObjectiveTitle("");
      setSelectedTeamId(COMPANY_SENTINEL);
      setSelectedParentId("");
      setParentWeight(10);
      toast.success("Team objective added");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add team objective");
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyResult = async (objectiveId: string) => {
    if (!isCEO) return;
    const title = (krDraftByObjective[objectiveId] || "").trim();
    const weight = Number(krWeightByObjective[objectiveId] ?? 1);
    if (!title) return toast.error("Key Result title is required");
    if (!Number.isFinite(weight) || weight < 1 || weight > 100)
      return toast.error("Weight must be between 1 and 100");

    setIsSaving(true);
    try {
      await apiFetch("/okrs/company/key-results", {
        method: "POST",
        body: JSON.stringify({ objective_id: objectiveId, title, weight }),
      });
      setKrDraftByObjective((prev) => ({ ...prev, [objectiveId]: "" }));
      setKrWeightByObjective((prev) => ({ ...prev, [objectiveId]: 1 }));
      toast.success("Key Result added");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add key result");
    } finally {
      setIsSaving(false);
    }
  };

  const saveObjectiveTimeline = async (objectiveId: string) => {
    if (!isCEO) return;
    const draft = tlDraftByObj[objectiveId];
    const start = (draft?.start || "").trim();
    const end = (draft?.end || "").trim();
    if (!start || !end) return toast.error("Timeline start and end are required");
    if (end < start) return toast.error("timeline_end must be >= timeline_start");

    setIsSavingTimelineByObj((p) => ({ ...p, [objectiveId]: true }));
    try {
      await apiFetch(`/okrs/company/objectives/${objectiveId}/timeline`, {
        method: "PATCH",
        body: JSON.stringify({ timeline_start: start, timeline_end: end }),
      });
      toast.success("Timeline updated");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update timeline");
    } finally {
      setIsSavingTimelineByObj((p) => ({ ...p, [objectiveId]: false }));
    }
  };

  const saveObjectiveParentWeight = async (objectiveId: string, weight: number) => {
    if (!isCEO) return;
    const w = Number(weight);
    if (!Number.isFinite(w) || w < 1 || w > 100)
      return toast.error("Parent weight must be between 1 and 100");

    setIsSavingParentWeightByObj((p) => ({ ...p, [objectiveId]: true }));
    try {
      await apiFetch("/okrs/company/objectives/parent-weight", {
        method: "PATCH",
        body: JSON.stringify({ objective_id: objectiveId, parent_weight: w }),
      });
      toast.success("Parent weight updated");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update parent weight");
    } finally {
      setIsSavingParentWeightByObj((p) => ({ ...p, [objectiveId]: false }));
    }
  };

  const saveKRWeight = async (krId: string, weight: number) => {
    if (!isCEO) return;
    const w = Number(weight);
    if (!Number.isFinite(w) || w < 1 || w > 100)
      return toast.error("KR weight must be between 1 and 100");

    setIsSavingKrWeightById((p) => ({ ...p, [krId]: true }));
    try {
      await apiFetch("/okrs/company/key-results/weight", {
        method: "PATCH",
        body: JSON.stringify({ id: krId, weight: w }),
      });
      toast.success("KR weight updated");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update KR weight");
    } finally {
      setIsSavingKrWeightById((p) => ({ ...p, [krId]: false }));
    }
  };

  if (!isCEO) {
    return (
      <div className="flex h-64 items-center justify-center">
        <EmptyState title="Access denied" description="CEO only" />
      </div>
    );
  }

  if (isLoading) return <LoadingState />;

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <EmptyState title="No OKR data" description="Failed to load" />
      </div>
    );
  }

  const hasParents = companyLevelOptions.length > 0;

  return (
    <div className="relative min-h-screen space-y-6 p-4 md:p-6">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className={`rounded-2xl p-5 ${GLASS}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Company OKRs</h1>
              <Pill tone="neutral">{data.quarter.quarter_id}</Pill>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.quarter.start_date} → {data.quarter.end_date} • Time left:{" "}
              <span className="font-medium text-foreground">{remaining}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill>Parents: {summary.parents}</Pill>
              <Pill>Children: {summary.children}</Pill>
              <Pill>Teams: {summary.teams}</Pill>
              {summary.attention > 0 ? (
                <Pill tone="amber">Needs attention: {summary.attention}</Pill>
              ) : (
                <Pill tone="emerald">Healthy</Pill>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant={onlyAttention ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyAttention((p) => !p)}
            >
              Attention
            </Button>
          </div>
        </div>
        <div className="mt-3">
          <Input
            value={query}
            className="max-w-sm"
            placeholder="Search objectives or key results..."
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Add Objective */}
      <Card className={GLASS}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add new Objective</CardTitle>
          <CardDescription>
            Create Company-level OKRs (parents) or Team OKRs (children). Team objectives
            contribute to a parent via weight.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={newObjectiveTitle}
            onChange={(e) => setNewObjectiveTitle(e.target.value)}
            placeholder="Objective title..."
          />
          <div className="flex flex-wrap gap-2">
            <Select
              value={selectedTeamId}
              onValueChange={(v) => {
                setSelectedTeamId(v);
                if (v !== COMPANY_SENTINEL) {
                  setSelectedParentId((prev) => prev || (companyLevelOptions[0]?.id ?? ""));
                } else {
                  setSelectedParentId("");
                }
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Assign to…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={COMPANY_SENTINEL}>
                  Company-level (Parent OKR)
                </SelectItem>
                {teamsOptions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parent + weight (team mode only) */}
          {!isCompanyMode ? (
            <>
              {!hasParents ? (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  You must create at least one Company-level OKR first.
                </p>
              ) : (
                <>
                  <div>
                    <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select parent company-level OKR…" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyLevelOptions.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      This team objective will be linked as a child of the selected
                      company-level OKR.
                    </p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={parentWeight}
                      onChange={(e) => setParentWeight(Number(e.target.value || 1))}
                      placeholder="Parent weight (1-100)"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Weight of this team objective under the parent (children total ≤ 100).
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Creating a company-level OKR (parent). Teams' OKRs will be linked to this later.
            </p>
          )}

          <Button onClick={addObjective} disabled={isSaving} className="gap-1.5">
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {isCompanyMode ? "Add Company-level Objective" : "Add Team Objective"}
          </Button>
        </CardContent>
      </Card>

      {/* OKR list */}
      {teams.length === 0 ? (
        <EmptyState title="No OKRs yet" description="Add your first objective above." />
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const key = team.team_id ?? "unassigned";
            const isOpen = openTeams[key] ?? true;
            const isUnassigned = !team.team_id;

            const objectiveList: Objective[] = isUnassigned
              ? companyLevelOptions.map((p) => {
                  const parentProgress = parentProgressById[p.id] ?? 0;
                  const children = safeArray(childrenByParentId[p.id]).sort(
                    (a, b) => clamp01(b.progress) - clamp01(a.progress)
                  );
                  return {
                    id: p.id,
                    title: p.title,
                    progress: parentProgress,
                    parent_id: null,
                    parent_weight: null,
                    timeline: undefined,
                    key_results: children.map((c) => ({
                      id: c.id,
                      title: `${c.title}: ${c.team_name ?? "Unassigned"}`,
                      status: krStatusFromProgress(c.progress),
                      progress: clamp01(c.progress),
                      weight: Number(c.parent_weight ?? 0) || 1,
                    })),
                  };
                })
              : safeArray(team.objectives);

            const q = query.trim().toLowerCase();
            const filteredObjectives = q
              ? objectiveList.filter((o) => {
                  const inObj = o.title.toLowerCase().includes(q);
                  const inKrs = safeArray(o.key_results).some((k) =>
                    k.title.toLowerCase().includes(q)
                  );
                  return inObj || inKrs;
                })
              : objectiveList;

            const filteredObjectives2 = onlyAttention
              ? filteredObjectives.filter((o) => {
                  const tl = o.timeline;
                  const needs =
                    (tl?.is_expired ?? false) ||
                    (tl?.needs_extension_prompt ?? false) ||
                    clamp01(o.progress) < 20 ||
                    safeArray(o.key_results).length === 0;
                  return needs;
                })
              : filteredObjectives;

            return (
              <Card key={key} className={GLASS}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">
                        {isUnassigned
                          ? "Company-level OKRs (Parents)"
                          : team.team_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {isUnassigned
                          ? "Company-level (parent) OKRs. Each child row shows assigned team + progress."
                          : "Progress is updated by the assigned team."}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isUnassigned ? (
                        <Pill tone="neutral">
                          Objectives:{" "}
                          {safeArray(team.objectives).length}
                        </Pill>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setOpenTeams((p) => ({ ...p, [key]: !isOpen }))
                        }
                        className="h-8 w-8"
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0">
                    {filteredObjectives2.length === 0 ? (
                      <EmptyState
                        title={
                          isUnassigned
                            ? "No company-level objectives yet"
                            : "No objectives match"
                        }
                        description={
                          isUnassigned
                            ? "Add a Company-level OKR using the form above."
                            : "Try adjusting your filters."
                        }
                      />
                    ) : (
                      <div className="space-y-3">
                        {filteredObjectives2.map((obj) => {
                          const tl = obj.timeline;
                          const draft = tlDraftByObj[obj.id] || { start: "", end: "" };
                          const isSavingTl = !!isSavingTimelineByObj[obj.id];
                          const serverStart = toDateInputValue(tl?.timeline_start);
                          const serverEnd = toDateInputValue(tl?.timeline_end);
                          const isTlDirty =
                            draft.start !== (serverStart || "") ||
                            draft.end !== (serverEnd || "");
                          const serverParentWeight = Number(obj.parent_weight ?? 0);
                          const draftParentWeight = Number(
                            parentWeightDraftByObj[obj.id] ?? serverParentWeight
                          );
                          const isChild = !!obj.parent_id;
                          const isSavingPW = !!isSavingParentWeightByObj[obj.id];
                          const isParentWeightDirty =
                            isChild && draftParentWeight !== serverParentWeight;
                          const parentTitle = obj.parent_id
                            ? parentTitleById[obj.parent_id]
                            : "";
                          const isObjOpen = openObjectiveById[obj.id] ?? true;
                          const objectiveNeedsAttention =
                            (!isUnassigned &&
                              ((tl?.is_expired ?? false) ||
                                (tl?.needs_extension_prompt ?? false))) ||
                            clamp01(obj.progress) < 20;

                          return (
                            <div
                              key={obj.id}
                              className={`rounded-xl ${GLASS_SUB} overflow-hidden`}
                            >
                              {/* Objective header */}
                              <button
                                onClick={() =>
                                  setOpenObjectiveById((p) => ({
                                    ...p,
                                    [obj.id]: !isObjOpen,
                                  }))
                                }
                                className="w-full text-left p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-sm leading-tight">
                                        {obj.title}
                                      </span>
                                      {objectiveNeedsAttention ? (
                                        <Pill tone="amber">Attention</Pill>
                                      ) : (
                                        <Pill tone="emerald">OK</Pill>
                                      )}
                                    </div>
                                    {!isUnassigned && isChild ? (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        Parent:{" "}
                                        <span className="text-foreground/70">
                                          {parentTitle || obj.parent_id}
                                        </span>
                                      </p>
                                    ) : (
                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                        {isUnassigned
                                          ? "Company-level Objective (Parent)"
                                          : "Team Objective"}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1">
                                    <span className="text-xs font-medium text-muted-foreground">
                                      Progress:{" "}
                                      <span className="text-foreground">
                                        {Math.round(clamp01(obj.progress))}%
                                      </span>
                                    </span>
                                    <div className="w-24">
                                      <ProgressBar value={obj.progress} />
                                    </div>
                                  </div>
                                </div>
                              </button>

                              {/* Objective body */}
                              {isObjOpen && (
                                <div className="border-t border-border/40 px-4 pb-4 pt-3 space-y-4">
                                  {/* Parent weight */}
                                  {!isUnassigned && isChild && (
                                    <div className={`rounded-lg p-3 ${GLASS_SUB} space-y-2`}>
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Objective weight under parent
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          type="number"
                                          min={1}
                                          max={100}
                                          className="h-8 w-24 text-sm"
                                          value={draftParentWeight}
                                          onChange={(e) =>
                                            setParentWeightDraftByObj((p) => ({
                                              ...p,
                                              [obj.id]: Number(e.target.value || 1),
                                            }))
                                          }
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={!isParentWeightDirty || isSavingPW}
                                          onClick={() =>
                                            saveObjectiveParentWeight(
                                              obj.id,
                                              draftParentWeight
                                            )
                                          }
                                        >
                                          {isSavingPW ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Save className="h-3.5 w-3.5" />
                                          )}
                                          Save
                                        </Button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Timeline */}
                                  {!isUnassigned && (
                                    <div className={`rounded-lg p-3 ${GLASS_SUB} space-y-2`}>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                          Objective Timeline
                                        </p>
                                        {tl ? (
                                          <div className="flex flex-wrap gap-1.5">
                                            <Pill
                                              tone={tl.is_expired ? "amber" : "emerald"}
                                            >
                                              {tl.is_expired ? "Expired" : "Active"}
                                            </Pill>
                                            {tl.needs_extension_prompt ? (
                                              <Pill tone="amber">
                                                Extension recommended
                                              </Pill>
                                            ) : null}
                                            <Pill tone="neutral">
                                              Days left: {tl.days_remaining}
                                            </Pill>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            Timeline not set
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <div>
                                          <p className="mb-1 text-xs text-muted-foreground">
                                            Start
                                          </p>
                                          <Input
                                            type="date"
                                            className="h-8 text-sm"
                                            value={draft.start}
                                            onChange={(e) =>
                                              setTlDraftByObj((p) => ({
                                                ...p,
                                                [obj.id]: {
                                                  ...draft,
                                                  start: e.target.value,
                                                },
                                              }))
                                            }
                                          />
                                        </div>
                                        <div>
                                          <p className="mb-1 text-xs text-muted-foreground">
                                            End
                                          </p>
                                          <Input
                                            type="date"
                                            className="h-8 text-sm"
                                            value={draft.end}
                                            onChange={(e) =>
                                              setTlDraftByObj((p) => ({
                                                ...p,
                                                [obj.id]: {
                                                  ...draft,
                                                  end: e.target.value,
                                                },
                                              }))
                                            }
                                          />
                                        </div>
                                        <div className="flex items-end">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => saveObjectiveTimeline(obj.id)}
                                            disabled={!isTlDirty || isSavingTl || isSaving}
                                          >
                                            {isSavingTl ? (
                                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                              <Save className="h-3.5 w-3.5" />
                                            )}
                                            Save
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Key Results header */}
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      {isUnassigned
                                        ? "Assigned Team Objectives (Children)"
                                        : "Key Results"}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {safeArray(obj.key_results).length} items
                                    </span>
                                  </div>

                                  {/* Key Results list */}
                                  {safeArray(obj.key_results).length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-2">
                                      {isUnassigned
                                        ? "No child objectives linked yet."
                                        : "No key results yet."}
                                    </p>
                                  ) : (
                                    <div className="space-y-2">
                                      {safeArray(obj.key_results).map((kr) => {
                                        const s = statusLabel(kr.status);
                                        const serverKRWeight = Number(kr.weight ?? 1);
                                        const draftKRWeight = Number(
                                          krWeightDraftById[kr.id] ?? serverKRWeight
                                        );
                                        const isSavingKrW =
                                          !!isSavingKrWeightById[kr.id];
                                        const isKrWeightDirty =
                                          draftKRWeight !== serverKRWeight;
                                        const comments =
                                          krUpdatesByKrId[String(kr.id)] ?? [];
                                        const commentsCount = comments.length;
                                        const latest = comments[0];

                                        return (
                                          <div
                                            key={kr.id}
                                            className={`rounded-lg p-3 ${GLASS_SUB}`}
                                          >
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm font-medium leading-snug">
                                                    {kr.title}
                                                  </p>
                                                  <p
                                                    className={`text-xs ${s.cls} mt-0.5`}
                                                  >
                                                    {s.text} •{" "}
                                                    {Math.round(clamp01(kr.progress))}%
                                                  </p>
                                                </div>
                                                <div className="w-20 shrink-0 pt-1">
                                                  <ProgressBar value={kr.progress} />
                                                </div>
                                              </div>

                                              {/* Comments button (only for real KRs) */}
                                              {!isUnassigned && (
                                                <button
                                                  className="flex items-start gap-2 rounded-md border border-border/50 bg-background/50 px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
                                                  onClick={() =>
                                                    setActiveKr({
                                                      id: kr.id,
                                                      title: kr.title,
                                                    })
                                                  }
                                                >
                                                  <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                  <div className="min-w-0 flex-1">
                                                    <span className="text-xs font-medium text-muted-foreground">
                                                      Comments{" "}
                                                      {commentsCount > 0
                                                        ? `(${commentsCount})`
                                                        : ""}
                                                    </span>
                                                    {isLoadingKrUpdates ? (
                                                      <span className="ml-1 text-xs text-muted-foreground">
                                                        loading…
                                                      </span>
                                                    ) : commentsCount > 0 ? (
                                                      <p className="mt-0.5 truncate text-xs text-foreground/70">
                                                        Latest: {latest?.note}
                                                      </p>
                                                    ) : (
                                                      <p className="mt-0.5 text-xs text-muted-foreground">
                                                        No comments yet
                                                      </p>
                                                    )}
                                                  </div>
                                                </button>
                                              )}

                                              {/* KR weight */}
                                              {isUnassigned ? (
                                                <p className="text-xs text-muted-foreground">
                                                  Weight: {serverKRWeight}
                                                </p>
                                              ) : (
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <div className="flex items-center gap-1.5">
                                                    <span className="text-xs text-muted-foreground">
                                                      Weight:
                                                    </span>
                                                    <Input
                                                      type="number"
                                                      min={1}
                                                      max={100}
                                                      className="h-7 w-20 text-xs"
                                                      value={draftKRWeight}
                                                      onChange={(e) =>
                                                        setKrWeightDraftById((p) => ({
                                                          ...p,
                                                          [kr.id]: Number(
                                                            e.target.value || 1
                                                          ),
                                                        }))
                                                      }
                                                    />
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-7 px-2 text-xs"
                                                      disabled={
                                                        !isKrWeightDirty || isSavingKrW
                                                      }
                                                      onClick={() =>
                                                        saveKRWeight(kr.id, draftKRWeight)
                                                      }
                                                    >
                                                      {isSavingKrW ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                      ) : (
                                                        <Save className="h-3 w-3" />
                                                      )}
                                                      Save
                                                    </Button>
                                                  </div>
                                                  <span className="text-xs text-muted-foreground">
                                                    Progress updated by team
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}

                                  {/* Add KR */}
                                  {!isUnassigned && (
                                    <div
                                      className={`rounded-lg p-3 ${GLASS_SUB} space-y-2`}
                                    >
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Add Key Result
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        <Input
                                          className="h-8 flex-1 min-w-40 text-sm"
                                          value={krDraftByObjective[obj.id] || ""}
                                          onChange={(e) =>
                                            setKrDraftByObjective((prev) => ({
                                              ...prev,
                                              [obj.id]: e.target.value,
                                            }))
                                          }
                                          placeholder="Key result title..."
                                        />
                                        <Input
                                          type="number"
                                          min={1}
                                          max={100}
                                          className="h-8 w-28 text-sm"
                                          value={krWeightByObjective[obj.id] ?? 1}
                                          onChange={(e) =>
                                            setKrWeightByObjective((prev) => ({
                                              ...prev,
                                              [obj.id]: Number(e.target.value || 1),
                                            }))
                                          }
                                          placeholder="Weight"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => addKeyResult(obj.id)}
                                          disabled={isSaving}
                                          className="gap-1"
                                        >
                                          {isSaving ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Plus className="h-3.5 w-3.5" />
                                          )}
                                          Add
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* KR Comments Dialog */}
      <Dialog open={!!activeKr} onOpenChange={(v) => !v && setActiveKr(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>KR Comments</DialogTitle>
          </DialogHeader>
          {!activeKr ? null : (
            <div className="flex flex-col gap-3 min-h-0">
              <div>
                <p className="font-medium text-sm">{activeKr.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Total: {krUpdatesByKrId[String(activeKr.id)]?.length ?? 0}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={loadAllKrUpdates}
                    disabled={isLoadingKrUpdates}
                  >
                    {isLoadingKrUpdates ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {(krUpdatesByKrId[String(activeKr.id)] ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No comments yet.
                  </p>
                ) : (
                  (krUpdatesByKrId[String(activeKr.id)] ?? []).map((u) => (
                    <div
                      key={u.id}
                      className={`rounded-lg p-3 ${GLASS_SUB} space-y-1`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-xs font-medium">
                          {u.week_label ?? u.week_id}
                          {" • "}
                          {u.author?.name ?? "Unknown"}
                          {u.team?.name ? ` • ${u.team.name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed">{u.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}s