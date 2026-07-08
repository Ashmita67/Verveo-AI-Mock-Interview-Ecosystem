import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="app-surface p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-muted/70 text-primary">
        <Inbox className="h-8 w-8 text-primary" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight sm:text-xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel ? (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
