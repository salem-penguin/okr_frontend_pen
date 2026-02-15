// // src/pages/ceo/CEODashboard.tsx
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Users, CheckCircle, XCircle, Eye } from 'lucide-react';

// import { useAuth } from '@/contexts/AuthContext';
// import { Week } from '@/types';
// import { apiFetch } from '@/api/client';

// import { KPICard } from '@/components/shared/KPICard';
// import { StatusPill } from '@/components/shared/StatusPill';
// import { WeekSelector } from '@/components/shared/WeekSelector';
// import { LoadingState } from '@/components/shared/LoadingState';
// import { EmptyState } from '@/components/shared/EmptyState';
// import { Button } from '@/components/ui/button';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// // --------------------
// // Backend response types (match FastAPI)
// // --------------------
// type CurrentWeekResponse = {
//   week_id: string;
//   start_date: string; // ISO
//   end_date: string; // ISO
//   display_label: string;
// };

// type ReportStatus = 'draft' | 'submitted';
// type DashboardStatus = 'submitted' | 'not_submitted';

// type ReportsListItem = {
//   id: string;
//   week_id: string;
//   team: { id: string; name: string };
//   submitter: { id: string; name: string; email: string; role: string };
//   report_type: 'member' | 'leader';
//   status: ReportStatus;
//   form_id: string;
//   form_snapshot: unknown;
//   payload: unknown;
//   created_at: string;
//   updated_at: string;
//   submitted_at: string | null;
// };

// type ReportsListResponse = {
//   items: ReportsListItem[];
//   count: number;
// };

// type WeeksListResponse = {
//   items: CurrentWeekResponse[];
//   count: number;
// };

// type LeadersListResponse = {
//   items: Array<{
//     id: string;
//     name: string;
//     email: string;
//     role: string;
//     team: { id: string; name: string; leader_id: string | null } | null;
//   }>;
//   count: number;
// };

// // --------------------
// // Company-level OKRs types
// // --------------------
// type CompanyOKRChild = {
//   id: string;
//   title: string;
//   team_name: string | null;
//   progress: number; // 0-100
//   parent_weight?: number; // optional
// };

// type CompanyLevelOKR = {
//   id: string;
//   title: string;
//   progress: number; // 0-100 (aggregated)
//   children: CompanyOKRChild[];
// };

// type CompanyLevelOKRsResponse = {
//   items: CompanyLevelOKR[];
//   count: number;
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

// function toDashboardStatus(status: ReportStatus | undefined | null): DashboardStatus {
//   return status === 'submitted' ? 'submitted' : 'not_submitted';
// }

// function clamp01(x: number) {
//   return Math.min(100, Math.max(0, x || 0));
// }

// function ProgressRing({
//   value,
//   size = 56,
//   stroke = 6,
// }: {
//   value: number;
//   size?: number;
//   stroke?: number;
// }) {
//   const v = clamp01(value);
//   const r = (size - stroke) / 2;
//   const c = 2 * Math.PI * r;
//   const dash = (v / 100) * c;

//   return (
//     <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
//       <svg width={size} height={size} className="-rotate-90">
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={r}
//           fill="none"
//           stroke="hsl(var(--muted))"
//           strokeWidth={stroke}
//         />
//         <circle
//           cx={size / 2}
//           cy={size / 2}
//           r={r}
//           fill="none"
//           stroke="hsl(var(--primary))"
//           strokeWidth={stroke}
//           strokeLinecap="round"
//           strokeDasharray={`${dash} ${c - dash}`}
//         />
//       </svg>
//       <div className="absolute text-xs font-semibold tabular-nums">{Math.round(v)}%</div>
//     </div>
//   );
// }

// export default function CEODashboard() {
//   const { user } = useAuth();
//   const userEmail = user?.email;

//   const navigate = useNavigate();

//   const [weeks, setWeeks] = useState<Week[]>([]);
//   const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

//   const [data, setData] = useState<{
//     kpi: { submittedCount: number; notSubmittedCount: number; totalCount: number };
//     leaders: { id: string; name: string; teamName: string; status: DashboardStatus; submittedAt: string | null }[];
//   } | null>(null);

