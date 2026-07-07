import { cn } from "@/utils/cn";

function ProgressBar({ value, className }) {
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default ProgressBar;
