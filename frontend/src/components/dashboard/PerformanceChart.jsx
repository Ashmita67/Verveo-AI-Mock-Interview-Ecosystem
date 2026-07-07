import { ResponsiveContainer, AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import EmptyState from "@/components/common/EmptyState";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

function PerformanceChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Your backend-synced score progression across sessions.</CardDescription>
        </div>
      </CardHeader>
      {data?.length ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -20, right: 8 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#scoreGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState title="No score progression yet" description="Finish a few sessions to populate the trend chart." />
      )}
    </Card>
  );
}

export default PerformanceChart;
