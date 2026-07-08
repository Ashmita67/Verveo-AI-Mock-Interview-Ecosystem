import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BriefcaseBusiness, Gauge, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { interviewDifficulties, interviewDomains, interviewModes, interviewSources, interviewTypes } from "@/constants/interviewOptions";
import { startInterview } from "@/services/interviewService";
import { listResumes } from "@/services/resumeService";
import { saveInterviewSession } from "@/services/sessionService";
import { cn } from "@/utils/cn";

function InterviewForm() {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeSearch, setResumeSearch] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      domain: interviewDomains[0],
      difficulty: interviewDifficulties[1],
      type: interviewTypes[0],
      interview_mode: interviewModes[0],
      interview_source: interviewSources[0].value,
      resume_id: "",
    },
  });

  const interviewSource = watch("interview_source");
  const selectedResumeId = watch("resume_id");

  useEffect(() => {
    let mounted = true;

    async function loadResumes() {
      try {
        setLoadingResumes(true);
        const items = await listResumes();
        if (!mounted) return;
        const ordered = [...items].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
        setResumes(ordered);
      } catch (err) {
        if (mounted) {
          toast.error(err?.response?.data?.detail || "We couldn't load your resumes.");
        }
      } finally {
        if (mounted) {
          setLoadingResumes(false);
        }
      }
    }

    loadResumes();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (interviewSource === "generic") {
      setResumeSearch("");
      clearErrors("resume_id");
      setValue("resume_id", "");
      return;
    }

    if (interviewSource === "resume_based" && resumes.length && !selectedResumeId) {
      setValue("resume_id", resumes[0].id, { shouldValidate: true });
    }
  }, [clearErrors, interviewSource, resumes, selectedResumeId, setValue]);

  const filteredResumes = useMemo(() => {
    const term = resumeSearch.trim().toLowerCase();
    if (!term) return resumes;
    return resumes.filter((resume) => {
      const fileName = resume.file_path?.split("/").pop() || "";
      const alias = resume.alias || "";
      return fileName.toLowerCase().includes(term) || alias.toLowerCase().includes(term);
    });
  }, [resumeSearch, resumes]);

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId) || null,
    [resumes, selectedResumeId],
  );

  const noResumesAvailable = !loadingResumes && resumes.length === 0;

  const onSubmit = async (values) => {
    try {
      if (values.interview_source === "resume_based" && !values.resume_id) {
        setError("resume_id", { type: "manual", message: "Choose a resume for resume-based interviews." });
        return;
      }

      const session = await startInterview({
        title: values.title,
        domain: values.domain,
        difficulty: values.difficulty,
        type: values.type,
        interview_mode: values.interview_mode,
        interview_source: values.interview_source,
        resume_id: values.interview_source === "resume_based" ? values.resume_id : null,
      });

      saveInterviewSession({
        interviewId: session.interview_id,
        interviewMode: session.interview_mode,
        interviewSource: session.interview_source,
        resumeId: session.resume_id || null,
        interview: session.interview,
        questions: session.questions || (session.question ? [session.question] : []),
        currentQuestionIndex: 0,
        currentDifficulty: values.difficulty,
        startedAt: session.interview?.started_at || new Date().toISOString(),
        answers: {},
      });

      toast.success("Interview session created successfully.");
      reset();
      setResumeSearch("");
      navigate(`/interviews/session/${session.interview_id}`, { replace: true, state: { interviewId: session.interview_id } });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "We couldn't start the interview.");
    }
  };

  return (
    <Card className="mx-auto w-full max-w-4xl border-border/60 bg-card/95 shadow-[0_32px_100px_rgba(15,23,42,0.12)]">
      <CardHeader className="mb-6 flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            Interview Setup
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl">Prepare a focused practice session</CardTitle>
            <CardDescription className="max-w-2xl">
              Configure the interview first. Questions will begin only after you start the session on the next page.
            </CardDescription>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Setup only. No question generation here.
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Interview details</p>
              <p className="mt-1 text-sm text-muted-foreground">Start with the role, domain, and difficulty you want to practice.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Interview Title"
                placeholder="Senior Frontend Engineer Loop"
                error={errors.title?.message}
                {...register("title", { required: "Interview title is required." })}
              />
              <Select label="Interview Type" error={errors.type?.message} {...register("type", { required: "Interview type is required." })}>
                {interviewTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <Select label="Domain" error={errors.domain?.message} {...register("domain", { required: "Domain is required." })}>
                {interviewDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </Select>
              <Select label="Difficulty" error={errors.difficulty?.message} {...register("difficulty", { required: "Difficulty is required." })}>
                {interviewDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </Select>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Session format</p>
              <p className="mt-1 text-sm text-muted-foreground">Choose how the interview should run and which response mode to use.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <Select
                label="Interview Mode"
                error={errors.interview_mode?.message}
                {...register("interview_mode", { required: "Interview mode is required." })}
              >
                {interviewModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </option>
                ))}
              </Select>

              <div className="space-y-3">
                <p className="text-sm font-medium tracking-tight text-foreground">Interview Source</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {interviewSources.map((source) => {
                    const disabled = source.value === "resume_based" && (noResumesAvailable || loadingResumes);

                    return (
                      <label
                        key={source.value}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 p-4 transition duration-200 hover:-translate-y-0.5 hover:bg-muted/40",
                          interviewSource === source.value && "border-primary bg-primary/5",
                          disabled && "cursor-not-allowed opacity-60 hover:translate-y-0",
                        )}
                      >
                        <input
                          type="radio"
                          value={source.value}
                          disabled={disabled}
                          className="mt-1"
                          {...register("interview_source", {
                            onChange: (event) => {
                              const nextSource = event.target.value;
                              if (nextSource === "generic") {
                                setResumeSearch("");
                                clearErrors("resume_id");
                                setValue("resume_id", "");
                              } else if (resumes.length && !selectedResumeId) {
                                clearErrors("resume_id");
                                setValue("resume_id", resumes[0].id, { shouldValidate: true });
                              }
                            },
                          })}
                        />
                        <div>
                          <p className="font-semibold">{source.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {source.value === "generic"
                              ? "Generate questions from the role and domain only."
                              : "Generate questions using the selected resume plus role context."}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {noResumesAvailable ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800">
                    Upload a resume first to enable resume-based interviews.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {interviewSource === "resume_based" ? (
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Resume selection</p>
                <p className="mt-1 text-sm text-muted-foreground">Pick the resume that should drive the interview context.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Search Resumes"
                  placeholder="Search by filename or alias"
                  value={resumeSearch}
                  onChange={(event) => setResumeSearch(event.target.value)}
                  disabled={loadingResumes || noResumesAvailable}
                />
                <Select
                  label="Select Resume"
                  error={errors.resume_id?.message}
                  disabled={loadingResumes || noResumesAvailable}
                  value={selectedResumeId || ""}
                  onChange={(event) => {
                    clearErrors("resume_id");
                    setValue("resume_id", event.target.value, { shouldValidate: true });
                  }}
                >
                  <option value="">{loadingResumes ? "Loading resumes..." : "Choose a resume"}</option>
                  {filteredResumes.map((resume) => {
                    const fileName = resume.file_path?.split("/").pop() || "Resume PDF";
                    const label = resume.alias ? `${resume.alias} • ${fileName}` : fileName;
                    return (
                      <option key={resume.id} value={resume.id}>
                        {label}
                      </option>
                    );
                  })}
                </Select>
              </div>

              {selectedResume ? (
                <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  Selected resume: <span className="font-medium text-foreground">{selectedResume.alias || selectedResume.file_path?.split("/").pop()}</span>
                </div>
              ) : null}

              {!loadingResumes && resumes.length > 0 && filteredResumes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No resumes match your search.</p>
              ) : null}

            </section>
          ) : null}

          <input type="hidden" {...register("resume_id")} />

          <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MonitorPlay className="h-4 w-4" />
              <span>Questions start on the live interview page after you submit this setup.</span>
            </div>
            <Button type="submit" size="lg" className="min-w-52" isLoading={isSubmitting} disabled={isSubmitting}>
              Start Interview
              <Gauge className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default InterviewForm;
