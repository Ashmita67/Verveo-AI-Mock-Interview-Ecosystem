import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { generateReport, getReport } from "@/services/reportService";
import { getInterview, listInterviews } from "@/services/interviewService";
import { listResumes } from "@/services/resumeService";

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

function ReportsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [interviews, setInterviews] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [selectedInterviewId, setSelectedInterviewId] = useState("");
  const [interviewDetail, setInterviewDetail] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [filters, setFilters] = useState({
    domain: "all",
    difficulty: "all",
    type: "all",
    resume: "all",
  });

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        setLoading(true);
        const settled = await Promise.allSettled([listInterviews(), listResumes()]);
        if (!mounted) return;

        const interviewItems = settled[0].status === "fulfilled" ? settled[0].value : [];
        const resumeItems = settled[1].status === "fulfilled" ? settled[1].value : [];
        const ordered = [...interviewItems].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        setInterviews(ordered);
        setResumes(resumeItems);

        const queryInterviewId = searchParams.get("interviewId");
        setSelectedInterviewId(queryInterviewId || ordered[0]?.id || "");

        if (settled.some((result) => result.status === "rejected")) {
          toast.error("Some history data could not be loaded.");
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "We couldn't load reports right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedInterviewId) {
      setInterviewDetail(null);
      setReport(null);
      return;
    }

    setSearchParams({ interviewId: selectedInterviewId }, { replace: true });

    let mounted = true;

    async function loadSelectedInterview() {
      try {
        setReportLoading(true);
        setError("");
        const [detail, reportData] = await Promise.allSettled([getInterview(selectedInterviewId), getReport(selectedInterviewId)]);
        if (!mounted) return;

        setInterviewDetail(detail.status === "fulfilled" ? detail.value : null);
        setReport(reportData.status === "fulfilled" ? reportData.value : null);
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || "Unable to load report details.");
        }
      } finally {
        if (mounted) {
          setReportLoading(false);
        }
      }
    }

    loadSelectedInterview();

    return () => {
      mounted = false;
    };
  }, [selectedInterviewId, setSearchParams]);

  const resumeMap = useMemo(() => {
    return new Map(resumes.map((resume) => [resume.id, resume]));
  }, [resumes]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      if (filters.domain !== "all" && item.domain !== filters.domain) return false;
      if (filters.difficulty !== "all" && item.difficulty !== filters.difficulty) return false;
      if (filters.type !== "all" && item.type !== filters.type) return false;
      if (filters.resume !== "all" && String(item.resume_id || "") !== filters.resume) return false;
      return true;
    });
  }, [filters, interviews]);

  const selectedInterview = useMemo(
    () => interviews.find((item) => item.id === selectedInterviewId) || null,
    [interviews, selectedInterviewId],
  );

  const selectedResume = useMemo(() => {
    if (!interviewDetail?.resume_id) return null;
    return interviewDetail.resume || resumeMap.get(interviewDetail.resume_id) || null;
  }, [interviewDetail, resumeMap]);

  const resumeOptions = useMemo(() => {
    const seen = new Map();
    interviews.forEach((item) => {
      if (!item.resume_id) return;
      if (seen.has(item.resume_id)) return;
      const resume = resumeMap.get(item.resume_id);
      seen.set(item.resume_id, {
        id: item.resume_id,
        label: resume?.alias || resume?.file_path?.split("/").pop() || `Resume ${String(item.resume_id).slice(0, 8)}`,
      });
    });
    return Array.from(seen.values());
  }, [interviews, resumeMap]);

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

  const handleGenerateReport = async () => {
    try {
      setReportLoading(true);
      const generated = await generateReport(selectedInterviewId);
      setReport(generated);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not generate the report.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <Loader label="Loading reports..." />;
  }

  if (error && !interviews.length) {
    return <ErrorMessage title="Reports unavailable" description={error} />;
  }

  if (!interviews.length) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Reports"
          title="Session-level feedback and scoring"
          description="Understand where your answers land strongest and where your next improvements will matter most."
          badge="No interviews yet"
        />
        <EmptyState
          title="No interviews available"
          description="Complete an interview to generate report analytics and feedback."
          actionLabel="Start Interview"
          onAction={() => navigate("/interviews/create")}
        />
      </div>
    );
  }

  const metrics = [
    { label: "Overall Score", value: report?.overall_score },
    { label: "Technical Score", value: report?.technical_score },
    { label: "Communication Score", value: report?.communication_score },
    { label: "Problem Solving Score", value: report?.problem_solving_score },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Reports"
        title="Session-level feedback and scoring"
        description="Understand where your answers land strongest and where your next improvements will matter most."
        badge={report ? "Report loaded" : "No report yet"}
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>History Filters</CardTitle>
                <CardDescription>Slice interview history by the dimensions you care about.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Domain</span>
                <select className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none" value={filters.domain} onChange={(event) => setFilters((prev) => ({ ...prev, domain: event.target.value }))}>
                  <option value="all">All domains</option>
                  {[...new Set(interviews.map((item) => item.domain))].map((domain) => (
                    <option key={domain} value={domain}>
                      {domain}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Difficulty</span>
                <select className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none" value={filters.difficulty} onChange={(event) => setFilters((prev) => ({ ...prev, difficulty: event.target.value }))}>
                  <option value="all">All difficulties</option>
                  {[...new Set(interviews.map((item) => item.difficulty))].map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {difficulty}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Interview Type</span>
                <select className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none" value={filters.type} onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}>
                  <option value="all">All types</option>
                  {[...new Set(interviews.map((item) => item.type))].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-foreground">Resume</span>
                <select className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none" value={filters.resume} onChange={(event) => setFilters((prev) => ({ ...prev, resume: event.target.value }))}>
                  <option value="all">All resumes</option>
                  {resumeOptions.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.label}
                    </option>
                  ))}
                </select>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Interview History</CardTitle>
                <CardDescription>Open any previous report or session snapshot.</CardDescription>
              </div>
              <Badge variant="info">{filteredInterviews.length} shown</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredInterviews.length ? (
                filteredInterviews.map((item) => {
                  const isSelected = item.id === selectedInterviewId;
                  const resume = item.resume_id ? resumeMap.get(item.resume_id) : null;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`w-full rounded-2xl border p-4 text-left transition ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"}`}
                      onClick={() => setSelectedInterviewId(item.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.domain} • {item.difficulty} • {item.type}
                          </p>
                        </div>
                        {item.overall_score != null ? <Badge variant="info">{item.overall_score}%</Badge> : <Badge variant="default">Draft</Badge>}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {resume?.alias || resume?.file_path?.split("/").pop() || (item.resume_id ? `Resume ${String(item.resume_id).slice(0, 8)}` : "Generic interview")}
                      </p>
                    </button>
                  );
                })
              ) : (
                <EmptyState title="No matching interviews" description="Adjust the filters to surface more sessions." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <h3 className="mt-3 text-3xl font-semibold">{metric.value != null ? `${metric.value}%` : "—"}</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {reportLoading ? <Loader label="Loading report data..." /> : null}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Interview Summary</CardTitle>
                <CardDescription>Overview of the selected interview session.</CardDescription>
              </div>
              {selectedInterview ? <Badge variant="info">{selectedInterview.title}</Badge> : null}
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Domain</p>
                <p className="mt-2 font-semibold">{selectedInterview?.domain || "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Difficulty</p>
                <p className="mt-2 font-semibold">{selectedInterview?.difficulty || "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Interview Type</p>
                <p className="mt-2 font-semibold">{selectedInterview?.type || "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Interview Mode</p>
                <p className="mt-2 font-semibold capitalize">{interviewDetail?.interview_mode || selectedInterview?.interview_mode || "—"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Resume Used</p>
                <p className="mt-2 font-semibold">{selectedResume?.alias || selectedResume?.file_path?.split("/").pop() || "Generic interview"}</p>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 font-semibold">{selectedInterview?.status || "—"}</p>
              </div>
            </CardContent>
          </Card>

          {report ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Strengths, Weaknesses & Recommendations</CardTitle>
                    <CardDescription>Extracted from the live backend report.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold">Strengths</p>
                    <div className="mt-3 space-y-2">
                      {splitTextList(report.strengths).length ? (
                        splitTextList(report.strengths).map((item) => (
                          <div key={item} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                            {item}
                          </div>
                        ))
                      ) : (
                        <EmptyState title="No strengths listed" description="The backend has not generated strengths yet." />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Weaknesses</p>
                    <div className="mt-3 space-y-2">
                      {splitTextList(report.weaknesses).length ? (
                        splitTextList(report.weaknesses).map((item) => (
                          <div key={item} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                            {item}
                          </div>
                        ))
                      ) : (
                        <EmptyState title="No weaknesses listed" description="The backend has not generated weaknesses yet." />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Recommendations</p>
                    <div className="mt-3 space-y-2">
                      {splitTextList(report.recommendations).length ? (
                        splitTextList(report.recommendations).map((item) => (
                          <div key={item} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                            {item}
                          </div>
                        ))
                      ) : (
                        <EmptyState title="No recommendations yet" description="The backend has not generated recommendations yet." />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Missing Concepts</CardTitle>
                    <CardDescription>Where the interviewer found gaps in the answer set.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {questionReview.some((item) => item.feedback?.missing_concepts?.length) ? (
                    questionReview.flatMap((item) => item.feedback?.missing_concepts || []).map((concept) => (
                      <div key={concept} className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                        {concept}
                      </div>
                    ))
                  ) : (
                    <EmptyState title="No missing concepts recorded" description="The selected interview does not yet include concept gaps." />
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>No report yet</CardTitle>
                  <CardDescription>Generate the backend report for this interview to view scoring and recommendations.</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <EmptyState
                  title="Report not available"
                  description="This interview may still be in progress. Generate the report when the session is complete."
                  actionLabel="Generate Report"
                  onAction={handleGenerateReport}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Question Review</CardTitle>
                <CardDescription>Question, answer, AI feedback, score, and the ideal answer for each turn.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionReview.length ? (
                questionReview.map(({ question, response, feedback }) => (
                  <div key={question.id} className="rounded-3xl border border-border p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Question {question.question_order}</p>
                        <p className="mt-1 font-semibold">{question.question_text}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {response?.is_skipped ? <Badge variant="default">Skipped</Badge> : null}
                        <Badge variant="info">{response?.score != null ? `${response.score}%` : "—"}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-semibold">User Answer</p>
                        <p className="mt-2 text-sm text-muted-foreground">{response?.answer_text || response?.transcript || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">AI Feedback</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {[
                            ...(feedback?.strengths || []),
                            ...(feedback?.weaknesses || []),
                            ...(feedback?.missing_concepts || []),
                          ].length
                            ? [
                                ...(feedback?.strengths || []).map((item) => `Strength: ${item}`),
                                ...(feedback?.weaknesses || []).map((item) => `Weakness: ${item}`),
                                ...(feedback?.missing_concepts || []).map((item) => `Missing: ${item}`),
                              ].join(" ")
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Ideal Answer</p>
                        <p className="mt-2 text-sm text-muted-foreground">{response?.ideal_answer || "—"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Transcript</p>
                        <p className="mt-2 text-sm text-muted-foreground">{response?.transcript || "—"}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No question review available" description="Complete the interview to populate question-level analysis." />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;
