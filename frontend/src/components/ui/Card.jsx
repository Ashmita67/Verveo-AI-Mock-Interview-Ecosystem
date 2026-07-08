import { cn } from "@/utils/cn";

function Card({ className, children }) {
  return (
    <div className={cn("rounded-[24px] border border-border/60 bg-card/90 p-5 text-card-foreground shadow-sm backdrop-blur-xl sm:p-6", className)}>
      {children}
    </div>
  );
}

function CardHeader({ className, children }) {
  return <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>{children}</div>;
}

function CardTitle({ className, children }) {
  return <h3 className={cn("text-base font-semibold tracking-tight text-foreground sm:text-lg", className)}>{children}</h3>;
}

function CardDescription({ className, children }) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)}>{children}</p>;
}

function CardContent({ className, children }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
