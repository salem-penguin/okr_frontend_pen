import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import { apiFetch } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";

import {
  RefreshCw,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Target,
  GitBranch,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";

// --------------------
// Types
// --------------------
interface KR {
  id: string;
  title: string;
  status: "not_started" | "in_progress" | "completed";
  progress: number;
  weight: number;
}

interface Objective {
  id: string;
  title: string;
  progress: number;
  parent_id: string | null | undefined;
  parent_weight: number | null | undefined;
  key_results: KR[];
}

interface TeamBlock {
  team_id: string | null;
  team_name: string;
  objectives: Objective[];
}

interface QuarterInfo {
  quarter_id: string;
  start_date: string;
  end_date: string;
  seconds_remaining: number;
}

interface CurrentOKRsResponse {
  quarter: QuarterInfo;
  teams: TeamBlock[];
}

interface CompanyOKRChild {
  id: string;
  title: string;
  team_name: string | null;
  progress: number;
  parent_weight?: number;
}

interface CompanyLevelOKR {
  id: string;
  title: string;
  progress: number;
  children: CompanyOKRChild[];
}

// --------------------
// Tree data model
// --------------------
interface TreeNode {
  id: string;
  title: string;
  progress: number;
  type: "company" | "team_objective" | "key_result";
  teamName?: string;
  weight?: number;
  status?: "not_started" | "in_progress" | "completed";
  children: TreeNode[];
}

// --------------------
// Helpers
// --------------------
function safeArr<T>(x: T[] | undefined | null): T[] {
  return Array.isArray(x) ? x : [];
}

function clamp(x: number): number {
  return Math.min(100, Math.max(0, Math.round(Number(x || 0))));
}

function formatDuration(seconds: number): string {
  const s = Math.max(0, seconds);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "..." : str;
}

function buildTree(
  companyOKRs: CompanyLevelOKR[],
  teams: TeamBlock[]
): TreeNode[] {
  const objectiveMap = new Map<string, Objective & { teamName: string }>();
  for (const team of safeArr(teams)) {
    for (const obj of safeArr(team.objectives)) {
      objectiveMap.set(obj.id, { ...obj, teamName: team.team_name });
    }
  }

  return safeArr(companyOKRs).map((co) => {
    const children: TreeNode[] = safeArr(co.children).map((child) => {
      const fullObj = objectiveMap.get(child.id);
      const krChildren: TreeNode[] = fullObj
        ? safeArr(fullObj.key_results).map((kr) => ({
            id: kr.id,
            title: kr.title,
            progress: clamp(kr.progress),
            type: "key_result" as const,
            status: kr.status,
            weight: kr.weight,
            children: [],
          }))
        : [];

      return {
        id: child.id,
        title: child.title,
        progress: clamp(child.progress),
        type: "team_objective" as const,
        teamName: child.team_name ?? fullObj?.teamName ?? "Unknown",
        weight: child.parent_weight,
        children: krChildren,
      };
    });

    return {
      id: co.id,
      title: co.title,
      progress: clamp(co.progress),
      type: "company" as const,
      children,
    };
  });
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const filtered: TreeNode[] = [];
  for (const n of nodes) {
    const selfMatch =
      n.title.toLowerCase().includes(q) ||
      (n.teamName ?? "").toLowerCase().includes(q);
    const childFiltered = filterTree(n.children, q);
    if (selfMatch || childFiltered.length > 0) {
      filtered.push({ ...n, children: selfMatch ? n.children : childFiltered });
    }
  }
  return filtered;
}

// --------------------
// Layout engine -- compute (x, y) for each node in a top-down tree
// --------------------
const NODE_W = 220;
const NODE_H_COMPANY = 80;
const NODE_H_TEAM = 72;
const NODE_H_KR = 56;
const H_GAP = 40;
const V_GAP = 60;

interface LayoutNode {
  node: TreeNode;
  x: number;
  y: number;
  w: number;
  h: number;
  children: LayoutNode[];
}

function nodeHeight(type: TreeNode["type"]): number {
  if (type === "company") return NODE_H_COMPANY;
  if (type === "team_objective") return NODE_H_TEAM;
  return NODE_H_KR;
}

function layoutTree(nodes: TreeNode[], startX: number, startY: number): { layout: LayoutNode[]; totalW: number; totalH: number } {
  if (nodes.length === 0) return { layout: [], totalW: 0, totalH: 0 };

  const layouts: LayoutNode[] = [];
  let cursor = startX;
  let maxH = 0;

  for (const node of nodes) {
    const h = nodeHeight(node.type);
    const childY = startY + h + V_GAP;

    if (node.children.length === 0) {
      const lNode: LayoutNode = {
        node,
        x: cursor,
        y: startY,
        w: NODE_W,
        h,
        children: [],
      };
      layouts.push(lNode);
      cursor += NODE_W + H_GAP;
      maxH = Math.max(maxH, startY + h);
    } else {
      const { layout: childLayouts, totalW: childTotalW, totalH: childMaxH } = layoutTree(
        node.children,
        cursor,
        childY
      );

      const subtreeW = Math.max(childTotalW, NODE_W);
      const nodeX = cursor + (subtreeW - NODE_W) / 2;

      const lNode: LayoutNode = {
        node,
        x: nodeX,
        y: startY,
        w: NODE_W,
        h,
        children: childLayouts,
      };
      layouts.push(lNode);
      cursor += subtreeW + H_GAP;
      maxH = Math.max(maxH, childMaxH);
    }
  }

  const totalW = cursor - startX - H_GAP;
  return { layout: layouts, totalW: Math.max(totalW, 0), totalH: maxH };
}

// --------------------
// SVG connector lines
// --------------------
function ConnectorLines({ parent, children }: { parent: LayoutNode; children: LayoutNode[] }) {
  if (children.length === 0) return null;

  const parentCx = parent.x + parent.w / 2;
  const parentBottom = parent.y + parent.h;

  return (
    <>
      {children.map((child) => {
        const childCx = child.x + child.w / 2;
        const childTop = child.y;
        const midY = parentBottom + (childTop - parentBottom) / 2;

        const d = `M ${parentCx} ${parentBottom} C ${parentCx} ${midY}, ${childCx} ${midY}, ${childCx} ${childTop}`;

        return (
          <path
            key={`${parent.node.id}-${child.node.id}`}
            d={d}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={2}
            strokeDasharray={child.node.type === "key_result" ? "4 4" : undefined}
          />
        );
      })}
    </>
  );
}

// --------------------
// Progress ring (small, for node cards)
// --------------------
function MiniRing({ value, size = 32 }: { value: number; size?: number }) {
  const v = clamp(value);
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (v / 100) * circumference;

  const color = v >= 70 ? "#22c55e" : v >= 30 ? "#f59e0b" : "#ef4444";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        className="stroke-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        stroke={color}
      />
    </svg>
  );
}

