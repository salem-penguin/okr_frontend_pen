// src/pages/leader/TeamLeadersOKRs.tsx
import React, { useEffect, useMemo, useState } from "react";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Save,
  Plus,
  MessageSquare,
  Loader2,
} from "lucide-react";

// --------------------
// Types
// --------------------
type KRStatus = "not_started" | "in_progress" | "completed";

type ObjectiveTimeline = {
  timeline_start: string;
  timeline_end: string;
  is_expired: boolean;
  days_remaining: number;
};

type KR = {
  id: string;
  title: string;
  status: KRStatus;
  progress: number;
  weight: number;
};

type Objective = {
  id: string;
  title: string;
  progress: number;
  key_results: KR[];
  timeline?: ObjectiveTimeline;
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

type AddKeyResultRequest = {
  objective_id: string;
  title: string;
  weight: number;
};

// ✅ Backend response for KR updates
type KRUpdateItem = {
  id: string;
  week_id: string;
  week_label?: string | null;
  note: string;
  meta: any;
  created_at: string;
  author: null | {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

type KRUpdatesResponse = {
  items: KRUpdateItem[];
  count: number;
};

type NotesState = {
  loading: boolean;
  loaded: boolean;
  items: KRUpdateItem[];
};

// --------------------
// Helpers
// --------------------
function safeArray<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

function clampProgress(v: number) {
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, Math.round(v)));
}

function formatDuration(seconds: number) {
  const s = Math.max(0, seconds);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  return `${days}d ${hours}h ${mins}m`;
}

function statusFromProgress(p: number): KRStatus {
  const v = clampProgress(p);
  if (v >= 100) return "completed";
  if (v > 0) return "in_progress";
  return "not_started";
}

function statusLabel(s: KRStatus) {
  if (s === "completed")
    return { text: "Completed", cls: "text-emerald-600 dark:text-emerald-400" };
  if (s === "in_progress")
    return { text: "In Progress", cls: "text-amber-700 dark:text-amber-400" };
  return { text: "Not Started", cls: "text-red-600 dark:text-red-400" };
}

function statusTone(s: KRStatus): "neutral" | "amber" | "emerald" | "red" {
  if (s === "completed") return "emerald";
  if (s === "in_progress") return "amber";
  return "red";
}

function prettyDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

// --------------------
// Theme-safe design tokens
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
  tone?: "neutral" | "amber" | "emerald" | "red";
}) {
  const toneCls =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300"
      : tone === "amber"
      ? "bg-amber-500/10 text-amber-800 border-amber-500/20 dark:text-amber-300"
      : tone === "red"
      ? "bg-red-500/10 text-red-800 border-red-500/20 dark:text-red-300"
      : "bg-muted/40 text-muted-foreground border-border/60";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${toneCls}`}
    >
      {children}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const v = clampProgress(value);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} />
    </div>
  );
}

// --------------------
// Component
// --------------------
export default function TeamLeaderOKRs() {
  const { user } = useAuth();
  const isLeader = user?.role === "team_leader";

  const [data, setData] = useState<TeamOKRsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [openObjectives, setOpenObjectives] = useState<Record<string, boolean>>({});
  const [krEdits, setKrEdits] = useState<Record<string, { progress: number }>>({});

  const [krDraftByObjective, setKrDraftByObjective] = useState<Record<string, string>>({});
  const [krWeightByObjective, setKrWeightByObjective] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // UX controls
  const [query, setQuery] = useState("");
  const [onlyAttention, setOnlyAttention] = useState(false);

  // ✅ Modal state
  const [krModalOpen, setKrModalOpen] = useState(false);
  const [selectedKr, setSelectedKr] = useState<null | {
    krId: string;
    krTitle: string;
    objectiveTitle: string;
  }>(null);

  // ✅ Notes cache
  const [notesByKrId, setNotesByKrId] = useState<Record<string, NotesState>>({});

  const remaining = useMemo(
    () => formatDuration(data?.quarter.seconds_remaining ?? 0),
    [data?.quarter.seconds_remaining]
  );

  const objectives = useMemo(
    () => safeArray(data?.team?.objectives),
    [data?.team?.objectives]
  );

  const attentionCount = useMemo(() => {
    let c = 0;
    for (const o of objectives) {
      const tl = o.timeline;
      const needsTimeline = (tl?.is_expired ?? false) || (tl ? tl.days_remaining <= 3 : false);
      const needsProgress = clampProgress(o.progress) < 20;
      const noKrs = safeArray(o.key_results).length === 0;
      if (needsTimeline || needsProgress || noKrs) c += 1;
    }
    return c;
  }, [objectives]);

  const filteredObjectives = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? objectives.filter((o) => {
          const inObj = o.title.toLowerCase().includes(q);
          const inKrs = safeArray(o.key_results).some((k) =>
            k.title.toLowerCase().includes(q)
          );
          return inObj || inKrs;
        })
      : objectives;

    if (!onlyAttention) return base;

    return base.filter((o) => {
      const tl = o.timeline;
      const needsTimeline = (tl?.is_expired ?? false) || (tl ? tl.days_remaining <= 3 : false);
      const needsProgress = clampProgress(o.progress) < 20;
      const noKrs = safeArray(o.key_results).length === 0;
      return needsTimeline || needsProgress || noKrs;
    });
  }, [objectives, query, onlyAttention]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch<TeamOKRsResponse>("/okrs/team/current");

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

      setOpenObjectives((prev) => {
        const next = { ...prev };
        for (const o of normalized.team.objectives) {
          if (typeof next[o.id] !== "boolean") next[o.id] = true;
        }
        return next;
      });

      setKrEdits((prev) => {
        const next = { ...prev };
        for (const o of normalized.team.objectives) {
          for (const kr of safeArray(o.key_results)) {
            if (!next[kr.id]) next[kr.id] = { progress: clampProgress(kr.progress ?? 0) };
          }
        }
        return next;
      });

      setKrWeightByObjective((prev) => {
        const next = { ...prev };
        for (const obj of normalized.team.objectives) {
          if (typeof next[obj.id] !== "number") next[obj.id] = 1;
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

  const updateKRProgress = (krId: string, progress: number) => {
    setKrEdits((prev) => {
      const current = prev[krId] ?? { progress: 0 };
      return { ...prev, [krId]: { ...current, progress: clampProgress(progress) } };
    });
  };

  const saveKR = async (krId: string) => {
    const edit = krEdits[krId];
    if (!edit) return;

    const progress = clampProgress(edit.progress);
    const autoStatus = statusFromProgress(progress);

    const payload: UpdateKRProgressRequest = { id: krId, status: autoStatus, progress };

    setIsSaving(true);
    try {
      await apiFetch("/okrs/company/key-results/progress", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      toast.success("Key Result updated");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to update Key Result");
    } finally {
      setIsSaving(false);
    }
  };

  const addKeyResult = async (objectiveId: string) => {
    const title = (krDraftByObjective[objectiveId] || "").trim();
    const weight = Number(krWeightByObjective[objectiveId] ?? 1);

    if (!title) return toast.error("Key Result title is required");
    if (!Number.isFinite(weight) || weight < 1 || weight > 100) {
      return toast.error("Weight must be between 1 and 100");
    }

    const payload: AddKeyResultRequest = { objective_id: objectiveId, title, weight };

    setIsSaving(true);
    try {
      await apiFetch("/okrs/team/key-results", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setKrDraftByObjective((p) => ({ ...p, [objectiveId]: "" }));
      setKrWeightByObjective((p) => ({ ...p, [objectiveId]: 1 }));

      toast.success("Key Result added");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add key result");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Load notes for selected KR (cached)
  const loadKrNotes = async (krId: string, force = false) => {
    const current = notesByKrId[krId];
    if (!force && (current?.loading || current?.loaded)) return;

    setNotesByKrId((prev) => ({
      ...prev,
      [krId]: { loading: true, loaded: false, items: prev[krId]?.items ?? [] },
    }));

    try {
      const res = await apiFetch<KRUpdatesResponse>(
        `/okrs/key-results/${encodeURIComponent(krId)}/updates?limit=200`
      );

      const items = safeArray(res.items)
        .slice()
        .sort((a, b) => {
          const ta = Date.parse(a.created_at || "");
          const tb = Date.parse(b.created_at || "");
          return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
        });

      setNotesByKrId((prev) => ({
        ...prev,
        [krId]: { loading: false, loaded: true, items },
      }));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load KR notes");
      setNotesByKrId((prev) => ({
        ...prev,
        [krId]: { loading: false, loaded: true, items: [] },
      }));
    }
  };

  const openKrModal = async (kr: KR, objectiveTitle: string) => {
    setSelectedKr({ krId: kr.id, krTitle: kr.title, objectiveTitle });
    setKrModalOpen(true);
    await loadKrNotes(kr.id);
  };

  // --------------------
  // Guards
  // --------------------
  if (!isLeader) {
    return (
      <div className="p-6">
        <EmptyState title="Access Denied" description="This page is available for Team Leaders only." />
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading Team OKRs..." />;

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState title="No data" description="Unable to load Team OKRs." actionLabel="Retry" onAction={load} />
      </div>
    );
  }

  const selectedNotesState = selectedKr ? notesByKrId[selectedKr.krId] : undefined;

  // --------------------
  // UI
  // --------------------
  return (
    <div className="p-6 space-y-6 relative">
      {/* KR Notes Modal */}
      <Dialog
        open={krModalOpen}
        onOpenChange={(open) => {
          setKrModalOpen(open);
          if (!open) setSelectedKr(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Key Result Comments
            </DialogTitle>
            <DialogDescription>
              {selectedKr ? (
                <span className="text-sm">
                  <span className="font-medium text-foreground">{selectedKr.krTitle}</span>
                  <span className="text-muted-foreground"> • {selectedKr.objectiveTitle}</span>
                </span>
              ) : (
                "—"
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {selectedNotesState?.loaded ? `${selectedNotesState.items.length} updates` : "Loading..."}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedKr && loadKrNotes(selectedKr.krId, true)}
              disabled={!selectedKr || selectedNotesState?.loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className={`rounded-xl ${GLASS_SUB} p-3 max-h-[60vh] overflow-auto`}>
            {!selectedKr ? (
              <div className="text-sm text-muted-foreground">No KR selected.</div>
            ) : selectedNotesState?.loading && !selectedNotesState.loaded ? (
              <div className="text-sm text-muted-foreground">Loading comments...</div>
            ) : (selectedNotesState?.items?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No comments yet for this Key Result.</div>
            ) : (
              <div className="space-y-3">
                {safeArray(selectedNotesState?.items).map((u) => (
                  <div key={u.id} className="rounded-xl border border-border/60 bg-card/40 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">
                        {u.week_label ?? u.week_id} • {prettyDate(u.created_at)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.author?.name ? (
                          <>
                            <span className="font-medium text-foreground">{u.author.name}</span>
                            {u.author.email ? <span className="ml-2">{u.author.email}</span> : null}
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    </div>

                    {u.meta ? (
                      <div className="flex flex-wrap gap-2">
                        {u.meta?.field_label ? <Pill>{u.meta.field_label}</Pill> : null}
                        {u.meta?.field_id ? <Pill>{u.meta.field_id}</Pill> : null}
                      </div>
                    ) : null}

                    <div className="text-sm whitespace-pre-wrap">{u.note}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Team OKRs</h1>
            <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
              {data.quarter.quarter_id}
            </span>
          </div>

          <p className="text-muted-foreground">
            {data.team.team_name} • {data.quarter.start_date} → {data.quarter.end_date} • Time left:{" "}
            <span className="font-medium">{remaining}</span>
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <Pill>
              Objectives: <span className="ml-1 font-medium text-foreground">{objectives.length}</span>
            </Pill>
            {attentionCount > 0 ? (
              <Pill tone="amber">
                Needs attention: <span className="ml-1 font-medium text-foreground">{attentionCount}</span>
              </Pill>
            ) : (
              <Pill tone="emerald">Healthy</Pill>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Button variant="outline" onClick={load} disabled={isSaving}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>

            <Button variant={onlyAttention ? "default" : "outline"} onClick={() => setOnlyAttention((p) => !p)}>
              Attention
            </Button>
          </div>

          <div className={`w-full sm:w-[360px] rounded-xl ${GLASS} p-2`}>
            <Input
              className="h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              placeholder="Search objectives or KRs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {objectives.length === 0 ? (
        <EmptyState
          title="No objectives assigned"
          description="The CEO has not assigned OKRs to your team for this quarter yet."
        />
      ) : (
        <div className="space-y-6">
          {filteredObjectives.map((obj) => {
            const isOpen = openObjectives[obj.id] ?? true;

            const tl = obj.timeline;
            const needsTimeline = (tl?.is_expired ?? false) || (tl ? tl.days_remaining <= 3 : false);
            const needsProgress = clampProgress(obj.progress) < 20;
            const noKrs = safeArray(obj.key_results).length === 0;

            return (
              <Card key={obj.id} className={`${GLASS} overflow-hidden`}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{obj.title}</CardTitle>
                      {needsTimeline || needsProgress || noKrs ? (
                        <Pill tone="amber">Attention</Pill>
                      ) : (
                        <Pill tone="emerald">OK</Pill>
                      )}
                    </div>
                    <CardDescription>Objective progress is calculated from Key Results.</CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setOpenObjectives((p) => ({ ...p, [obj.id]: !isOpen }))}
                    className="h-8 w-8"
                  >
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CardHeader>

                {isOpen && (
                  <CardContent className="space-y-6">
                    {/* Objective Progress */}
                    <div className={`rounded-xl ${GLASS_SUB} p-3 space-y-2`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Objective Progress</span>
                        <span className="font-medium">{clampProgress(obj.progress ?? 0)}%</span>
                      </div>
                      <ProgressBar value={obj.progress ?? 0} />
                    </div>

                    {/* Timeline */}
                    <div className={`rounded-xl ${GLASS_SUB} p-3 space-y-2`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">Objective Timeline</div>
                        {obj.timeline ? (
                          <div className="flex flex-wrap gap-2">
                            <Pill tone={obj.timeline.is_expired ? "amber" : "emerald"}>
                              {obj.timeline.is_expired ? "Expired" : "Active"}
                            </Pill>
                            <Pill>
                              Days left:{" "}
                              <span className="ml-1 font-medium text-foreground">{obj.timeline.days_remaining}</span>
                            </Pill>
                          </div>
                        ) : (
                          <Pill>Timeline not available</Pill>
                        )}
                      </div>

                      {obj.timeline ? (
                        <div className="text-sm text-muted-foreground">
                          {obj.timeline.timeline_start.slice(0, 10)} → {obj.timeline.timeline_end.slice(0, 10)}
                        </div>
                      ) : null}
                    </div>

                    {/* Key Results */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Key Results</div>
                        <div className="text-xs text-muted-foreground">{safeArray(obj.key_results).length} items</div>
                      </div>

                      {safeArray(obj.key_results).length === 0 ? (
                        <div className={`rounded-xl ${GLASS_SUB} p-3 text-sm text-muted-foreground`}>
                          No key results yet for this objective.
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {safeArray(obj.key_results).map((kr) => {
                            const edit = krEdits[kr.id] ?? { progress: clampProgress(kr.progress ?? 0) };
                            const autoStatus = statusFromProgress(edit.progress);
                            const s = statusLabel(autoStatus);

                            // ✅ Same "Comments button UI" as CEO (outline btn + count + latest + loader)
                            const notesState = notesByKrId[kr.id];
                            const isNotesLoading = !!notesState?.loading;
                            const isNotesLoaded = !!notesState?.loaded;
                            const commentsCount = isNotesLoaded ? notesState.items.length : undefined;
                            const latest = isNotesLoaded && notesState.items.length > 0 ? notesState.items[0] : undefined;

                            return (
                              <li key={kr.id} className={`rounded-2xl ${GLASS_SUB} p-4 space-y-3`}>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <div className="text-sm font-semibold truncate">{kr.title}</div>
                                      <Pill tone={statusTone(autoStatus)}>{s.text}</Pill>
                                    </div>

                                    <div className={`text-xs ${s.cls}`}>
                                      {clampProgress(edit.progress)}% • Weight:{" "}
                                      <span className="font-medium text-foreground">{kr.weight ?? 1}</span>
                                    </div>

                                    <div className="pt-2">
                                      <ProgressBar value={edit.progress} />
                                    </div>

                                    {/* ✅ Comments UI (same pattern as CompanyOKRs) */}
                                    <div className="mt-3 flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openKrModal(kr, obj.title)}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Comments{typeof commentsCount === "number" && commentsCount > 0 ? ` (${commentsCount})` : ""}
                                      </Button>

                                      {isNotesLoading ? (
                                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          loading…
                                        </span>
                                      ) : isNotesLoaded ? (
                                        latest ? (
                                          <span className="text-xs text-muted-foreground truncate max-w-[420px]">
                                            Latest: {latest.note}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">No comments yet</span>
                                        )
                                      ) : (
                                        <span className="text-xs text-muted-foreground">Click to load</span>
                                      )}
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

                                {/* Controls */}
                                <div className="grid gap-3 sm:grid-cols-6">
                                  <div className="sm:col-span-2 space-y-1">
                                    <div className="text-xs text-muted-foreground">Status</div>
                                    <Select value={autoStatus} onValueChange={() => {}}>
                                      <SelectTrigger className="h-10" disabled>
                                        <SelectValue placeholder="Status" />
                                      </SelectTrigger>
                                      <SelectContent className="border-border/60 bg-popover/90 text-popover-foreground backdrop-blur-xl">
                                        <SelectItem value="not_started">Not Started</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="sm:col-span-2 space-y-1">
                                    <div className="text-xs text-muted-foreground">Progress (0–100)</div>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={edit.progress}
                                      onChange={(e) => updateKRProgress(kr.id, Number(e.target.value))}
                                    />
                                  </div>

                                  <div className="sm:col-span-2 space-y-1">
                                    <div className="text-xs text-muted-foreground">Slider</div>
                                    <input
                                      type="range"
                                      min={0}
                                      max={100}
                                      value={clampProgress(edit.progress)}
                                      onChange={(e) => updateKRProgress(kr.id, Number(e.target.value))}
                                      className="w-full accent-primary"
                                    />
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Add KR */}
                    <div className={`rounded-2xl ${GLASS_SUB} p-4 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Add Key Result</div>
                        <Pill>Max total weight ≤ 100</Pill>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-7">
                        <div className="sm:col-span-4">
                          <Input
                            value={krDraftByObjective[obj.id] ?? ""}
                            onChange={(e) =>
                              setKrDraftByObjective((prev) => ({ ...prev, [obj.id]: e.target.value }))
                            }
                            placeholder="Key result title..."
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

                      <div className="text-xs text-muted-foreground">
                        Total KR weights for this objective must be ≤ 100 (server enforced).
                      </div>
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
