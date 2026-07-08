import { cva } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(14,165,233,0.18)] hover:-translate-y-0.5 hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:-translate-y-0.5",
        outline: "border border-border/70 bg-transparent hover:border-border hover:bg-secondary/70",
        ghost: "hover:bg-muted/80 hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:opacity-95",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

function Button({ className, variant, size, isLoading, children, ...props }) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export { Button, buttonVariants };
