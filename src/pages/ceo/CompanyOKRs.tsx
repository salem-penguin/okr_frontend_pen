// src/pages/ceo/CompanyOKRs.tsx
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  weight: number; // NEW
};

type ObjectiveTimeline = {
  timeline_start: string; // ISO date
  timeline_end: string; // ISO date
  is_expired: boolean;
  days_remaining: number;
  needs_extension_prompt: boolean;
};

type Objective = {
  id: string;
  title: string;
  progress: number;
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

// ISO date -> yyyy-mm-dd (for <input type="date">)
function toDateInputValue(iso?: string) {
  if (!iso) return "";
  // Expect "YYYY-MM-DD" or "YYYY-MM-DDTHH..."
  return iso.slice(0, 10);
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
  const [krWeightByObjective, setKrWeightByObjective] = useState<Record<string, number>>({}); // NEW
  const [isSaving, setIsSaving] = useState(false);

  // Timeline edit drafts per objective
  const [tlDraftByObj, setTlDraftByObj] = useState<Record<string, { start: string; end: string }>>({});
  const [isSavingTimelineByObj, setIsSavingTimelineByObj] = useState<Record<string, boolean>>({});

  const remaining = useMemo(
    () => formatDuration(data?.quarter.seconds_remaining ?? 0),
    [data?.quarter.seconds_remaining]
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<CurrentOKRsResponse>("/okrs/company/current");

      const normalized: CurrentOKRsResponse = {
        quarter: res.quarter,
        teams: safeArray(res.teams).map((t) => ({
          ...t,
          objectives: safeArray(t.objectives).map((o) => ({
            ...o,
            key_results: safeArray(o.key_results).map((kr: any) => ({
              ...kr,
              progress: kr?.progress ?? 0,
              weight: kr?.weight ?? 1,
            })),
          })),
        })),
      };

      setData(normalized);

      // default open all teams
      setOpenTeams((prev) => {
        const next: Record<string, boolean> = { ...prev };
        for (const t of normalized.teams) {
          const k = t.team_id ?? "unassigned";
          if (typeof next[k] !== "boolean") next[k] = true;
        }
        return next;
      });

      // init timeline drafts
      setTlDraftByObj((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            if (!next[obj.id]) {
              next[obj.id] = {
                start: toDateInputValue(obj.timeline?.timeline_start),
                end: toDateInputValue(obj.timeline?.timeline_end),
              };
            } else {
              // keep user's edits if already present
              if (!next[obj.id].start) next[obj.id].start = toDateInputValue(obj.timeline?.timeline_start);
              if (!next[obj.id].end) next[obj.id].end = toDateInputValue(obj.timeline?.timeline_end);
            }
          }
        }
        return next;
      });

      // init KR weight drafts (default 1 per objective if missing)
      setKrWeightByObjective((prev) => {
        const next = { ...prev };
        for (const team of normalized.teams) {
          for (const obj of safeArray(team.objectives)) {
            if (typeof next[obj.id] !== "number") next[obj.id] = 1;
          }
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
      toast.error("Failed to load teams");
      setTeamsOptions([]);
    }
  };

  // Load OKRs once
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load teams options whenever we know user is CEO
  useEffect(() => {
    if (isCEO) loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCEO]);

  // quarter countdown tick (1 minute)
  useEffect(() => {
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
    const weight = Number(krWeightByObjective[objectiveId] ?? 1);

    if (!title) return toast.error("Key Result title is required");
    if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
      return toast.error("Weight must be between 1 and 100");
    }

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
        body: JSON.stringify({
          timeline_start: start,
          timeline_end: end,
        }),
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

  if (!isCEO) {
    return (
      <div className="p-6">
        <EmptyState title="Access Denied" description="This page is available for CEO only." />
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading OKR progress..." />;

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState title="No data" description="Unable to load OKRs." actionLabel="Retry" onAction={load} />
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
        <EmptyState title="No OKRs yet" description="Add objectives and key results for this quarter." />
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
                    <CardDescription>Progress is updated by the assigned team.</CardDescription>
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
                      <EmptyState title="No objectives" description="Add an objective for this team." />
                    ) : (
                      safeArray(team.objectives).map((obj) => {
                        const tl = obj.timeline;
                        const draft = tlDraftByObj[obj.id] || { start: "", end: "" };
                        const isSavingTl = !!isSavingTimelineByObj[obj.id];

                        // Optional: disable Save if nothing changed (compared to server)
                        const serverStart = toDateInputValue(tl?.timeline_start);
                        const serverEnd = toDateInputValue(tl?.timeline_end);
                        const isTlDirty =
                          draft.start !== (serverStart || "") || draft.end !== (serverEnd || "");

                        return (
                          <div key={obj.id} className="space-y-3 rounded-lg border border-border p-4">
                            {/* Objective header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="font-semibold">{obj.title}</div>
                              <div className="text-sm text-muted-foreground">{obj.progress ?? 0}%</div>
                            </div>

                            {/* Objective Timeline */}
                            <div className="rounded-md border border-border p-3 space-y-2">
                              <div className="text-sm font-medium">Objective Timeline</div>

                              <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">Start</div>
                                  <Input
                                    type="date"
                                    value={draft.start}
                                    onChange={(e) =>
                                      setTlDraftByObj((p) => ({
                                        ...p,
                                        [obj.id]: { ...draft, start: e.target.value },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="space-y-1">
                                  <div className="text-xs text-muted-foreground">End</div>
                                  <Input
                                    type="date"
                                    value={draft.end}
                                    onChange={(e) =>
                                      setTlDraftByObj((p) => ({
                                        ...p,
                                        [obj.id]: { ...draft, end: e.target.value },
                                      }))
                                    }
                                  />
                                </div>

                                <div className="flex items-end">
                                  <Button
                                    onClick={() => saveObjectiveTimeline(obj.id)}
                                    disabled={!isTlDirty || isSavingTl || isSaving}
                                  >
                                    Save
                                  </Button>
                                </div>
                              </div>

                              <div className="text-sm">
                                {tl ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-muted-foreground">
                                      Days remaining: <span className="font-medium">{tl.days_remaining}</span>
                                    </span>

                                    {tl.is_expired ? (
                                      <span className="rounded-md border px-2 py-1 text-xs text-red-600">
                                        Expired
                                      </span>
                                    ) : (
                                      <span className="rounded-md border px-2 py-1 text-xs text-emerald-600">
                                        Active
                                      </span>
                                    )}

                                    {tl.needs_extension_prompt ? (
                                      <span className="rounded-md border px-2 py-1 text-xs text-amber-600">
                                        Extension recommended
                                      </span>
                                    ) : null}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Timeline not available.</span>
                                )}
                              </div>
                            </div>

                            {/* Progress bar */}
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
                                            {s.text} • {kr.progress ?? 0}% • Weight: {kr.weight ?? 1}
                                          </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground">Updated by team</div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>

                            {/* Add KR (with weight) */}
                            <div className="grid gap-2 sm:grid-cols-7 pt-2">
                              <div className="sm:col-span-4">
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

                              <div className="sm:col-span-2">
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={krWeightByObjective[obj.id] ?? 1}
                                  onChange={(e) =>
                                    setKrWeightByObjective((prev) => ({
                                      ...prev,
                                      [obj.id]: Number(e.target.value || 1),
                                    }))
                                  }
                                  placeholder="Weight (1-100)"
                                />
                              </div>

                              <div className="sm:col-span-1">
                                <Button className="w-full" onClick={() => addKeyResult(obj.id)} disabled={isSaving}>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })
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
