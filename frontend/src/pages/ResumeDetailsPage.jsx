import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { getResume } from "@/services/resumeService";
import { buildResumeSummary, parseResumeSections } from "@/utils/resumeSections";

function SectionCard({ title, description, items }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={`${title}-${item}`} className="rounded-[20px] bg-muted/50 p-4 text-sm leading-6 text-foreground">
                {item}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title={`No ${title.toLowerCase()} found`} description="This resume does not expose any structured entries for this section yet." />
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

  const sectionOrder = [
    {
      key: "skills",
      title: "Skills",
      description: "Core technical and role-specific skills extracted from the resume.",
    },
    {
      key: "projects",
      title: "Projects",
      description: "Portfolio and project highlights captured during parsing.",
    },
    {
      key: "experience",
      title: "Experience",
      description: "Work history and role descriptions from the resume.",
    },
    {
      key: "education",
      title: "Education",
      description: "Academic history and credentials.",
    },
    {
      key: "certifications",
      title: "Certifications",
      description: "Certifications, licenses, and other formal credentials.",
    },
    {
      key: "achievements",
      title: "Achievements",
      description: "Awards, accomplishments, and standout milestones.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Resume details
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{summary.fileName}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Structured resume information presented as a vertical reading flow with clear section cards.
            </p>
          </div>
        </div>

        <Button variant="outline" onClick={() => navigate("/resume")}>
          <ArrowLeft className="h-4 w-4" />
          Back to Resume Manager
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/70">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Resume Overview</CardTitle>
              <CardDescription>Summary data extracted from the latest uploaded resume.</CardDescription>
            </div>
          </div>
          <Badge variant={summary.status === "Processed" ? "success" : "warning"}>{summary.status}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">File Name</p>
            <p className="mt-2 font-semibold">{summary.fileName}</p>
            {summary.alias ? <p className="mt-1 text-xs text-muted-foreground">{summary.displayName}</p> : null}
          </div>
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Upload Date</p>
            <p className="mt-2 font-semibold">{uploadedAt}</p>
          </div>
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">ATS Score</p>
            <p className="mt-2 font-semibold">{summary.ats_score ?? "—"}</p>
          </div>
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Skills</p>
            <p className="mt-2 text-2xl font-semibold">{summary.skillsCount}</p>
          </div>
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Projects</p>
            <p className="mt-2 text-2xl font-semibold">{summary.projectsCount}</p>
          </div>
          <div className="rounded-[20px] bg-muted/50 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Achievements</p>
            <p className="mt-2 text-2xl font-semibold">{summary.achievementCount}</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {sectionOrder.map((section) => (
          <SectionCard
            key={section.key}
            title={section.title}
            description={section.description}
            items={sections[section.key] || []}
          />
        ))}
      </div>
    </div>
  );
}

export default ResumeDetailsPage;
