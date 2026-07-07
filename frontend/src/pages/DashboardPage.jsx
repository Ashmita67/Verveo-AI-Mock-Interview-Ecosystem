import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FileText } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import PerformanceChart from "@/components/dashboard/PerformanceChart";
import StatCard from "@/components/dashboard/StatCard";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import InterviewForm from "@/components/interview/InterviewForm";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
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
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const settledResults = await Promise.allSettled([
          listResumes(),
          listInterviews(),
          getAnalyticsOverview(),
        ]);
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
      [...resumes].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))[0] ||
      null,
    [resumes],
  );

  const resumeSummary = useMemo(() => (latestResume ? buildResumeSummary(latestResume) : null), [latestResume]);

  const latestProgress = useMemo(
    () =>
      [...(overview?.score_progression ?? [])]
        .sort((a, b) => new Date(a.generated_at || 0) - new Date(b.generated_at || 0))
        .map((item) => ({
          name: format(new Date(item.generated_at), "MMM d"),
          score: item.score,
        })),
    [overview],
  );

  const bestScore = useMemo(
    () => Math.max(0, ...interviews.map((item) => item.overall_score ?? 0), ...(overview?.score_progression ?? []).map((item) => item.score ?? 0)),
    [interviews, overview],
  );

  const hasInterviewData = interviews.length > 0;
  const hasScoreData = latestProgress.length > 0 || interviews.some((item) => item.overall_score != null);
  const hasResumeData = Boolean(resumeSummary);

  const stats = [
    { label: "Total Interviews", value: interviews.length.toString(), change: hasInterviewData ? "Backend" : "No sessions" },
    {
      label: "Average Score",
      value: hasScoreData ? `${Math.round(overview?.average_score ?? 0)}%` : "—",
      change: hasScoreData ? "Live" : "No data",
    },
    {
      label: "Best Score",
      value: hasScoreData ? `${bestScore}%` : "—",
      change: hasScoreData ? "Peak" : "No data",
    },
    {
      label: "Resume ATS Score",
      value: hasResumeData && latestResume?.ats_score != null ? `${latestResume.ats_score}%` : "—",
      change: hasResumeData ? "Latest" : "No resume",
    },
  ];

  if (loading) {
    return <Loader label="Loading your Verveo dashboard..." />;
  }

  if (error) {
    return <ErrorMessage title="Dashboard unavailable" description={error} />;
  }

  const handleDeleteResume = async () => {
    if (!resumeSummary) return;
    try {
      await deleteResume(resumeSummary.id);
      toast.success("Resume deleted successfully.");
      setQuickViewOpen(false);
      setReloadToken((value) => value + 1);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "We couldn't delete the resume.");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Interview momentum at a glance"
        description="Track your readiness, review recent sessions, and keep every preparation loop moving forward."
        badge="Updated from backend"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile Card</CardTitle>
              <CardDescription>Your authenticated Verveo profile.</CardDescription>
            </div>
            <Badge variant="info">{user?.provider || "local"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="mt-1 text-lg font-semibold">{user?.name || "Signed-in user"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="mt-1 text-sm font-medium">{user?.email || "No email available"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={user?.is_verified ? "success" : "warning"}>{user?.is_verified ? "Verified" : "Pending verification"}</Badge>
            </div>
            <InterviewForm />
          </CardContent>
        </Card>

        <PerformanceChart data={latestProgress} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ActivityFeed sessions={interviews} />

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Resume Summary</CardTitle>
              <CardDescription>Compact backend-synced resume status.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {resumeSummary ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{resumeSummary.displayName}</p>
                      </div>
                      {resumeSummary.alias ? <p className="text-xs text-muted-foreground">{resumeSummary.fileName}</p> : null}
                      <p className="text-sm text-muted-foreground">
                        Uploaded {resumeSummary.uploadedAt ? format(new Date(resumeSummary.uploadedAt), "MMM d, yyyy") : "recently"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={resumeSummary.status === "Processed" ? "success" : "warning"}>{resumeSummary.status}</Badge>
                      <Badge variant="info">ATS {resumeSummary.ats_score ?? "—"}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Skills Extracted</p>
                    <p className="mt-2 text-2xl font-semibold">{resumeSummary.skillsCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Projects Extracted</p>
                    <p className="mt-2 text-2xl font-semibold">{resumeSummary.projectsCount}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Button variant="secondary" onClick={() => navigate("/resume")}>
                    Upload New Resume
                  </Button>
                  <Button variant="outline" onClick={() => setQuickViewOpen(true)}>
                    View Resume
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteResume}>
                    Delete Resume
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No resumes uploaded yet"
                description="Upload a PDF resume to unlock ATS scoring and a compact summary card."
                actionLabel="Upload New Resume"
                onAction={() => navigate("/resume")}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
        title="Resume Quick View"
        description="A compact view of your latest uploaded resume."
      >
        {resumeSummary ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{resumeSummary.fileName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uploaded {resumeSummary.uploadedAt ? format(new Date(resumeSummary.uploadedAt), "PPP") : "recently"}
                  </p>
                </div>
                <Badge variant={resumeSummary.status === "Processed" ? "success" : "warning"}>{resumeSummary.status}</Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">ATS Score</p>
                <p className="mt-1 text-2xl font-semibold">{resumeSummary.ats_score ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Skills / Projects</p>
                <p className="mt-1 text-2xl font-semibold">
                  {resumeSummary.skillsCount} / {resumeSummary.projectsCount}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <Button variant="secondary" onClick={() => setQuickViewOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setQuickViewOpen(false);
                  navigate(`/resume/${resumeSummary.id}`);
                }}
              >
                Open Resume Details
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

export default DashboardPage;
