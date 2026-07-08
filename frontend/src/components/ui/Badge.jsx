import { cn } from "@/utils/cn";

function Badge({ className, children, variant = "default" }) {
  const variants = {
    default: "border border-border/70 bg-muted/60 text-foreground",
    success: "border border-emerald-500/15 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border border-amber-500/15 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    info: "border border-sky-500/15 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight", variants[variant], className)}>
      {children}
    </span>
  );
}

export default Badge;
