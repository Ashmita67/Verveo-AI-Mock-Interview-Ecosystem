import { AlertTriangle } from "lucide-react";

function ErrorMessage({ title = "Something went wrong", description = "Please try again in a moment." }) {
  return (
    <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-5 text-destructive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-destructive/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default ErrorMessage;
