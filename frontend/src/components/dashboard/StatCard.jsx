import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function StatCard({ label, value, change }) {
  return (
    <Card className="p-6">
      <CardContent className="space-y-5">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="text-4xl font-semibold tracking-tight">{value}</h3>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          <TrendingUp className="h-3.5 w-3.5" />
          {change}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
