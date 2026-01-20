import { cn } from '@/lib/utils';
import { ReportStatus } from '@/types';

interface StatusPillProps {
  status: ReportStatus | 'not_submitted';
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  const statusConfig = {
    submitted: {
      label: 'Submitted',
      className: 'bg-primary/10 text-primary border-primary/20',
    },
    draft: {
      label: 'Draft',
      className: 'bg-accent text-accent-foreground border-accent-foreground/20',
    },
    not_submitted: {
      label: 'Not Submitted',
      className: 'bg-muted/50 text-muted-foreground border-border',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
