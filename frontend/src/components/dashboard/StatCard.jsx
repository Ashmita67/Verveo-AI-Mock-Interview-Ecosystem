import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

function StatCard({ label, value, change }) {
  return (
    <Card className="p-5">
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <h3 className="text-3xl font-semibold">{value}</h3>
          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <TrendingUp className="h-3.5 w-3.5" />
            {change}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
