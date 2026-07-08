import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Mic, Pause, Play, Square, Video } from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import ProgressBar from "@/components/ui/ProgressBar";
import TextArea from "@/components/ui/TextArea";
import {
  completeInterview,
  evaluateAudio,
  evaluateText,
  evaluateVideo,
  getInterview,
  getNextQuestion,
} from "@/services/interviewService";
import { clearInterviewSession, loadInterviewSession, saveInterviewSession } from "@/services/sessionService";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function mergeUniqueById(primary = [], fallback = []) {
  const items = [...primary];
  const seen = new Set(primary.map((item) => item.id).filter(Boolean));
  fallback.forEach((item) => {
    if (!item?.id || seen.has(item.id)) {
      return;
    }
    items.push(item);
    seen.add(item.id);
  });
  return items;
}

function SessionPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordingState, setRecordingState] = useState("idle");
  const [recordedFile, setRecordedFile] = useState(null);
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const chunksRef = useRef([]);

  const interviewId = params.id;
  const currentQuestionIndex = session?.currentQuestionIndex ?? 0;
  const currentQuestion = useMemo(() => session?.questions?.[currentQuestionIndex] ?? null, [currentQuestionIndex, session]);
  const currentMode = session?.interviewMode || "text";
  const isTextMode = currentMode === "text";
  const progress = session?.questions?.length ? Math.min(100, ((currentQuestionIndex + 1) / session.questions.length) * 100) : 0;
  const currentAnswerText = session?.answerText ?? "";
  const pendingNextQuestion = session?.pendingNextQuestion ?? null;
  const resumeName = session?.resumeName || session?.interview?.resume?.alias || session?.interview?.resume?.file_path?.split("/").pop() || "";

  const updateSession = (updater) => {
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      return typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
    });
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        const stored = loadInterviewSession();
        const activeInterviewId = interviewId || location.state?.interviewId || stored?.interviewId;

        if (!activeInterviewId) {
          throw new Error("No active interview session found. Start an interview to begin.");
        }

        const interview = await getInterview(activeInterviewId);
        if (!mounted) return;

        const remoteQuestions = Array.isArray(interview.questions) ? interview.questions : [];
        const storedQuestions = Array.isArray(stored?.questions) ? stored.questions : [];
        const mergedQuestions = mergeUniqueById(remoteQuestions, storedQuestions);
        const mergedResponses = mergeUniqueById(Array.isArray(interview.responses) ? interview.responses : [], Array.isArray(stored?.responses) ? stored.responses : []);
        const nextSession = {
          interviewId: activeInterviewId,
          interviewMode: interview.interview_mode || stored?.interviewMode || "text",
          interviewSource: interview.interview_source || stored?.interviewSource || "generic",
          interview: {
            ...interview,
            questions: mergedQuestions,
            responses: mergedResponses,
          },
          questions: mergedQuestions,
          responses: mergedResponses,
          currentQuestionIndex: stored?.currentQuestionIndex ?? interview.current_question_index ?? Math.max(0, mergedQuestions.length - 1),
          currentDifficulty: stored?.currentDifficulty || interview.difficulty,
          startedAt: stored?.startedAt || interview.started_at || new Date().toISOString(),
          questionStartedAt: stored?.questionStartedAt || interview.started_at || new Date().toISOString(),
          answerText: stored?.answerText || "",
          pendingNextQuestion: stored?.pendingNextQuestion || null,
          answers: stored?.answers || {},
          resumeName: interview.resume?.alias || interview.resume?.file_path?.split("/").pop() || stored?.resumeName || "",
        };

        setSession(nextSession);
        setRecordingState("idle");
        setRecordedFile(null);
        setRecordedPreviewUrl("");
        setError("");
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || err.message || "We couldn't load this interview session.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [interviewId, location.state?.interviewId]);

  useEffect(() => {
    if (!session) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      const startedAt = new Date(session.startedAt || Date.now()).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (session?.startedAt) {
      const startedAt = new Date(session.startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }
  }, [currentQuestionIndex, currentMode, session?.questionStartedAt, session?.startedAt]);

  useEffect(() => {
    if (!session) {
      return;
    }
    saveInterviewSession(session);
  }, [session]);

  useEffect(() => {
    if (!recordedPreviewUrl) {
      return undefined;
    }

    return () => URL.revokeObjectURL(recordedPreviewUrl);
  }, [recordedPreviewUrl]);

  useEffect(() => {
    if (currentMode !== "video" || !mediaStreamRef.current || !videoPreviewRef.current) {
      return;
    }

    videoPreviewRef.current.srcObject = mediaStreamRef.current;
    videoPreviewRef.current.play().catch(() => {});
  }, [currentMode, recordingState, session?.currentQuestionIndex]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecordingState("idle");
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    if (!currentQuestion) {
      return;
    }

    try {
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl("");
      }
      setRecordedFile(null);
      const constraints = currentMode === "video" ? { audio: true, video: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = currentMode === "video" ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `${currentMode}-answer.webm`, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);
        setRecordedFile(file);
        setRecordedPreviewUrl(previewUrl);
        setRecordingState("idle");
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingState("recording");
      toast.success(`${currentMode === "video" ? "Video" : "Audio"} recording started.`);
    } catch (err) {
      toast.error("We couldn't access your microphone or camera.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");
    }
  };

  const persistAnswerResult = (questionId, response, evaluationPayload) => {
    const answerText = evaluationPayload?.transcript || response?.transcript || response?.answer_text || session?.answerText || "";
    updateSession((prev) => ({
      ...prev,
      answerText,
      currentDifficulty: response?.difficulty || prev.currentDifficulty,
      answers: {
        ...(prev.answers || {}),
        [questionId]: {
          answerText,
          transcript: evaluationPayload.transcript || response?.transcript || "",
          score: response?.score ?? evaluationPayload?.score ?? 0,
          isSkipped: response?.is_skipped || false,
          evaluation: evaluationPayload,
          response,
        },
      },
      responses: mergeUniqueById(prev.responses || [], [response].filter(Boolean)),
    }));
  };

  const buildNextQuestion = async () => {
    const response = await getNextQuestion({
      interview_id: session.interviewId,
      difficulty: session.currentDifficulty || currentQuestion?.difficulty || session.interview?.difficulty,
    });

    updateSession((prev) => {
      const existingQuestions = prev.questions || [];
      const alreadyExists = existingQuestions.some((question) => question.id && response.id && question.id === response.id);
      const nextQuestions = alreadyExists ? existingQuestions : [...existingQuestions, response];
      return {
        ...prev,
        questions: nextQuestions,
        pendingNextQuestion: response,
        currentDifficulty: response.difficulty || prev.currentDifficulty,
      };
    });

    return response;
  };

  const advanceToNextQuestion = async (nextQuestionOverride = null, nextQuestionsOverride = null, options = {}) => {
    const { silent = false } = options;
    try {
      setIsFetchingNext(true);
      setError("");

      let nextQuestion = nextQuestionOverride || pendingNextQuestion;
      let nextQuestions = nextQuestionsOverride || session.questions;
      if (!nextQuestion) {
        nextQuestion = await buildNextQuestion();
        nextQuestions = mergeUniqueById(session.questions || [], [nextQuestion]);
      }

      updateSession((prev) => {
        const questions = nextQuestions || prev.questions || [];
        const nextIndex = Math.min(Math.max(questions.length - 1, 0), (prev.currentQuestionIndex || 0) + 1);
        return {
          ...prev,
          questions,
          currentQuestionIndex: nextIndex,
          questionStartedAt: new Date().toISOString(),
          answerText: "",
          pendingNextQuestion: null,
        };
      });

      setRecordedFile(null);
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl("");
      }
      if (!silent) {
        toast.success("Next question ready.");
      }
      return nextQuestion;
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not load the next question.");
      throw err;
    } finally {
      setIsFetchingNext(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !session) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      if (currentMode === "text" && !currentAnswerText.trim()) {
        toast.error("Please type your answer first.");
        return;
      }

      if ((currentMode === "audio" || currentMode === "video") && !recordedFile) {
        toast.error(`Please record a ${currentMode} answer first.`);
        return;
      }

      let evaluationResult;
      if (currentMode === "audio") {
        evaluationResult = await evaluateAudio(session.interviewId, currentQuestion.id, recordedFile);
      } else if (currentMode === "video") {
        evaluationResult = await evaluateVideo(session.interviewId, currentQuestion.id, recordedFile);
      } else {
        evaluationResult = await evaluateText({
          interview_id: session.interviewId,
          question_id: currentQuestion.id,
          answer_text: currentAnswerText,
        });
      }

      persistAnswerResult(currentQuestion.id, evaluationResult.response, {
        ...evaluationResult,
        transcript: evaluationResult.transcript || evaluationResult.response?.transcript || "",
      });

      const nextQuestion = await buildNextQuestion();
      await advanceToNextQuestion(nextQuestion, mergeUniqueById(session.questions || [], [nextQuestion]), { silent: true });
      toast.success(`Answer scored: ${evaluationResult.score}%`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Answer evaluation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeCurrentInterview = async (isTimeout = false) => {
    if (!session || isCompleting) {
      return;
    }

    try {
      setIsCompleting(true);
      if (recordingState !== "idle") {
        stopRecording();
      }
      await completeInterview({ interview_id: session.interviewId });
      clearInterviewSession();
      toast.success(isTimeout ? "Interview ended after timeout." : "Interview completed.");
      navigate(`/reports/${session.interviewId}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "We couldn't complete the interview.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (loading) {
    return <Loader label="Loading interview session..." />;
  }

  if (error && !session) {
    return <ErrorMessage title="Interview session unavailable" description={error} />;
  }

  if (!session || !currentQuestion) {
    return (
      <EmptyState
        title="No active interview session"
        description="Start an interview from the setup page to begin the live session."
        actionLabel="Start Interview"
        onAction={() => navigate("/interviews/create")}
      />
    );
  }

  const footerItems = [
    { label: "Interview mode", value: currentMode.charAt(0).toUpperCase() + currentMode.slice(1) },
    { label: "Difficulty", value: session.currentDifficulty || currentQuestion.difficulty || session.interview?.difficulty || "—" },
    { label: "Interview type", value: session.interview?.type || "—" },
    { label: "Elapsed time", value: formatTime(elapsedSeconds) },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-border/60 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <CardHeader className="mb-4 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Live Interview
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl">{session.interview?.title || "Interview Session"}</CardTitle>
              <CardDescription className="mt-2">
                Question {currentQuestionIndex + 1} of {session.questions.length}
              </CardDescription>
            </div>
          </div>
          <Badge variant="info">{Math.round(progress)}% complete</Badge>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Session progress</span>
              <span>{currentQuestionIndex + 1} / {session.questions.length}</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-1 flex-col border-border/60 bg-card/90 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <CardContent className="flex flex-1 flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
            <div className="max-w-4xl space-y-4">
              <Badge variant="default" className="mx-auto">
                Question {currentQuestionIndex + 1}
              </Badge>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {currentQuestion.question_text}
              </h2>
            </div>

            <div className="w-full max-w-4xl space-y-4">
              {isTextMode ? (
                <TextArea
                  label="Your Answer"
                  placeholder="Type your response here..."
                  value={currentAnswerText}
                  onChange={(event) => updateSession({ answerText: event.target.value })}
                  className="min-h-48 text-base"
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[28px] border border-border/60 bg-muted/30 p-5 text-left">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Video className="h-4 w-4" />
                      <span>{currentMode === "video" ? "Video" : "Audio"} response mode</span>
                    </div>
                    {currentMode === "video" ? (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-black">
                        <video ref={videoPreviewRef} className="h-56 w-full object-cover sm:h-72" muted playsInline autoPlay />
                      </div>
                    ) : null}
                    <p className="mt-4 text-sm text-muted-foreground">
                      {recordingState === "recording"
                        ? "Recording in progress."
                        : recordingState === "paused"
                          ? "Recording paused."
                          : recordedPreviewUrl
                            ? "Your response is ready to submit."
                            : "Start recording when you're ready to answer."}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-border/60 bg-muted/30 p-5 text-left">
                    <p className="text-sm font-semibold">Recorded answer</p>
                    {recordedPreviewUrl ? (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-muted-foreground">{recordedFile?.name}</p>
                        {currentMode === "video" ? <video className="w-full rounded-2xl" src={recordedPreviewUrl} controls /> : null}
                        {currentMode === "audio" ? <audio className="w-full" src={recordedPreviewUrl} controls /> : null}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">No recording captured yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isSubmitting || isFetchingNext ? (
            <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Generating the next question...
            </div>
          ) : null}

          {error ? <ErrorMessage title="Session error" description={error} /> : null}

          <div className="flex flex-col gap-3 border-t border-border/60 pt-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {!isTextMode ? (
                <>
                  {recordingState === "idle" ? (
                    <Button type="button" onClick={startRecording} disabled={isSubmitting || isFetchingNext || isCompleting}>
                      <Mic className="h-4 w-4" />
                      Start Recording
                    </Button>
                  ) : null}
                  {recordingState === "recording" ? (
                    <Button type="button" variant="outline" onClick={pauseRecording} disabled={isSubmitting || isFetchingNext || isCompleting}>
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : null}
                  {recordingState === "paused" ? (
                    <Button type="button" variant="outline" onClick={resumeRecording} disabled={isSubmitting || isFetchingNext || isCompleting}>
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                  ) : null}
                  {recordingState !== "idle" ? (
                    <Button type="button" variant="outline" onClick={stopRecording} disabled={isSubmitting || isFetchingNext || isCompleting}>
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  ) : null}
                </>
              ) : null}
              <Button type="button" onClick={submitAnswer} isLoading={isSubmitting || isFetchingNext} disabled={isSubmitting || isFetchingNext || isCompleting}>
                Submit Answer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => advanceToNextQuestion()}
                isLoading={isFetchingNext}
                disabled={isSubmitting || isFetchingNext || isCompleting}
              >
                <ArrowRight className="h-4 w-4" />
                Next Question
              </Button>
            </div>

            <Button type="button" variant="destructive" onClick={() => completeCurrentInterview(false)} isLoading={isCompleting} disabled={isSubmitting || isFetchingNext}>
              End Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <CardContent className="grid gap-3 md:grid-cols-4">
          {footerItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 font-semibold">{item.value}</p>
            </div>
          ))}
          {resumeName ? (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 md:col-span-4">
              <p className="text-sm text-muted-foreground">Resume used</p>
              <p className="mt-1 font-semibold">{resumeName}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default SessionPanel;
