import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { interviewDifficulties, interviewDomains, interviewModes, interviewSources, interviewTypes } from "@/constants/interviewOptions";
import { startInterview } from "@/services/interviewService";
import { listResumes } from "@/services/resumeService";
import { saveInterviewSession } from "@/services/sessionService";

function InterviewForm() {
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [resumeSearch, setResumeSearch] = useState("");
  const navigate = useNavigate();

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

  const loadResumes = async () => {
    try {
      setLoadingResumes(true);
      const items = await listResumes();
      const ordered = [...items].sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
      setResumes(ordered);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "We couldn't load your resumes.");
    } finally {
      setLoadingResumes(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadResumes();
    }
  }, [open]);

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
    if (!term) {
      return resumes;
    }
    return resumes.filter((resume) => {
      const fileName = resume.file_path?.split("/").pop() || "";
      const alias = resume.alias || "";
      return fileName.toLowerCase().includes(term) || alias.toLowerCase().includes(term);
    });
  }, [resumes, resumeSearch]);

  const selectedResume = useMemo(() => resumes.find((resume) => resume.id === selectedResumeId) || null, [resumes, selectedResumeId]);

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
      setOpen(false);
      reset();
      setResumeSearch("");
      navigate("/interviews/session", { replace: true, state: { interviewId: session.interview_id } });
    } catch (error) {
      toast.error(error?.response?.data?.detail || "We couldn't start the interview.");
    }
  };

  const noResumesAvailable = !loadingResumes && resumes.length === 0;

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="Start Interview"
      description="Choose the interview configuration before launching the session."
      trigger={
        <Button className="w-full md:w-auto" onClick={() => setOpen(true)}>
          Start Interview
        </Button>
      }
    >
      <Card className="border-0 bg-transparent p-0 shadow-none">
        <CardHeader className="px-0 pt-0">
          <div>
            <CardTitle>Interview Configuration</CardTitle>
            <CardDescription>Use the same polished layout, now powered by the backend.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Interview Title"
              placeholder="Senior Frontend Engineer Loop"
              error={errors.title?.message}
              {...register("title", { required: "Interview title is required." })}
            />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Interview Type</span>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("type", { required: "Interview type is required." })}
              >
                {interviewTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Domain</span>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("domain", { required: "Domain is required." })}
              >
                {interviewDomains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Difficulty</span>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("difficulty", { required: "Difficulty is required." })}
              >
                {interviewDifficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-foreground">Interview Mode</span>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("interview_mode", { required: "Interview mode is required." })}
              >
                {interviewModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 space-y-3">
              <p className="text-sm font-medium text-foreground">Interview Source</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {interviewSources.map((source) => {
                  const disabled = source.value === "resume_based" && (noResumesAvailable || loadingResumes);
                  return (
                    <label
                      key={source.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                        interviewSource === source.value ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
                      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
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
                            ? "Generate questions from the job context only."
                            : "Generate questions from the selected resume plus role context."}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              {noResumesAvailable ? (
                <p className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700">
                  Upload a resume first to enable resume-based interviews.
                </p>
              ) : null}
            </div>

            {interviewSource === "resume_based" ? (
              <div className="md:col-span-2 space-y-3">
                <Input
                  label="Search Resumes"
                  placeholder="Search by filename or alias"
                  value={resumeSearch}
                  onChange={(event) => setResumeSearch(event.target.value)}
                  disabled={loadingResumes || noResumesAvailable}
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-foreground">Select Resume</span>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  </select>
                  {errors.resume_id?.message ? <p className="text-sm text-destructive">{errors.resume_id.message}</p> : null}
                  {selectedResume ? (
                    <p className="text-sm text-muted-foreground">
                      Selected: <span className="font-medium text-foreground">{selectedResume.alias || selectedResume.file_path?.split("/").pop()}</span>
                    </p>
                  ) : null}
                  {!loadingResumes && resumes.length > 0 && filteredResumes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No resumes match your search.</p>
                  ) : null}
                </label>
              </div>
            ) : null}

            <input type="hidden" {...register("resume_id")} />

            <div className="md:col-span-2">
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Start Interview
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Modal>
  );
}

export default InterviewForm;
