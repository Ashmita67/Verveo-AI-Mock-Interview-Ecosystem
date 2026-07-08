import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

function ErrorState({ title = "Something went wrong", description = "Please try again in a moment.", actionLabel, onAction }) {
  return (
    <div className="app-surface p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          {actionLabel ? (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