//   const [companyOKRs, setCompanyOKRs] = useState<CompanyLevelOKR[]>([]);

//   const [isLoading, setIsLoading] = useState(true);

//   // Boot: load current week from API and set selector state
//   useEffect(() => {
//     const boot = async () => {
//       if (!userEmail) return;

//       setIsLoading(true);
//       try {
//         const weeksRes = await apiFetch<WeeksListResponse>('/weeks?limit=12');
//         const weekObjects = (weeksRes.items ?? []).map(toWeek);

//         const cw = await apiFetch<CurrentWeekResponse>('/weeks/current');
//         const currentWeek = toWeek(cw);

//         const found = weekObjects.find((w) => w.isoWeekId === currentWeek.isoWeekId);
//         const selected = found ?? weekObjects[0] ?? currentWeek;

//         setWeeks(weekObjects.length ? weekObjects : [currentWeek]);
//         setSelectedWeek(selected);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     boot();
//   }, [userEmail]);

//   // Load CEO dashboard data whenever week changes
//   useEffect(() => {
//     const loadData = async () => {
//       if (!userEmail) return;
//       if (!selectedWeek?.isoWeekId) return;

//       setIsLoading(true);
//       try {
//         const weekId = selectedWeek.isoWeekId;

//         // leaders + leader reports + company OKRs
//         const [leadersRes, reportsRes, companyRes] = await Promise.all([
//           apiFetch<LeadersListResponse>('/users?role=team_leader'),
//           apiFetch<ReportsListResponse>(`/reports?week_id=${encodeURIComponent(weekId)}&report_type=leader`),
//           apiFetch<CompanyLevelOKRsResponse>(`/okrs/company/level-progress?week_id=${encodeURIComponent(weekId)}`),
//         ]);

//         const leaders = leadersRes.items ?? [];
//         const reports = reportsRes.items ?? [];

//         setCompanyOKRs(companyRes.items ?? []);

//         // Map reports by leaderId (submitter.id)
//         const reportByLeaderId = new Map<string, ReportsListItem>();
//         for (const r of reports) reportByLeaderId.set(r.submitter.id, r);

//         // Build dashboard rows for ALL leaders
//         const rows = leaders.map((l) => {
//           const rep = reportByLeaderId.get(l.id);
//           return {
//             id: l.id,
//             name: l.name,
//             teamName: l.team?.name ?? '—',
//             status: toDashboardStatus(rep?.status),
//             submittedAt: rep?.submitted_at ?? null,
//           };
//         });

//         const submittedCount = rows.filter((x) => x.status === 'submitted').length;
//         const totalCount = rows.length;
//         const notSubmittedCount = totalCount - submittedCount;

//         setData({
//           kpi: { submittedCount, notSubmittedCount, totalCount },
//           leaders: rows,
//         });
//       } catch (err) {
//         console.error('Failed to load CEO dashboard:', err);
//         setCompanyOKRs([]);
//         setData({
//           kpi: { submittedCount: 0, notSubmittedCount: 0, totalCount: 0 },
//           leaders: [],
//         });
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadData();
//   }, [selectedWeek?.isoWeekId, userEmail]);

//   const handleViewReport = (leaderId: string) => {
//     if (!selectedWeek?.isoWeekId) return;
//     navigate(`/ceo/reports/${selectedWeek.isoWeekId}/${leaderId}`);
//   };

//   if (isLoading || !selectedWeek) return <LoadingState />;

//   return (
//     <div className="space-y-6">
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold">CEO Dashboard</h1>
//           <p className="text-muted-foreground">Overview of team leader submissions</p>
//         </div>

//         <WeekSelector weeks={weeks} selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
//       </div>

//       {/* KPI cards */}
//       <div className="grid gap-4 sm:grid-cols-3">
//         <KPICard
//           title="Submitted"
//           value={data?.kpi.submittedCount || 0}
//           subtitle="Leaders submitted"
//           icon={CheckCircle}
//           variant="success"
//         />
//         <KPICard
//           title="Not Submitted"
//           value={data?.kpi.notSubmittedCount || 0}
//           subtitle="Pending reports"
//           icon={XCircle}
//           variant="warning"
//         />
//         <KPICard title="Total Leaders" value={data?.kpi.totalCount || 0} subtitle="Team leaders" icon={Users} />
//       </div>

