import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const TextArea = forwardRef(function TextArea({ className, label, error, ...props }, ref) {
  return (
    <label className="block space-y-2">
      {label ? <span className="text-sm font-medium tracking-tight text-foreground">{label}</span> : null}
      <textarea
        ref={ref}
        className={cn(
          "min-h-28 w-full rounded-xl border border-input/80 bg-card/80 px-4 py-3 text-sm outline-none transition duration-200 placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10",
          error && "border-destructive focus:border-destructive focus:ring-destructive/10",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </label>
  );
});

export default TextArea;
