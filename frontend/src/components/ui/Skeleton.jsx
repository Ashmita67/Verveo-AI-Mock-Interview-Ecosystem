import { cn } from "@/utils/cn";

function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-xl bg-muted/70", className)} aria-hidden="true" />;
}

export default Skeleton;
