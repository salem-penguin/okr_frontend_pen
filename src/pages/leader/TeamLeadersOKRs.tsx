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

import { ChevronUp, ChevronDown, RefreshCw, Save } from "lucide-react";

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

type TeamOKRsResponse = {
  quarter: {
    quarter_id: string;
    start_date: string;
    end_date: string;
    seconds_remaining: number;
  };
  team: {
    team_id: string;
    team_name: string;
    objectives: Objective[];
  };
};

type UpdateKRProgressRequest = {
  id: string;
  status: KRStatus;
  progress: number;
};

// --------------------
// Helpers
// --------------------
function safeArray<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

function clampProgress(v: number) {
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

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

// --------------------
// Component
// --------------------
export default function TeamLeaderOKRs() {
  const { user } = useAuth();
  const isLeader = user?.role === "team_leader";

  const [data, setData] = useState<TeamOKRsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // collapse per objective
  const [openObjectives, setOpenObjectives] = useState<Record<string, boolean>>(
    {}
  );

  // draft edits per KR
  const [krEdits, setKrEdits] = useState<
    Record<string, { status: KRStatus; progress: number }>
  >({});

  const [isSaving, setIsSaving] = useState(false);

  const remaining = useMemo(
    () => formatDuration(data?.quarter.seconds_remaining ?? 0),
    [data?.quarter.seconds_remaining]
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<TeamOKRsResponse>("/okrs/team/current");

      // normalize to avoid crashes
      const normalized: TeamOKRsResponse = {
        quarter: res.quarter,
        team: {
          ...res.team,
          objectives: safeArray(res.team?.objectives).map((o) => ({
            ...o,
            key_results: safeArray(o.key_results),
          })),
        },
      };

      setData(normalized);

      // default open objectives
      setOpenObjectives((prev) => {
        const next = { ...prev };
        for (const o of normalized.team.objectives) {
          if (typeof next[o.id] !== "boolean") next[o.id] = true;
        }
        return next;
      });

      // initialize kr edits from server data (only if not already edited)
      setKrEdits((prev) => {
        const next = { ...prev };
        for (const o of normalized.team.objectives) {
          for (const kr of safeArray(o.key_results)) {
            if (!next[kr.id]) {
              next[kr.id] = {
                status: kr.status,
                progress: clampProgress(kr.progress ?? 0),
              };
            }
          }
        }
        return next;
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load Team OKRs");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();

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

  // access guard
  if (!isLeader) {
    return (
      <div className="p-6">
        <EmptyState
          title="Access Denied"
          description="This page is available for Team Leaders only."
        />
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading Team OKRs..." />;

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          title="No data"
          description="Unable to load Team OKRs."
          actionLabel="Retry"
          onAction={load}
        />
      </div>
    );
  }

  const objectives = safeArray(data.team.objectives);

  const updateKR = (krId: string, patch: Partial<{ status: KRStatus; progress: number }>) => {
    setKrEdits((prev) => {
      const current = prev[krId] ?? { status: "not_started" as KRStatus, progress: 0 };
      const next = {
        ...current,
        ...patch,
      };
      return { ...prev, [krId]: next };
    });
  };

  const saveKR = async (krId: string) => {
    const edit = krEdits[krId];
    if (!edit) return;

    const payload: UpdateKRProgressRequest = {
      id: krId,
      status: edit.status,
      progress: clampProgress(edit.progress),
    };

    setIsSaving(true);
    try {
      await apiFetch("/okrs/company/key-results/progress", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      toast.success("Key Result updated");
      await load(); // reload to refresh progress aggregation
    } catch (e) {
      console.error(e);
      toast.error("Failed to update Key Result");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team OKRs</h1>
          <p className="text-muted-foreground">
            {data.team.team_name} • {data.quarter.quarter_id} ({data.quarter.start_date} →{" "}
            {data.quarter.end_date}) • Time left:{" "}
            <span className="font-medium">{remaining}</span>
          </p>
        </div>

        <Button variant="outline" onClick={load} disabled={isSaving}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {objectives.length === 0 ? (
        <EmptyState
          title="No objectives assigned"
          description="The CEO has not assigned OKRs to your team for this quarter yet."
        />
      ) : (
        <div className="space-y-6">
          {objectives.map((obj) => {
            const isOpen = openObjectives[obj.id] ?? true;

            return (
              <Card key={obj.id} className="border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{obj.title}</CardTitle>
                    <CardDescription>
                      Objective progress is calculated from Key Results.
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setOpenObjectives((p) => ({ ...p, [obj.id]: !isOpen }))
                    }
                    className="h-8 w-8"
                  >
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>

                {isOpen && (
                  <CardContent className="space-y-6">
                    {/* Objective Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Objective Progress</span>
                        <span className="font-medium">{obj.progress ?? 0}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.min(100, Math.max(0, obj.progress ?? 0))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Key Results */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Key Results</div>

                      {safeArray(obj.key_results).length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No key results yet for this objective.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {safeArray(obj.key_results).map((kr) => {
                            const edit = krEdits[kr.id] ?? {
                              status: kr.status,
                              progress: clampProgress(kr.progress ?? 0),
                            };
                            const s = statusLabel(edit.status);

                            return (
                              <li
                                key={kr.id}
                                className="rounded-md border border-border p-4 space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                  <div className="space-y-1">
                                    <div className="text-sm font-semibold">{kr.title}</div>
                                    <div className={`text-xs ${s.cls}`}>
                                      {s.text} • {clampProgress(edit.progress)}%
                                    </div>
                                  </div>

                                  <Button
                                    onClick={() => saveKR(kr.id)}
                                    disabled={isSaving}
                                    className="sm:w-auto w-full"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                  </Button>
                                </div>

                                {/* Status + Progress controls */}
                                <div className="grid gap-3 sm:grid-cols-6">
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-muted-foreground">
                                      Status
                                    </label>
                                    <select
                                      className="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                                      value={edit.status}
                                      onChange={(e) =>
                                        updateKR(kr.id, {
                                          status: e.target.value as KRStatus,
                                        })
                                      }
                                    >
                                      <option value="not_started">Not Started</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                    </select>
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-muted-foreground">
                                      Progress (0–100)
                                    </label>
                                    <Input
                                      className="mt-1"
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={edit.progress}
                                      onChange={(e) =>
                                        updateKR(kr.id, {
                                          progress: clampProgress(Number(e.target.value)),
                                        })
                                      }
                                    />
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-muted-foreground">
                                      Slider
                                    </label>
                                    <div className="mt-3">
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={clampProgress(edit.progress)}
                                        onChange={(e) =>
                                          updateKR(kr.id, {
                                            progress: clampProgress(Number(e.target.value)),
                                          })
                                        }
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Progress bar preview */}
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        Math.max(0, clampProgress(edit.progress))
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
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
