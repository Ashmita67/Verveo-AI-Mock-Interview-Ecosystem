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
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-secondary/60 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Difficulty</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentSessions.map((session) => (
                <tr key={session.id} className="bg-card">
                  <td className="px-4 py-3 font-medium">{session.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground">{session.difficulty}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{session.overall_score ?? "—"}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {session.created_at ? format(new Date(session.created_at), "MMM d, yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
