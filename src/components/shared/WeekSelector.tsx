import { useMemo } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';
import { Week } from '@/types';
import { getWeeks } from '@/lib/week-utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface WeekSelectorProps {
  weeks?: Week[];
  selectedWeek: Week;
  onWeekChange: (week: Week) => void;
  weeksToShow?: number;
  className?: string;
}

export function WeekSelector({
  weeks: propWeeks,
  selectedWeek,
  onWeekChange,
  weeksToShow = 8,
  className,
}: WeekSelectorProps) {
  // Use provided weeks or generate default weeks
  const weeks = useMemo(() => {
    return propWeeks || getWeeks(weeksToShow);
  }, [propWeeks, weeksToShow]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('min-w-[280px] justify-between', className)}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{selectedWeek.displayLabel}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[280px]">
        {weeks.map(week => (
          <DropdownMenuItem
            key={week.isoWeekId}
            onClick={() => onWeekChange(week)}
            className={cn(
              week.isoWeekId === selectedWeek.isoWeekId && 'bg-accent'
            )}
          >
            {week.displayLabel}
            {week.isoWeekId === weeks[0]?.isoWeekId && (
              <span className="ml-auto text-xs text-muted-foreground">
                Current
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
