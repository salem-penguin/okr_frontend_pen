import { cn } from "@/lib/utils";

interface PageBackdropProps {
  className?: string;
}

export function PageBackdrop({ className }: PageBackdropProps) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div className="backdrop-float absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="backdrop-float-slow absolute bottom-0 left-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="backdrop-float-slower absolute right-1/3 top-1/3 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
    </div>
  );
}
