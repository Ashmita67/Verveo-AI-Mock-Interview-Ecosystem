import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const TextArea = forwardRef(function TextArea({ className, label, error, ...props }, ref) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium text-foreground">{label}</span> : null}
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
          error && "border-destructive focus:border-destructive focus:ring-destructive/20",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </label>
  );
});

export default TextArea;
