import { Clock3, Sparkles, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import SessionPanel from "@/components/interview/SessionPanel";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

function InterviewSessionPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Live Session"
        title="Interview room"
        description="Run text, audio, or video practice sessions with backend-synced state, scoring, and saved progress."
        badge="Backend synced"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Session state</p>
                <p className="mt-1 font-semibold">Saved automatically</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-accent/15 p-3 text-accent-foreground">
                <Clock3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timing</p>
                <p className="mt-1 font-semibold">Per-question pacing enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Safety</p>
                <p className="mt-1 font-semibold">Protected by auth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="font-semibold">Need to start a session?</p>
            <p className="text-sm text-muted-foreground">
              Open the interview builder, choose text or resume-based mode, and the session will load here automatically.
            </p>
          </div>
          <Badge variant="info">Supports text, audio, and video</Badge>
        </CardContent>
      </Card>

      <SessionPanel />
    </div>
  );
}

export default InterviewSessionPage;
