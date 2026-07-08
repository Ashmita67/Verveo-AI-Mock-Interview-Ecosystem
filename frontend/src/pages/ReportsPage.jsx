import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import { generateReport, getReport } from "@/services/reportService";
import { getInterview, listInterviews } from "@/services/interviewService";

function splitTextList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .replace(/^\[|\]$/g, "")
    .split(/[\n,]/)
    .map((item) => item.replace(/^"|"$/g, "").trim())
    .filter(Boolean);
}

function parseFeedback(value) {
  if (!value) {
    return { strengths: [], weaknesses: [], missing_concepts: [] };
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return { strengths: [], weaknesses: [], missing_concepts: [], raw: value };
    }
  }

  return value;
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return format(new Date(value), "MMM d, yyyy • h:mm a");
  } catch {
    return "—";
  }
}

function ReportsPage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const interviewIdParam = searchParams.get("interviewId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedInterviewId, setSelectedInterviewId] = useState(params.id || interviewIdParam || "");
  const [interviewDetail, setInterviewDetail] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function resolveInterviewId() {
      const routeInterviewId = params.id || interviewIdParam;
      if (routeInterviewId) {
        setSelectedInterviewId(routeInterviewId);
        return;
      }

      try {
        setLoading(true);
        const interviews = await listInterviews();
        if (!mounted) return;
        const latestInterview = [...interviews].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
        if (latestInterview?.id) {
          setSelectedInterviewId(latestInterview.id);
          return;
        }
        setSelectedInterviewId("");
        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "We couldn't load the report history.");
          setLoading(false);
        }
      }
    }

    resolveInterviewId();

    return () => {
      mounted = false;
    };
  }, [params.id, interviewIdParam]);

  useEffect(() => {
    if (!selectedInterviewId) {
      setInterviewDetail(null);
      setReport(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadReport() {
      try {
        setLoading(true);
        setReportLoading(true);
        setError("");
        const [detailResult, reportResult] = await Promise.allSettled([getInterview(selectedInterviewId), getReport(selectedInterviewId)]);

        if (!mounted) return;

        setInterviewDetail(detailResult.status === "fulfilled" ? detailResult.value : null);
        setReport(reportResult.status === "fulfilled" ? reportResult.value : null);
        if (detailResult.status === "rejected" && reportResult.status === "rejected") {
          setError("Unable to load this interview report.");
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "Unable to load report details.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setReportLoading(false);
        }
      }
    }

    loadReport();

    return () => {
      mounted = false;
    };
  }, [selectedInterviewId]);

  const resume = interviewDetail?.resume || null;
  const overallScore = report?.overall_score ?? interviewDetail?.overall_score ?? null;
  const skillBreakdown = useMemo(
    () => [
      { label: "Technical", value: report?.technical_score },
      { label: "Communication", value: report?.communication_score },
      { label: "Problem Solving", value: report?.problem_solving_score },
    ],
    [report],
  );

  const questionReview = useMemo(() => {
    const questions = interviewDetail?.questions || [];
    const responses = interviewDetail?.responses || [];

    return questions.map((question) => {
      const response = responses.find((item) => item.question_id === question.id) || null;
      const feedback = parseFeedback(response?.feedback);
      return {
        question,
        response,
        feedback,
      };
    });
  }, [interviewDetail]);

  const strengths = splitTextList(report?.strengths);
  const weaknesses = splitTextList(report?.weaknesses);
  const recommendations = splitTextList(report?.recommendations);

  const handleGenerateReport = async () => {
    if (!selectedInterviewId) return;
    try {
      setReportLoading(true);
      const generated = await generateReport(selectedInterviewId);
      setReport(generated);
      toast.success("Report generated successfully.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not generate the report.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading && !interviewDetail && !report) {
    return <Loader label="Loading report..." />;
  }

  if (error && !interviewDetail && !report) {
    return <ErrorMessage title="Report unavailable" description={error} />;
  }

  if (!selectedInterviewId) {
    return (
      <EmptyState
        title="No interview available"
        description="Complete an interview to generate a professional report."
        actionLabel="Start Interview"
        onAction={() => navigate("/interviews/create")}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-border/60 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)] lg:p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Interview Report
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{interviewDetail?.title || "Assessment Report"}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                A focused summary of performance, feedback, and next steps for this session.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">{interviewDetail?.domain || "—"}</Badge>
              <Badge variant="default">{interviewDetail?.difficulty || "—"}</Badge>
              <Badge variant="default">{interviewDetail?.type || "—"}</Badge>
              <Badge variant="default">{interviewDetail?.interview_mode || "—"}</Badge>
            </div>
          </div>

          <div className="rounded-[28px] border border-border/60 bg-muted/30 p-6">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <div className="mt-3 flex items-end gap-3">
              <h2 className="text-5xl font-semibold tracking-tight">{overallScore != null ? `${overallScore}%` : "—"}</h2>
              <span className="pb-1 text-sm text-muted-foreground">from the completed interview</span>
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Score trend</span>
                <span>{overallScore != null ? "Generated report" : "Pending"}</span>
              </div>
              <ProgressBar value={overallScore ?? 0} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Generated</p>
                <p className="mt-1 text-sm font-medium">{formatDateTime(report?.generated_at)}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                <p className="mt-1 text-sm font-medium">{interviewDetail?.status || "—"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportLoading ? <Loader label="Loading report data..." /> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>AI Feedback</CardTitle>
              <CardDescription>High-level takeaways from the session report.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold">Strengths</p>
              <div className="mt-3 space-y-2">
                {strengths.length ? (
                  strengths.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No strengths were generated yet.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Weaknesses</p>
              <div className="mt-3 space-y-2">
                {weaknesses.length ? (
                  weaknesses.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No weaknesses were generated yet.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Recommendations</p>
              <div className="mt-3 space-y-2">
                {recommendations.length ? (
                  recommendations.map((item) => (
                    <div key={item} className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recommendations were generated yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Skill Breakdown</CardTitle>
              <CardDescription>Core dimensions captured by the backend report.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillBreakdown.map((item) => (
              <div key={item.label} className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <Badge variant="info">{item.value != null ? `${item.value}%` : "—"}</Badge>
                </div>
                <ProgressBar value={item.value ?? 0} className="h-2.5" />
              </div>
            ))}
            {skillBreakdown.every((item) => item.value == null) ? (
              <p className="text-sm text-muted-foreground">No skill breakdown values were returned for this interview.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Interview Metadata</CardTitle>
              <CardDescription>Session details and source context.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview title</p>
              <p className="mt-1 font-medium">{interviewDetail?.title || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Domain</p>
              <p className="mt-1 font-medium">{interviewDetail?.domain || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Difficulty</p>
              <p className="mt-1 font-medium">{interviewDetail?.difficulty || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview mode</p>
              <p className="mt-1 font-medium capitalize">{interviewDetail?.interview_mode || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Interview source</p>
              <p className="mt-1 font-medium">{interviewDetail?.interview_source || "—"}</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Completed at</p>
              <p className="mt-1 font-medium">{formatDateTime(interviewDetail?.completed_at || report?.generated_at)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Question-wise Evaluation</CardTitle>
              <CardDescription>Per-question answer quality, feedback, and scoring.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionReview.length ? (
              questionReview.map(({ question, response, feedback }) => (
                <div key={question.id} className="rounded-[28px] border border-border/60 bg-card/80 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Question {question.question_order}</p>
                      <p className="text-base font-semibold">{question.question_text}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {response?.is_skipped ? <Badge variant="default">Skipped</Badge> : null}
                      <Badge variant="info">{response?.score != null ? `${response.score}%` : "—"}</Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-semibold">Answer</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{response?.answer_text || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-semibold">Ideal Answer</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{response?.ideal_answer || "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-semibold">Strengths</p>
                      <div className="mt-2 space-y-2">
                        {(feedback?.strengths || []).length ? (
                          feedback.strengths.map((item) => (
                            <div key={item} className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                              {item}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No strengths recorded.</p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-sm font-semibold">Weaknesses & Missing Concepts</p>
                      <div className="mt-2 space-y-2">
                        {(feedback?.weaknesses || []).length || (feedback?.missing_concepts || []).length ? (
                          [...(feedback?.weaknesses || []), ...(feedback?.missing_concepts || [])].map((item) => (
                            <div key={item} className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground">
                              {item}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No gaps recorded.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No question review available" description="Complete the interview to populate the question-by-question assessment." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Resume Used</CardTitle>
              <CardDescription>Visible only when the session used resume context.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {resume ? (
              <>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resume name</p>
                  <p className="mt-1 font-medium">{resume.alias || resume.file_path?.split("/").pop() || "Resume"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Resume ID</p>
                  <p className="mt-1 break-all font-medium text-sm">{resume.id || "—"}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Source file</p>
                  <p className="mt-1 break-all font-medium text-sm">{resume.file_path?.split("/").pop() || "—"}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">This interview did not use a resume-based source.</p>
            )}

            <div className="pt-2">
              {report ? (
                <Button type="button" variant="outline" className="w-full" onClick={handleGenerateReport} isLoading={reportLoading} disabled={reportLoading}>
                  Regenerate Report
                </Button>
              ) : (
                <Button type="button" className="w-full" onClick={handleGenerateReport} isLoading={reportLoading} disabled={reportLoading}>
                  Generate Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ReportsPage;