// --------------------
// Rendered node card (foreignObject inside SVG)
// --------------------
function NodeCard({ ln }: { ln: LayoutNode }) {
  const n = ln.node;
  const v = clamp(n.progress);

  const borderColor =
    n.type === "company"
      ? "border-primary/40"
      : n.type === "team_objective"
      ? "border-blue-500/30"
      : v >= 100
      ? "border-emerald-500/30"
      : "border-border/60";

  const bgColor =
    n.type === "company"
      ? "bg-primary/5 dark:bg-primary/10"
      : n.type === "team_objective"
      ? "bg-blue-500/5 dark:bg-blue-500/10"
      : "bg-card/80";

  const icon =
    n.type === "company" ? (
      <Target className="h-4 w-4 text-primary shrink-0" />
    ) : n.type === "team_objective" ? (
      <GitBranch className="h-4 w-4 text-blue-500 shrink-0" />
    ) : n.status === "completed" ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
    ) : n.status === "in_progress" ? (
      <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
    );

  return (
    <foreignObject x={ln.x} y={ln.y} width={ln.w} height={ln.h}>
      <div
        className={`
          h-full rounded-xl border-2 ${borderColor} ${bgColor}
          backdrop-blur-sm shadow-md
          flex flex-col justify-center px-3 py-2
          transition-shadow hover:shadow-lg cursor-default
        `}
      >
        <div className="flex items-start gap-2">
          <div className="mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <div
              className={`font-semibold leading-tight ${
                n.type === "key_result" ? "text-[11px]" : "text-xs"
              }`}
              title={n.title}
            >
              {truncate(n.title, n.type === "key_result" ? 35 : 30)}
            </div>
            {n.teamName && n.type === "team_objective" && (
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                {n.teamName}
              </div>
            )}
          </div>
          <div className="relative flex items-center justify-center shrink-0" style={{ width: 32, height: 32 }}>
            <MiniRing value={v} />
            <span className="absolute text-[8px] font-bold text-foreground">{v}%</span>
          </div>
        </div>

        {n.type !== "key_result" && (
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${v}%`,
                backgroundColor: v >= 70 ? "#22c55e" : v >= 30 ? "#f59e0b" : "#ef4444",
              }}
            />
          </div>
        )}
      </div>
    </foreignObject>
  );
}

// --------------------
// Recursive render: draw connectors + nodes
// --------------------
function RenderLayout({ layouts }: { layouts: LayoutNode[] }) {
  return (
    <>
      {layouts.map((ln) => (
        <React.Fragment key={ln.node.id}>
          <ConnectorLines parent={ln} children={ln.children} />
          <RenderLayout layouts={ln.children} />
        </React.Fragment>
      ))}
      {layouts.map((ln) => (
        <NodeCard key={`card-${ln.node.id}`} ln={ln} />
      ))}
    </>
  );
}

// --------------------
// Pan & zoom canvas
// --------------------
function TreeCanvas({
  tree,
  canvasW,
  canvasH,
}: {
  tree: LayoutNode[];
  canvasW: number;
  canvasH: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const zoomIn = () => setScale((s) => Math.min(2, s + 0.15));
  const zoomOut = () => setScale((s) => Math.max(0.2, s - 0.15));
  const fitToView = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    if (canvasW === 0 || canvasH === 0) return;
    const padding = 60;
    const sx = (cw - padding) / canvasW;
    const sy = (ch - padding) / canvasH;
    const s = Math.min(sx, sy, 1);
    setScale(s);
    setTranslate({
      x: (cw - canvasW * s) / 2,
      y: padding / 2,
    });
  }, [canvasW, canvasH]);

  useLayoutEffect(() => {
    fitToView();
  }, [fitToView]);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setScale((s) => Math.max(0.2, Math.min(2, s + delta)));
      } else {
        setTranslate((t) => ({
          x: t.x - e.deltaX,
          y: t.y - e.deltaY,
        }));
      }
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [translate]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setTranslate({ x: dragStart.current.tx + dx, y: dragStart.current.ty + dy });
    },
    [dragging]
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  const svgW = canvasW + 80;
  const svgH = canvasH + 80;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 right-3 z-10 flex gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={zoomOut} title="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={fitToView} title="Fit to view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-10 text-[10px] text-muted-foreground bg-card/80 backdrop-blur rounded px-2 py-1 border border-border/40">
        {Math.round(scale * 100)}% &middot; Scroll to pan &middot; Ctrl+scroll to zoom &middot; Drag to pan
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "none" }}
      >
        <svg
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <RenderLayout layouts={tree} />
        </svg>
      </div>
    </div>
  );
}

// --------------------
// Main page component
// --------------------
export default function OKRTreeView() {
  const { user } = useAuth();
  const isCEO = user?.role === "ceo";

  const [data, setData] = useState<CurrentOKRsResponse | null>(null);
  const [companyLevelProgress, setCompanyLevelProgress] = useState<CompanyLevelOKR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const res = (await apiFetch("/okrs/company/current")) as Record<string, unknown>;

      const rawTeams: TeamBlock[] = safeArr(res.teams as TeamBlock[] | null);
      const normalizedTeams: TeamBlock[] = rawTeams.map((t) => ({
        ...t,
        objectives: safeArr(t.objectives).map((o) => {
          const oAny = o as unknown as Record<string, unknown>;
          return {
            ...o,
            parent_id: (oAny.parent_id ?? oAny.parent_company_level_objective_id ?? null) as string | null,
            parent_weight: Number(oAny.parent_weight ?? 0),
            key_results: safeArr(o.key_results).map((kr) => {
              const krAny = kr as unknown as Record<string, unknown>;
              return {
                id: String(krAny.id ?? krAny.kr_id ?? "").trim(),
                title: String(krAny.title ?? ""),
                status: (krAny.status as KR["status"]) ?? "not_started",
                progress: Number(krAny.progress ?? 0),
                weight: Number(krAny.weight ?? 1),
              };
            }),
          };
        }),
      }));

      setData({ quarter: res.quarter as QuarterInfo, teams: normalizedTeams });

      try {
        const cw = (await apiFetch("/weeks/current")) as { week_id: string };
        const lvl = (await apiFetch(
          `/okrs/company/level-progress?week_id=${encodeURIComponent(cw.week_id)}`
        )) as { items: CompanyLevelOKR[] };
        setCompanyLevelProgress(safeArr(lvl.items));
      } catch {
        setCompanyLevelProgress([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load OKR data");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rawTree = useMemo(
    () => buildTree(companyLevelProgress, data?.teams ?? []),
    [companyLevelProgress, data?.teams]
  );

  const lowerQuery = query.trim().toLowerCase();
  const filteredTree = useMemo(() => filterTree(rawTree, lowerQuery), [rawTree, lowerQuery]);

  const { layout, totalW, totalH } = useMemo(
    () => layoutTree(filteredTree, 40, 40),
    [filteredTree]
  );

  // Guards
  if (!isCEO) {
    return (
      <div className="app-page-enter">
        <EmptyState title="Access Denied" description="This page is available for CEO only." />
      </div>
    );
  }

  if (isLoading) return <LoadingState message="Loading OKR Tree..." />;

  if (!data) {
    return (
      <div className="app-page-enter">
        <EmptyState title="No data" description="Unable to load OKR data." actionLabel="Retry" onAction={load} />
      </div>
    );
  }

  return (
    <div className="app-page-enter relative flex flex-col h-[calc(100vh-4rem)]">
      {/* Background accents */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">OKR Tree</h1>
          <span className="inline-flex items-center rounded-full border border-border/60 bg-card/60 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
            {data.quarter.quarter_id}
          </span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {data.quarter.start_date} &rarr; {data.quarter.end_date} &middot;{" "}
            <span className="font-medium">{formatDuration(data.quarter.seconds_remaining)}</span> left
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 w-56 pl-8 text-sm"
              placeholder="Filter..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={load} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-1 pb-3 text-[11px] text-muted-foreground shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-primary/60 bg-primary/10" />
          Company Objective
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-blue-500/60 bg-blue-500/10" />
          Team Objective
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-border/60 bg-card/80" />
          Key Result
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <div className="h-2 w-4 rounded-full bg-emerald-500" /> &ge;70%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full bg-amber-500" /> 30-69%
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-4 rounded-full bg-red-500" /> &lt;30%
        </div>
      </div>

      {/* Tree canvas */}
      <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card/30 backdrop-blur-sm overflow-hidden relative">
        {filteredTree.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              title="No OKRs found"
              description={query ? "No objectives match your search." : "No company-level OKRs found for this quarter."}
            />
          </div>
        ) : (
          <TreeCanvas tree={layout} canvasW={totalW + 80} canvasH={totalH + 80} />
        )}
      </div>
    </div>
  );
}
