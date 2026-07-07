import { cn } from "@/utils/cn";

function Badge({ className, children, variant = "default" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
    info: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}

export default Badge;
