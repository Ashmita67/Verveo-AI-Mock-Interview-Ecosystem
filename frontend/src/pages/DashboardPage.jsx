import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, FileText, PlayCircle, PlusCircle, Sparkles } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import StatCard from "@/components/dashboard/StatCard";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { getAnalyticsOverview } from "@/services/analyticsService";
import { listInterviews } from "@/services/interviewService";
import { deleteResume, listResumes } from "@/services/resumeService";
import { buildResumeSummary } from "@/utils/resumeSections";

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resumes, setResumes] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [overview, setOverview] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const settledResults = await Promise.allSettled([listResumes(), listInterviews(), getAnalyticsOverview()]);
        const [resumesResult, interviewsResult, analyticsResult] = settledResults;

        if (!mounted) return;

        const nextResumes = resumesResult.status === "fulfilled" ? resumesResult.value : [];
        const nextInterviews = interviewsResult.status === "fulfilled" ? interviewsResult.value : [];
        const nextOverview = analyticsResult.status === "fulfilled" ? analyticsResult.value : null;

        setResumes([...nextResumes].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)));
        setInterviews([...nextInterviews].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)));
        setOverview(nextOverview);

        if ([resumesResult, interviewsResult, analyticsResult].some((result) => result.status === "rejected")) {
          toast.error("Some dashboard data could not be loaded.");
        }

        if ([resumesResult, interviewsResult, analyticsResult].every((result) => result.status === "rejected")) {
          setError("We couldn't load your dashboard data.");
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "We couldn't load your dashboard data.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [reloadToken]);

  const latestResume = useMemo(
    () =>
      [...resumes].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0] || null,
    [resumes],
  );

  const resumeSummary = useMemo(() => (latestResume ? buildResumeSummary(latestResume) : null), [latestResume]);

  const recentReports = useMemo(
    () =>
      [...interviews]
        .filter((item) => item.overall_score != null)
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
        .slice(0, 5),
    [interviews],
  );

  const bestScore = useMemo(
    () => Math.max(0, ...interviews.map((item) => item.overall_score ?? 0), ...(overview?.score_progression ?? []).map((item) => item.score ?? 0)),
    [interviews, overview],
  );

  const averageScore = Math.round(overview?.average_score ?? 0);
  const reportCount = recentReports.length;
  const hasInterviewData = interviews.length > 0;
  const hasScoreData = reportCount > 0 || (overview?.score_progression?.length ?? 0) > 0;

  const stats = [
    { label: "Total Interviews", value: interviews.length.toString(), change: hasInterviewData ? "Active" : "No sessions" },
    { label: "Average Score", value: hasScoreData ? `${averageScore}%` : "—", change: hasScoreData ? "Latest" : "No data" },
    { label: "Best Score", value: hasScoreData ? `${bestScore}%` : "—", change: hasScoreData ? "Peak" : "No data" },
    { label: "Recent Reports", value: reportCount.toString(), change: reportCount ? "Loaded" : "No reports" },
  ];

  if (loading) {
    return <Loader label="Loading your dashboard..." />;
  }

  if (error) {
    return <ErrorMessage title="Dashboard unavailable" description={error} />;
  }

  const handleDeleteResume = async () => {
    if (!resumeSummary) return;
    try {
      await deleteResume(resumeSummary.id);
      toast.success("Resume deleted successfully.");
      setReloadToken((value) => value + 1);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "We couldn't delete the resume.");
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-end md:justify-between md:p-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Welcome
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Welcome back, {user?.name || "there"}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Here is a clean snapshot of your interview activity, resume status, and the next actions that matter most.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/interviews/create")}>
              <PlayCircle className="h-4 w-4" />
              Start Interview
            </Button>
            <Button variant="outline" onClick={() => navigate("/resume")}>
              <FileText className="h-4 w-4" />
              Manage Resume
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Statistics</p>
            <p className="mt-1 text-sm text-muted-foreground">High-signal metrics pulled from your latest activity.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (
            <StatCard key={item.label} {...item} />
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Recent Interviews</p>
              <p className="mt-1 text-sm text-muted-foreground">Your latest practice sessions in a compact feed.</p>
            </div>
            <ActivityFeed sessions={interviews} />
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Recent Reports</p>
              <p className="mt-1 text-sm text-muted-foreground">Most recent scored sessions and report summaries.</p>
            </div>
            <Card>
              <CardContent className="space-y-3">
                {recentReports.length ? (
                  recentReports.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="flex w-full items-center justify-between gap-4 rounded-[20px] bg-muted/40 px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-muted/60"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">{report.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {report.domain} · {report.difficulty} · {report.created_at ? format(new Date(report.created_at), "MMM d, yyyy") : "—"}
                        </p>
                      </div>
                      <Badge variant="info">{report.overall_score}%</Badge>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No reports yet"
                    description="Complete an interview to surface the latest scored reports here."
                    actionLabel="Start Interview"
                    onAction={() => navigate("/interviews/create")}
                  />
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Resume Summary</p>
              <p className="mt-1 text-sm text-muted-foreground">The latest uploaded resume and its extraction state.</p>
            </div>
            <Card>
              <CardContent className="space-y-5">
                {resumeSummary ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/70">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-base font-semibold tracking-tight">{resumeSummary.displayName}</p>
                          <p className="text-sm text-muted-foreground">{resumeSummary.fileName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Uploaded {resumeSummary.uploadedAt ? format(new Date(resumeSummary.uploadedAt), "PPP") : "recently"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] bg-muted/50 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">ATS Score</p>
                        <p className="mt-2 text-2xl font-semibold">{resumeSummary.ats_score ?? "—"}</p>
                      </div>
                      <div className="rounded-[20px] bg-muted/50 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Status</p>
                        <p className="mt-2 text-2xl font-semibold">{resumeSummary.status}</p>
                      </div>
                      <div className="rounded-[20px] bg-muted/50 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Skills</p>
                        <p className="mt-2 text-2xl font-semibold">{resumeSummary.skillsCount}</p>
                      </div>
                      <div className="rounded-[20px] bg-muted/50 p-4">
                        <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Projects</p>
                        <p className="mt-2 text-2xl font-semibold">{resumeSummary.projectsCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => navigate(`/resume/${resumeSummary.id}`)}>
                        View Resume
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteResume}>
                        Delete Resume
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    title="No resume uploaded"
                    description="Upload a resume to see its summary and extraction counts."
                    actionLabel="Manage Resume"
                    onAction={() => navigate("/resume")}
                  />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Quick Actions</p>
              <p className="mt-1 text-sm text-muted-foreground">Shortcuts to the actions you use most often.</p>
            </div>
            <Card>
              <CardContent className="space-y-3">
                <Button className="w-full justify-between" onClick={() => navigate("/interviews/create")}>
                  <span className="inline-flex items-center gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Start new interview
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button className="w-full justify-between" variant="outline" onClick={() => navigate("/resume")}>
                  <span className="inline-flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Manage resumes
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  className="w-full justify-between"
                  variant="outline"
                  onClick={() => navigate(recentReports[0] ? `/reports/${recentReports[0].id}` : "/reports")}
                >
                  <span className="inline-flex items-center gap-2">
                    <Badge variant="info">Reports</Badge>
                    View recent reports
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
