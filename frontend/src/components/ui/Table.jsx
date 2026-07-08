import { cn } from "@/utils/cn";

function Table({ className, children }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border/60 bg-card/90 shadow-sm">
      <table className={cn("min-w-full border-separate border-spacing-0 text-left text-sm", className)}>{children}</table>
    </div>
  );
}

function TableHead({ className, children }) {
  return (
    <thead className={cn("bg-muted/40 text-muted-foreground", className)}>
      {children}
    </thead>
  );
}

function TableBody({ className, children }) {
  return <tbody className={cn("divide-y divide-border/60", className)}>{children}</tbody>;
}

function TableRow({ className, children }) {
  return <tr className={cn("transition-colors hover:bg-muted/30", className)}>{children}</tr>;
}

function TableHeadCell({ className, children }) {
  return <th className={cn("px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em]", className)}>{children}</th>;
}

function TableCell({ className, children }) {
  return <td className={cn("px-4 py-4 align-middle text-sm", className)}>{children}</td>;
}

export { Table, TableHead, TableBody, TableRow, TableHeadCell, TableCell };
