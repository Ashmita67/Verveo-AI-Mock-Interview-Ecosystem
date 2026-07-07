import { cn } from "@/utils/cn";

function Card({ className, children }) {
  return (
    <div className={cn("rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm", className)}>
      {children}
    </div>
  );
}

function CardHeader({ className, children }) {
  return <div className={cn("mb-5 flex items-start justify-between gap-4", className)}>{children}</div>;
}

function CardTitle({ className, children }) {
  return <h3 className={cn("text-lg font-semibold", className)}>{children}</h3>;
}

function CardDescription({ className, children }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

function CardContent({ className, children }) {
  return <div className={cn(className)}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