//       {/* Company-level OKRs (between cards and table) */}
//       <div className="space-y-3">
//         <div className="flex items-center justify-between">
//           <div>
//             <h2 className="text-lg font-semibold">Company-level OKRs</h2>
//             <p className="text-sm text-muted-foreground">Progress and child objectives by team</p>
//           </div>
//         </div>

//         {companyOKRs.length === 0 ? (
//           <div className="rounded-lg border bg-card p-4">
//             <p className="text-sm text-muted-foreground">No company-level OKRs found for the selected period.</p>
//           </div>
//         ) : (
//           <div className="grid gap-4 md:grid-cols-2">
//             {companyOKRs.map((okr) => (
//               <div key={okr.id} className="rounded-lg border bg-card p-4">
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0">
//                     <div className="text-sm text-muted-foreground">Company OKR</div>
//                     <div className="mt-1 text-base font-semibold truncate">{okr.title}</div>
//                   </div>

//                   <ProgressRing value={okr.progress} />
//                 </div>

//                 <div className="mt-4">
//                   <div className="text-sm font-medium">Children</div>

//                   {(!okr.children || okr.children.length === 0) ? (
//                     <p className="mt-2 text-sm text-muted-foreground">No child objectives linked yet.</p>
//                   ) : (
//                     <div className="mt-2 space-y-2">
//                       {okr.children.map((c) => (
//                         <div
//                           key={c.id}
//                           className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2"
//                         >
//                           <div className="min-w-0">
//                             <div className="text-sm font-medium truncate">{c.title}</div>
//                             <div className="text-xs text-muted-foreground">
//                               Team: <span className="font-medium">{c.team_name ?? 'Unassigned'}</span>
//                               {typeof c.parent_weight === 'number' ? (
//                                 <>
//                                   {' '}• Weight: <span className="font-medium">{c.parent_weight}</span>
//                                 </>
//                               ) : null}
//                             </div>
//                           </div>

//                           <div className="flex items-center gap-2">
//                             <div className="text-xs text-muted-foreground tabular-nums">{Math.round(clamp01(c.progress))}%</div>
//                             <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
//                               <div
//                                 className="h-2 rounded-full bg-primary"
//                                 style={{ width: `${clamp01(c.progress)}%` }}
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Leaders table */}
//       {data?.leaders.length === 0 ? (
//         <EmptyState title="No team leaders found" description="There are no team leaders configured in the system." />
//       ) : (
//         <div className="rounded-lg border bg-card">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Team</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Submitted</TableHead>
//                 <TableHead className="text-right">Action</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {data?.leaders.map((leader) => (
//                 <TableRow key={leader.id}>
//                   <TableCell className="font-medium">{leader.name}</TableCell>
//                   <TableCell>{leader.teamName}</TableCell>
//                   <TableCell>
//                     <StatusPill status={leader.status} />
//                   </TableCell>
//                   <TableCell>{leader.submittedAt ? new Date(leader.submittedAt).toLocaleDateString() : '—'}</TableCell>
//                   <TableCell className="text-right">
//                     {leader.status === 'submitted' && (
//                       <Button variant="ghost" size="sm" onClick={() => handleViewReport(leader.id)}>
//                         <Eye className="mr-1 h-4 w-4" /> View
//                       </Button>
//                     )}
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       )}
//     </div>
//   );
// }


// src/pages/ceo/CEODashboard.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  CheckCircle,
  XCircle,
  Eye,
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

// --------------------
// Backend response types (match FastAPI)
// --------------------
type CurrentWeekResponse = {
  week_id: string;
  start_date: string; // ISO
  end_date: string; // ISO
  display_label: string;
};
const GLASS =
  "bg-card/15 backdrop-blur-2xl border border-white/10 " +
  "shadow-[0_12px_40px_rgba(245,158,11,0.18)] " + // amber glow
  "ring-1 ring-amber-400/20";




