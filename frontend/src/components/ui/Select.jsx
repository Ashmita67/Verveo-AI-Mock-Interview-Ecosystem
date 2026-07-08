import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";

const Select = forwardRef(function Select({ className, label, error, children, ...props }, ref) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium tracking-tight text-foreground">{label}</span> : null}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-input/80 bg-card/80 px-4 pr-10 text-sm outline-none transition duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10",
            error && "border-destructive focus:border-destructive focus:ring-destructive/10",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </label>
  );
});

export default Select;
