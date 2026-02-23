// src/pages/leader/LeaderDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";
import { Week } from "@/types";
import { apiFetch } from "@/api/client";

import { KPICard } from "@/components/shared/KPICard";
import { StatusPill } from "@/components/shared/StatusPill";
import { WeekSelector } from "@/components/shared/WeekSelector";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// --------------------
// Backend response types
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string; // ISO
  display_label: string;
};

type ReportStatus = "draft" | "submitted";
type DashboardStatus = "submitted" | "not_submitted";

type MyReportResponse = {
  item:
    | {
        id: string;
        status: ReportStatus;
        submitted_at: string | null;
      }
    | null;
};

type ReportsListResponse = {
  items: Array<{
    submitter: { id: string; name: string };
    status: ReportStatus;
    submitted_at: string | null;
  }>;
  count: number;
};

type TeamMembersResponse = {
  items: Array<{ id: string; name: string; email: string; role: string }>;
  count: number;
};

type WeeksListResponse = {
  items: CurrentWeekResponse[];
  count: number;
};

// --------------------
// Team OKRs (Objective = parent, KR = child)
// --------------------
type KRStatus = "not_started" | "in_progress" | "completed";

type TeamKR = {
  id: string;
  title: string;
  status: KRStatus;
  progress: number;
  weight: number;
};

type TeamObjective = {
  id: string;
  title: string;
  progress: number;
  key_results: TeamKR[];
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
    objectives: TeamObjective[];
  };
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

function toDashboardStatus(status: ReportStatus | undefined | null): DashboardStatus {
  return status === "submitted" ? "submitted" : "not_submitted";
}

function safeArray<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

function clamp01(x: number) {
  return Math.min(100, Math.max(0, Number(x || 0)));
}

// --------------------
// Design tokens (same as CEODashboard)
// --------------------
const GLASS =
  "bg-card/15 backdrop-blur-2xl border border-white/10 " +
  "shadow-[0_12px_40px_rgba(245,158,11,0.18)] " +
  "ring-1 ring-amber-400/20";

// ✅ progress ONLY on edges (masked border ring)
function ProgressCard({
  progress,
  children,
  className = "",
}: {
  progress: number;
  children: React.ReactNode;
  className?: string;
}) {
  const p = clamp01(progress);

  return (
    <div className={`relative rounded-2xl p-[2px] ${className}`}>
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `conic-gradient(
            hsl(var(--primary)) ${p}%,
            hsl(var(--muted)) 0
          )`,
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "2px",
        }}
      />

      <div
        className={[
          "relative z-10 h-[320px] w-full",
          `rounded-2xl ${GLASS} overflow-hidden`,
          "shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-primary/20",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

// ✅ Bigger progress circle
function ProgressRing({
  value,
  size = 96,
  stroke = 7,
}: {
  value: number;
  size?: number;
  stroke?: number;
}) {
  const v = clamp01(value);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (v / 100) * c;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
          opacity={0.7}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        />
      </svg>

      <div className="absolute rounded-full border border-white/10 bg-background/60 backdrop-blur px-2 py-1 text-xs font-semibold tabular-nums">
        {Math.round(v)}%
      </div>
    </div>
  );
}

// --------------------
// Motion presets
// --------------------
const easeOut = cubicBezier(0.16, 1, 0.3, 1);

const pageFade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: easeOut },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.35, ease: easeOut },
};

