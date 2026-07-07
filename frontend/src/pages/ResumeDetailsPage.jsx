import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getResume } from "@/services/resumeService";
import { buildResumeSummary, parseResumeSections } from "@/utils/resumeSections";

function SectionCard({ title, items, emptyMessage }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{emptyMessage}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${title}-${item}`} className="rounded-2xl border border-border bg-secondary/20 p-4 text-sm leading-6 text-foreground">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${title.toLowerCase()} extracted`} description="This resume does not expose any structured entries for this section yet." />
        )}
      </CardContent>
    </Card>
  );
}

function ResumeDetailsPage() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resume, setResume] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadResume() {
      try {
        setLoading(true);
        setError("");
        const data = await getResume(resumeId);
        if (!mounted) return;
        setResume(data);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "We couldn't load this resume.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadResume();

    return () => {
      mounted = false;
    };
  }, [resumeId]);

  const summary = useMemo(() => (resume ? buildResumeSummary(resume) : null), [resume]);
  const sections = useMemo(() => (resume ? parseResumeSections(resume.parsed_text || "") : null), [resume]);

  if (loading) {
    return <Loader label="Loading resume details..." />;
  }

  if (error) {
    return <ErrorMessage title="Resume details unavailable" description={error} />;
  }

  if (!summary || !sections) {
    return (
      <EmptyState
        title="Resume not found"
        description="The resume you requested may have been deleted."
        actionLabel="Back to Resumes"
        onAction={() => navigate("/resume")}
      />
    );
  }

  const uploadedAt = summary.uploadedAt ? format(new Date(summary.uploadedAt), "PPP") : "Recently";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resume details"
        title={summary.fileName}
        description="Structured resume information presented in clean backend-synced cards."
        badge="Details view"
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => navigate("/resume")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Resume Manager
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Resume Metadata</CardTitle>
                <CardDescription>Only the summary data needed for review.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">File Name</p>
                <p className="mt-2 font-semibold">{summary.fileName}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Upload Date</p>
                <p className="mt-2 font-semibold">{uploadedAt}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">ATS Score</p>
                <p className="mt-2 font-semibold">{summary.ats_score ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
                <div className="mt-2">
                  <Badge variant={summary.status === "Processed" ? "success" : "warning"}>{summary.status}</Badge>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total Skills Extracted</p>
                <p className="mt-2 text-2xl font-semibold">{summary.skillsCount}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Total Projects Extracted</p>
                <p className="mt-2 text-2xl font-semibold">{summary.projectsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <SectionCard
            title="Skills"
            items={sections.skills}
            emptyMessage="Core skills captured from the parsed resume."
          />
          <SectionCard
            title="Projects"
            items={sections.projects}
            emptyMessage="Projects and portfolio items extracted from the resume."
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Experience"
          items={sections.experience}
          emptyMessage="Employment history and work highlights."
        />
        <SectionCard
          title="Education"
          items={sections.education}
          emptyMessage="Academic history and credentials."
        />
      </div>
    </div>
  );
}

export default ResumeDetailsPage;
