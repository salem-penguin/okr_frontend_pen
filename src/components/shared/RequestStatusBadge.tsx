import { cn } from "@/lib/utils";
import type { TeamRequestStatus } from "@/types";

const statusConfig: Record<TeamRequestStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400",
  },
  approved: {
    label: "Approved",
    className: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400",
  },
};

interface RequestStatusBadgeProps {
  status: TeamRequestStatus;
  className?: string;
}

export function RequestStatusBadge({ status, className }: RequestStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
