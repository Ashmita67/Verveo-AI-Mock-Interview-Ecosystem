import { format } from "date-fns";
import EmptyState from "@/components/common/EmptyState";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function ActivityFeed({ sessions = [] }) {
  const recentSessions = [...sessions].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent Interviews</CardTitle>
          <CardDescription>Review your latest backend-synced practice sessions.</CardDescription>
        </div>
      </CardHeader>

      {recentSessions.length ? (
        <div className="grid gap-3">
          {recentSessions.slice(0, 5).map((session) => (
            <div key={session.id} className="flex flex-col gap-4 rounded-[24px] bg-muted/40 p-5 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-base font-semibold tracking-tight text-foreground">{session.title}</p>
                <p className="text-sm text-muted-foreground">
                  {session.domain} · {session.difficulty} · {session.type}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="info">{session.overall_score ?? "—"}</Badge>
                <span className="text-xs text-muted-foreground">
                  {session.created_at ? format(new Date(session.created_at), "MMM d, yyyy") : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No interviews yet"
          description="Start your first interview to populate the history table."
        />
      )}
    </Card>
  );
}

export default ActivityFeed;
