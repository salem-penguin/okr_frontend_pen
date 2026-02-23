import { useEffect, useMemo, useState } from "react";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "default" | "success" | "warning" | "muted";
  className?: string;

  /**
   * Optional micro-interactions toggles
   */
  animateValue?: boolean; // default true for numeric values
}

function isNumericValue(v: number | string) {
  if (typeof v === "number") return Number.isFinite(v);
  const n = Number(v);
  return Number.isFinite(n) && String(v).trim() !== "";
}

function formatAnimatedNumber(n: number) {
  // Keep it simple; customize if you want commas, etc.
  return Math.round(n).toString();
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  className,
  animateValue = true,
}: KPICardProps) {
  const variantStyles = {
    default: "bg-card",
    success: "bg-accent",
    warning: "bg-accent",
    muted: "bg-muted/30",
  } as const;

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    success: "bg-primary/20 text-primary",
    warning: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  } as const;

  // Border / glow color per variant
  const glowTint = useMemo(() => {
    if (variant === "warning") return "bg-destructive/15";
    if (variant === "success") return "bg-primary/15";
    if (variant === "muted") return "bg-muted/40";
    return "bg-primary/12";
  }, [variant]);

  const borderHover = useMemo(() => {
    if (variant === "warning") return "hover:border-destructive/30";
    if (variant === "success") return "hover:border-primary/30";
    if (variant === "muted") return "hover:border-border";
    return "hover:border-primary/25";
  }, [variant]);

  // Optional animated count-up
  const shouldAnimate = animateValue && isNumericValue(value);
  const target = typeof value === "number" ? value : Number(value);

  const [display, setDisplay] = useState<number>(shouldAnimate ? 0 : target);

  useEffect(() => {
    if (!shouldAnimate) return;

    const to = target;
    const from = 0;
    const duration = 650; // ms
    const start = performance.now();

    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [shouldAnimate, target]);

  const shownValue = shouldAnimate ? formatAnimatedNumber(display) : value;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      className="group"
    >
      <Card
        className={cn(
          "relative overflow-hidden border transition-colors",
          variantStyles[variant],
          borderHover,
          className
        )}
      >
        {/* Hover glow (radial) */}
        <div
          className={cn(
            "pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            glowTint
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
            glowTint
          )}
        />

        {/* subtle shine */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        </div>

        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>

              <motion.p
                className="text-3xl font-bold tracking-tight tabular-nums"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {shownValue}
              </motion.p>

              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>

            <motion.div
              className={cn("rounded-full p-3", iconStyles[variant])}
              whileHover={{ rotate: 6 }}
              transition={{ type: "spring", stiffness: 300, damping: 16 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