type ReportStatus = "draft" | "submitted";
type DashboardStatus = "submitted" | "not_submitted";

type ReportsListItem = {
  id: string;
  week_id: string;
  team: { id: string; name: string };
  submitter: { id: string; name: string; email: string; role: string };
  report_type: "member" | "leader";
  status: ReportStatus;
  form_id: string;
  form_snapshot: unknown;
  payload: unknown;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
};

type ReportsListResponse = {
  items: ReportsListItem[];
  count: number;
};

type WeeksListResponse = {
  items: CurrentWeekResponse[];
  count: number;
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

// --------------------
// Company-level OKRs types
// --------------------
type CompanyOKRChild = {
  id: string;
  title: string;
  team_name: string | null;
  progress: number; // 0-100
  parent_weight?: number; // optional
};

type CompanyLevelOKR = {
  id: string;
  title: string;
  progress: number; // 0-100 (aggregated)
  children: CompanyOKRChild[];
};

type CompanyLevelOKRsResponse = {
  items: CompanyLevelOKR[];
  count: number;
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

function toDashboardStatus(
  status: ReportStatus | undefined | null
): DashboardStatus {
  return status === "submitted" ? "submitted" : "not_submitted";
}

function clamp01(x: number) {
  return Math.min(100, Math.max(0, x || 0));
}

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
      {/* border ring */}
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

      {/* inner card (solid enough to stop gradient bleed) */}
      <div
        className={[
          "relative z-10 h-[320px] w-full",
          `rounded-2xl ${GLASS} overflow-hidden`,

          "shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-primary/20",
          "overflow-hidden",
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
// Motion presets (✅ TS-safe easing)
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

export default function CEODashboard() {
  const { user } = useAuth();
  const userEmail = user?.email;

  const navigate = useNavigate();

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  const [data, setData] = useState<{
    kpi: {
      submittedCount: number;
      notSubmittedCount: number;
      totalCount: number;
    };
    leaders: {
      id: string;
      name: string;
      teamName: string;
      status: DashboardStatus;
      submittedAt: string | null;
    }[];
  } | null>(null);

  const [companyOKRs, setCompanyOKRs] = useState<CompanyLevelOKR[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ only ONE expanded card at a time
  const [expandedOkrId, setExpandedOkrId] = useState<string | null>(null);
  const okrCardRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  const toggleExpanded = (okrId: string) => {
    setExpandedOkrId((prev) => (prev === okrId ? null : okrId));
  };

  // ✅ collapse if user clicks anywhere else
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!expandedOkrId) return;
      const el = okrCardRefs.current[expandedOkrId];
      if (!el) return;
      if (!el.contains(e.target as Node)) setExpandedOkrId(null);
    };

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [expandedOkrId]);

  // ✅ Sort company OKRs (desc) and children (desc) by progress
  const sortedCompanyOKRs = useMemo(() => {
    return [...companyOKRs]
      .map((okr) => ({
        ...okr,
        children: [...(okr.children ?? [])].sort(
          (a, b) => clamp01(b.progress) - clamp01(a.progress)
        ),
      }))
      .sort((a, b) => clamp01(b.progress) - clamp01(a.progress));
  }, [companyOKRs]);

  // Boot: load current week from API and set selector state
  useEffect(() => {
    const boot = async () => {
      if (!userEmail) return;

      setIsLoading(true);
      try {
        const weeksRes = await apiFetch<WeeksListResponse>("/weeks?limit=12");
        const weekObjects = (weeksRes.items ?? []).map(toWeek);

        const cw = await apiFetch<CurrentWeekResponse>("/weeks/current");
        const currentWeek = toWeek(cw);

        const found = weekObjects.find(
          (w) => w.isoWeekId === currentWeek.isoWeekId
        );
        const selected = found ?? weekObjects[0] ?? currentWeek;

        setWeeks(weekObjects.length ? weekObjects : [currentWeek]);
        setSelectedWeek(selected);
      } finally {
        setIsLoading(false);
      }
    };

    boot();
  }, [userEmail]);

  // Load CEO dashboard data whenever week changes
  useEffect(() => {
    const loadData = async () => {
      if (!userEmail) return;
      if (!selectedWeek?.isoWeekId) return;

      setIsLoading(true);
      try {
        const weekId = selectedWeek.isoWeekId;

        const [leadersRes, reportsRes, companyRes] = await Promise.all([
          apiFetch<LeadersListResponse>("/users?role=team_leader"),
          apiFetch<ReportsListResponse>(
            `/reports?week_id=${encodeURIComponent(
              weekId
            )}&report_type=leader`
          ),
          apiFetch<CompanyLevelOKRsResponse>(
            `/okrs/company/level-progress?week_id=${encodeURIComponent(weekId)}`
          ),
        ]);

        const leaders = leadersRes.items ?? [];
        const reports = reportsRes.items ?? [];

        setCompanyOKRs(companyRes.items ?? []);

        const reportByLeaderId = new Map<string, ReportsListItem>();
        for (const r of reports) reportByLeaderId.set(r.submitter.id, r);

        const rows = leaders.map((l) => {
          const rep = reportByLeaderId.get(l.id);
          return {
            id: l.id,
            name: l.name,
            teamName: l.team?.name ?? "—",
            status: toDashboardStatus(rep?.status),
            submittedAt: rep?.submitted_at ?? null,
          };
        });

        const submittedCount = rows.filter(
          (x) => x.status === "submitted"
        ).length;
        const totalCount = rows.length;
        const notSubmittedCount = totalCount - submittedCount;

        setData({
          kpi: { submittedCount, notSubmittedCount, totalCount },
          leaders: rows,
        });
      } catch (err) {
        console.error("Failed to load CEO dashboard:", err);
        setCompanyOKRs([]);
        setData({
          kpi: { submittedCount: 0, notSubmittedCount: 0, totalCount: 0 },
          leaders: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedWeek?.isoWeekId, userEmail]);

  const handleViewReport = (leaderId: string) => {
    if (!selectedWeek?.isoWeekId) return;
    navigate(`/ceo/reports/${selectedWeek.isoWeekId}/${leaderId}`);
  };

  const headerBadge = useMemo(() => {
    const submitted = data?.kpi.submittedCount ?? 0;
    const total = data?.kpi.totalCount ?? 0;
    const pct = total ? Math.round((submitted / total) * 100) : 0;
    return { pct, submitted, total };
  }, [data?.kpi.submittedCount, data?.kpi.totalCount]);

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
            <h1 className="text-2xl font-bold">CEO Dashboard</h1>

            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-card/40 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {headerBadge.pct}% submitted ({headerBadge.submitted}/
              {headerBadge.total})
            </div>
          </div>

          <p className="text-muted-foreground">
            Overview of team leader submissions
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <WeekSelector
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </motion.div>
      </div>

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
            subtitle="Leaders submitted"
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
            subtitle="Pending reports"
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
            title="Total Leaders"
            value={data?.kpi.totalCount || 0}
            subtitle="Team leaders"
            icon={Users}
            className="transition hover:shadow-md hover:ring-1 hover:ring-primary/20"
          />
        </motion.div>
      </motion.div>

      {/* Company-level OKRs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Company-level OKRs</h2>
            <p className="text-sm text-muted-foreground">
              Progress and child objectives by team
            </p>
          </div>
        </div>

        {sortedCompanyOKRs.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-card/35 p-4 shadow-sm backdrop-blur-md">
            <p className="text-sm text-muted-foreground">
              No company-level OKRs found for the selected period.
            </p>
          </div>
        ) : (
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid gap-4 md:grid-cols-2 items-stretch"
          >
            {sortedCompanyOKRs.map((okr) => (
              <motion.div
                key={okr.id}
                ref={(node) => {
                  okrCardRefs.current[okr.id] = node;
                }}
                variants={item}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.995 }}
                transition={{ type: "spring", stiffness: 240, damping: 20 }}
                className="h-full"
              >
                <ProgressCard progress={okr.progress} className="h-full">
                  <div className="p-4 h-full flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Company OKR
                        </div>
                        <div className="mt-1 text-base font-semibold truncate">
                          {okr.title}
                        </div>
                      </div>

                      <ProgressRing value={okr.progress} />
                    </div>

                    <div className="mt-4 flex-1 min-h-0">
                      {/* clickable header */}
                      <button
                        type="button"
                        onClick={() => toggleExpanded(okr.id)}
                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-background/20 px-3 py-2 text-left backdrop-blur-sm transition hover:bg-background/30"
                      >
                        <div className="text-sm font-medium">
                          Children
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({okr.children?.length ?? 0})
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          {expandedOkrId === okr.id ? "Collapse" : "Expand"}
                          {expandedOkrId === okr.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      </button>

                      {/* collapsible area (scrolls inside card, no layout break) */}
                      <AnimatePresence initial={false}>
                        {expandedOkrId === okr.id ? (
                          <motion.div
                            key="children"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: easeOut }}
                            className="mt-2 overflow-hidden"
                          >
                            <div className="max-h-[160px] overflow-y-auto pr-1">
                              {!okr.children || okr.children.length === 0 ? (
                                <p className="rounded-lg border border-white/10 bg-background/15 p-3 text-sm text-muted-foreground backdrop-blur-sm">
                                  No child objectives linked yet.
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {okr.children.map((c) => (
                                    <motion.div
                                      key={c.id}
                                      initial={{ opacity: 0, y: 6 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: 6 }}
                                      transition={{
                                        duration: 0.2,
                                        ease: easeOut,
                                      }}
                                      className="rounded-lg border border-white/10 bg-background/15 p-3 backdrop-blur-sm"
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold">
                                            {c.title}
                                          </div>

                                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            <span className="inline-flex items-center rounded-full border border-white/10 bg-background/20 px-2 py-0.5 backdrop-blur">
                                              Team:
                                              <span className="ml-1 font-medium text-foreground">
                                                {c.team_name ?? "Unassigned"}
                                              </span>
                                            </span>

                                            {typeof c.parent_weight ===
                                            "number" ? (
                                              <span className="inline-flex items-center rounded-full border border-white/10 bg-background/20 px-2 py-0.5 backdrop-blur">
                                                Weight:
                                                <span className="ml-1 font-medium text-foreground">
                                                  {c.parent_weight}
                                                </span>
                                              </span>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="shrink-0 text-right">
                                          <div className="text-xs font-semibold tabular-nums">
                                            {Math.round(clamp01(c.progress))}%
                                          </div>
                                          <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-muted/60">
                                            <motion.div
                                              className="h-2 rounded-full bg-primary"
                                              initial={{ width: 0 }}
                                              animate={{
                                                width: `${clamp01(
                                                  c.progress
                                                )}%`,
                                              }}
                                              transition={{
                                                duration: 0.5,
                                                ease: "easeOut",
                                              }}
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

                      {/* collapsed preview */}
                      {expandedOkrId !== okr.id && okr.children?.length ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Top child:{" "}
                          <span className="font-medium text-foreground">
                            {okr.children[0]?.title}
                          </span>{" "}
                          • {Math.round(clamp01(okr.children[0]?.progress))}%
                        </div>
                      ) : null}
                    </div>
                  </div>
                </ProgressCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Leaders table */}
      {data?.leaders.length === 0 ? (
        <EmptyState
          title="No team leaders found"
          description="There are no team leaders configured in the system."
        />
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
                <TableHead>Team</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              <AnimatePresence initial={false}>
                {data?.leaders.map((leader) => (
                  <motion.tr
                    key={leader.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2, ease: easeOut }}
                    className="border-b last:border-b-0 hover:bg-muted/40"
                  >
                    <TableCell className="font-medium">{leader.name}</TableCell>
                    <TableCell>{leader.teamName}</TableCell>
                    <TableCell>
                      <StatusPill status={leader.status} />
                    </TableCell>
                    <TableCell>
                      {leader.submittedAt
                        ? new Date(leader.submittedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {leader.status === "submitted" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(leader.id)}
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