export default function LeaderDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const [data, setData] = useState<{
    kpi: { submittedCount: number; notSubmittedCount: number; totalCount: number };
    members: { id: string; name: string; status: DashboardStatus; submittedAt: string | null }[];
  } | null>(null);

  const [myReport, setMyReport] = useState<{
    status: DashboardStatus;
    submittedAt: string | null;
  } | null>(null);

  const [teamOKRs, setTeamOKRs] = useState<TeamObjective[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const userEmail = user?.email;

  // ✅ only ONE expanded OKR card at a time
  const [expandedObjId, setExpandedObjId] = useState<string | null>(null);
  const okrCardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const toggleExpanded = (objId: string) => {
    setExpandedObjId((prev) => (prev === objId ? null : objId));
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!expandedObjId) return;
      const el = okrCardRefs.current[expandedObjId];
      if (!el) return;
      if (!el.contains(e.target as Node)) setExpandedObjId(null);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expandedObjId]);

  // Boot: weeks selector
  useEffect(() => {
    const boot = async () => {
      if (!userEmail) return;

      setIsLoading(true);
      try {
        const weeksRes = await apiFetch<WeeksListResponse>("/weeks?limit=12");
        const weekObjects = (weeksRes.items ?? []).map(toWeek);

        const cw = await apiFetch<CurrentWeekResponse>("/weeks/current");
        const currentWeek = toWeek(cw);

        const found = weekObjects.find((w) => w.isoWeekId === currentWeek.isoWeekId);
        const selected = found ?? weekObjects[0] ?? currentWeek;

        setWeeks(weekObjects.length ? weekObjects : [currentWeek]);
        setSelectedWeek(selected);
      } catch (e) {
        console.error("Failed to boot weeks:", e);
        try {
          const cw = await apiFetch<CurrentWeekResponse>("/weeks/current");
          const currentWeek = toWeek(cw);
          setWeeks([currentWeek]);
          setSelectedWeek(currentWeek);
        } catch {}
      } finally {
        setIsLoading(false);
      }
    };

    boot();
  }, [userEmail]);

  // Load dashboard data whenever week changes
  useEffect(() => {
    const loadData = async () => {
      if (!user?.teamId) return;
      if (!userEmail) return;
      if (!selectedWeek?.isoWeekId) return;

      setIsLoading(true);
      try {
        const weekId = selectedWeek.isoWeekId;

        const [my, roster, list, okrs] = await Promise.all([
          apiFetch<MyReportResponse>(
            `/reports/me?week_id=${encodeURIComponent(weekId)}&report_type=leader`
          ),
          apiFetch<TeamMembersResponse>(
            `/teams/${encodeURIComponent(user.teamId)}/members`
          ),
          apiFetch<ReportsListResponse>(
            `/reports?week_id=${encodeURIComponent(weekId)}&report_type=member`
          ),
          apiFetch<TeamOKRsResponse>("/okrs/team/current"),
        ]);

        setMyReport({
          status: toDashboardStatus(my.item?.status),
          submittedAt: my.item?.submitted_at ?? null,
        });

        const reportByUserId = new Map(
          (list.items ?? []).map((r) => [
            r.submitter.id,
            { status: r.status, submittedAt: r.submitted_at ?? null },
          ])
        );

        const members = (roster.items ?? []).map((m) => {
          const rep = reportByUserId.get(m.id);
          return {
            id: m.id,
            name: m.name,
            status: toDashboardStatus(rep?.status),
            submittedAt: rep?.submittedAt ?? null,
          };
        });

        const submittedCount = members.filter((m) => m.status === "submitted").length;
        const totalCount = members.length;
        const notSubmittedCount = totalCount - submittedCount;

        setData({
          kpi: { submittedCount, notSubmittedCount, totalCount },
          members,
        });

        const objectives = safeArray(okrs?.team?.objectives)
          .map((o) => ({
            ...o,
            progress: clamp01(o.progress),
            key_results: safeArray(o.key_results).map((kr) => ({
              ...kr,
              progress: clamp01(kr.progress),
              weight: Number(kr.weight ?? 1),
            })),
          }))
          .sort((a, b) => clamp01(b.progress) - clamp01(a.progress));

        setTeamOKRs(objectives);
      } catch (e) {
        console.error("Failed to load leader dashboard:", e);
        setData({
          kpi: { submittedCount: 0, notSubmittedCount: 0, totalCount: 0 },
          members: [],
        });
        setTeamOKRs([]);
        setMyReport({ status: "not_submitted", submittedAt: null });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedWeek?.isoWeekId, user?.teamId, userEmail]);

  const headerBadge = useMemo(() => {
    const submitted = data?.kpi.submittedCount ?? 0;
    const total = data?.kpi.totalCount ?? 0;
    const pct = total ? Math.round((submitted / total) * 100) : 0;
    return { pct, submitted, total };
  }, [data?.kpi.submittedCount, data?.kpi.totalCount]);

  if (!user?.teamId) {
    return (
      <EmptyState
        variant="no-team"
        title="No Team Assigned"
        description="You are not assigned to a team. Please contact an administrator."
      />
    );
  }

  if (isLoading || !selectedWeek) return <LoadingState />;

  return (
    <motion.div {...pageFade} className="space-y-6">
      {/* subtle modern background accent */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>

            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/40 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {headerBadge.pct}% submitted ({headerBadge.submitted}/{headerBadge.total})
            </div>
          </div>

          <p className="text-muted-foreground">Manage your team's weekly reports + OKRs</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
        </motion.div>
      </div>

      {/* My Weekly Report */}
      <motion.div variants={item} initial="initial" animate="animate">
        <Card className={`${GLASS} overflow-hidden`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">My Weekly Report</CardTitle>
            <StatusPill status={myReport?.status || "not_submitted"} />
          </CardHeader>
          <CardContent>
            {myReport?.status === "submitted" ? (
              <p className="text-sm text-muted-foreground">
                Submitted on{" "}
                {myReport.submittedAt ? new Date(myReport.submittedAt).toLocaleDateString() : "—"}
              </p>
            ) : (
              <Button onClick={() => navigate("/leader/submit")}>
                <FileText className="mr-2 h-4 w-4" /> Submit Report
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* KPI cards */}
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid gap-4 sm:grid-cols-3"
      >
        <motion.div
          variants={item}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <KPICard
            title="Submitted"
            value={data?.kpi.submittedCount || 0}
            subtitle="Members submitted"
            icon={CheckCircle}
            variant="success"
            className="transition hover:shadow-md hover:ring-1 hover:ring-primary/20"
          />
        </motion.div>

        <motion.div
          variants={item}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <KPICard
            title="Not Submitted"
            value={data?.kpi.notSubmittedCount || 0}
            subtitle="Pending"
            icon={XCircle}
            variant="warning"
            className="transition hover:shadow-md hover:ring-1 hover:ring-primary/20"
          />
        </motion.div>

        <motion.div
          variants={item}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <KPICard
            title="Team Size"
            value={data?.kpi.totalCount || 0}
            subtitle="Total members"
            icon={Users}
            className="transition hover:shadow-md hover:ring-1 hover:ring-primary/20"
          />
        </motion.div>
      </motion.div>

      {/* Team OKRs (Objective = Parent, KR = Children) */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Team OKRs</h2>
          <p className="text-sm text-muted-foreground">Objectives (parents) and Key Results (children)</p>
        </div>

        {teamOKRs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-card/35 p-4 shadow-sm backdrop-blur-md">
            <p className="text-sm text-muted-foreground">
              No OKRs found for your team (current quarter).
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid gap-4 md:grid-cols-2 items-stretch"
          >
            {teamOKRs.map((obj) => {
              const childrenSorted = [...safeArray(obj.key_results)].sort(
                (a, b) => clamp01(b.progress) - clamp01(a.progress)
              );

              return (
                <motion.div
                  key={obj.id}
                  ref={(node) => {
                    okrCardRefs.current[obj.id] = node;
                  }}
                  variants={item}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.995 }}
                  transition={{ type: "spring", stiffness: 240, damping: 20 }}
                  className="h-full"
                >
                  <ProgressCard progress={obj.progress} className="h-full">
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Objective
                          </div>
                          <div className="mt-1 text-base font-semibold truncate">{obj.title}</div>
                        </div>

                        <ProgressRing value={obj.progress} />
                      </div>

                      <div className="mt-4 flex-1 min-h-0">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(obj.id)}
                          className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-background/20 px-3 py-2 text-left backdrop-blur-sm transition hover:bg-background/30"
                        >
                          <div className="text-sm font-medium">
                            Key Results
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({childrenSorted.length})
                            </span>
                          </div>

                          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                            {expandedObjId === obj.id ? "Collapse" : "Expand"}
                            {expandedObjId === obj.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {expandedObjId === obj.id ? (
                            <motion.div
                              key="children"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: easeOut }}
                              className="mt-2 overflow-hidden"
                            >
                              <div className="max-h-[160px] overflow-y-auto pr-1">
                                {childrenSorted.length === 0 ? (
                                  <p className="rounded-lg border border-white/10 bg-background/15 p-3 text-sm text-muted-foreground backdrop-blur-sm">
                                    No key results yet.
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {childrenSorted.map((kr) => (
                                      <motion.div
                                        key={kr.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 6 }}
                                        transition={{ duration: 0.2, ease: easeOut }}
                                        className="rounded-lg border border-white/10 bg-background/15 p-3 backdrop-blur-sm"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="truncate text-sm font-semibold">{kr.title}</div>

                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                              <span className="inline-flex items-center rounded-full border border-white/10 bg-background/20 px-2 py-0.5 backdrop-blur">
                                                Weight:
                                                <span className="ml-1 font-medium text-foreground">
                                                  {Number(kr.weight ?? 1)}
                                                </span>
                                              </span>
                                            </div>
                                          </div>

                                          <div className="shrink-0 text-right">
                                            <div className="text-xs font-semibold tabular-nums">
                                              {Math.round(clamp01(kr.progress))}%
                                            </div>
                                            <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-muted/60">
                                              <motion.div
                                                className="h-2 rounded-full bg-primary"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${clamp01(kr.progress)}%` }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>

                        {expandedObjId !== obj.id && childrenSorted.length ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Top KR:{" "}
                            <span className="font-medium text-foreground">
                              {childrenSorted[0]?.title}
                            </span>{" "}
                            • {Math.round(clamp01(childrenSorted[0]?.progress))}%
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </ProgressCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Members table */}
      {data?.members.length === 0 ? (
        <EmptyState title="No team members" description="Your team has no members yet." />
      ) : (
        <motion.div
          variants={item}
          initial="initial"
          animate="animate"
          className={`rounded-xl overflow-hidden ${GLASS}`}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <AnimatePresence initial={false}>
                {data?.members.map((member) => (
                  <motion.tr
                    key={member.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2, ease: easeOut }}
                    className="border-b last:border-b-0 hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <StatusPill status={member.status} />
                    </TableCell>
                    <TableCell>
                      {member.submittedAt ? new Date(member.submittedAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.status === "submitted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/leader/reports/${selectedWeek.isoWeekId}/${member.id}`)
                          }
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      )}
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </motion.div>
      )}
    </motion.div>
  );
}
