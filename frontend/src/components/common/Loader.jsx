import { LoaderCircle } from "lucide-react";
import Skeleton from "@/components/ui/Skeleton";

function Loader({ label = "Loading..." }) {
  return (
    <div className="app-surface flex min-h-[320px] flex-col justify-center gap-6 p-6">
      <div className="flex items-center gap-3 text-muted-foreground">
        <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export default Loader;
