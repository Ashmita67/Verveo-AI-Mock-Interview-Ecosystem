import { LoaderCircle } from "lucide-react";

function Loader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export default Loader;
