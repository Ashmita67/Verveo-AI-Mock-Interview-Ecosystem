import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Mic, Play, Send, SkipForward, Square, Video } from "lucide-react";
import toast from "react-hot-toast";
import EmptyState from "@/components/common/EmptyState";
import ErrorMessage from "@/components/common/ErrorMessage";
import Loader from "@/components/common/Loader";
import Badge from "@/components/ui/Badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import TextArea from "@/components/ui/TextArea";
import ProgressBar from "@/components/ui/ProgressBar";
import { completeInterview, evaluateAudio, evaluateText, evaluateVideo, getInterview, getNextQuestion, skipQuestion } from "@/services/interviewService";
import { clearInterviewSession, loadInterviewSession, saveInterviewSession } from "@/services/sessionService";

const QUESTION_TIMEOUT_SECONDS = 60;

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [questionRemainingSeconds, setQuestionRemainingSeconds] = useState(QUESTION_TIMEOUT_SECONDS);
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

  const currentQuestionIndex = session?.currentQuestionIndex ?? 0;
  const currentQuestion = useMemo(() => session?.questions?.[currentQuestionIndex] ?? null, [currentQuestionIndex, session]);
  const currentMode = session?.interviewMode || "text";
  const isTextMode = currentMode === "text";
  const progress = session?.questions?.length ? Math.min(100, ((currentQuestionIndex + 1) / session.questions.length) * 100) : 0;
  const currentAnswerRecord = currentQuestion?.id ? session?.answers?.[currentQuestion.id] : null;
  const currentAnswerText = session?.answerText ?? "";
  const currentEvaluation = session?.evaluation ?? null;
  const pendingNextQuestion = session?.pendingNextQuestion ?? null;
  const resumeName = session?.resumeName || session?.interview?.resume?.alias || session?.interview?.resume?.file_path?.split("/").pop() || "";

  const updateSession = (updater) => {
    setSession((prev) => {
      if (!prev) {
        return prev;
      }
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        setLoading(true);
        const stored = loadInterviewSession();
        const interviewId = location.state?.interviewId || stored?.interviewId;

        if (!interviewId) {
          throw new Error("No active interview session found. Start an interview to begin.");
        }

        const interview = await getInterview(interviewId);
        if (!mounted) return;

        const remoteQuestions = Array.isArray(interview.questions) ? interview.questions : [];
        const storedQuestions = Array.isArray(stored?.questions) ? stored.questions : [];
        const mergedQuestions = mergeUniqueById(remoteQuestions, storedQuestions);
        const mergedResponses = mergeUniqueById(Array.isArray(interview.responses) ? interview.responses : [], Array.isArray(stored?.responses) ? stored.responses : []);
        const nextSession = {
          interviewId,
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
          evaluation: stored?.evaluation || null,
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
  }, [location.state?.interviewId]);

  useEffect(() => {
    if (!session || !isTextMode) {
      setQuestionRemainingSeconds(QUESTION_TIMEOUT_SECONDS);
      return undefined;
    }

    const interval = window.setInterval(() => {
      const startedAt = new Date(session.startedAt || Date.now()).getTime();
      const questionStartedAt = new Date(session.questionStartedAt || session.startedAt || Date.now()).getTime();
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startedAt) / 1000)));
      const questionElapsed = Math.max(0, Math.floor((now - questionStartedAt) / 1000));
      setQuestionRemainingSeconds(Math.max(0, QUESTION_TIMEOUT_SECONDS - questionElapsed));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [session, isTextMode]);

  useEffect(() => {
    if (session?.startedAt) {
      const startedAt = new Date(session.startedAt).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }
  }, [currentQuestionIndex, currentMode, session?.questionStartedAt]);

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

  const persistAnswerResult = (questionId, response, evaluationPayload) => {
    const answerText = evaluationPayload?.transcript || response?.transcript || response?.answer_text || session?.answerText || "";
    updateSession((prev) => ({
      ...prev,
      evaluation: evaluationPayload,
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

  const advanceToNextQuestion = async (nextQuestionOverride = null, nextQuestionsOverride = null) => {
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
          evaluation: null,
          pendingNextQuestion: null,
        };
      });
      setRecordedFile(null);
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl);
        setRecordedPreviewUrl("");
      }
      if (currentMode !== "text") {
        setQuestionRemainingSeconds(QUESTION_TIMEOUT_SECONDS);
      }
      toast.success("Next question ready.");
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
      toast.success(`Answer scored: ${evaluationResult.score}%`);

      if (currentMode !== "text") {
        await advanceToNextQuestion(nextQuestion, mergeUniqueById(session.questions || [], [nextQuestion]));
      }
    } catch (err) {
      setError(err?.response?.data?.detail || "Answer evaluation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipCurrentQuestion = async () => {
    if (!session || !currentQuestion || !isTextMode) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const skipped = await skipQuestion({
        interview_id: session.interviewId,
        question_id: currentQuestion.id,
      });

      persistAnswerResult(currentQuestion.id, skipped.response, {
        ...skipped,
        transcript: "",
      });
      const nextQuestion = await buildNextQuestion();
      await advanceToNextQuestion(nextQuestion, mergeUniqueById(session.questions || [], [nextQuestion]));
      toast.success("Question skipped.");
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not skip the current question.");
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
      navigate(`/reports?interviewId=${session.interviewId}`, { replace: true });
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
        description="Start an interview from the builder to begin practicing with live questions."
        actionLabel="Start Interview"
        onAction={() => navigate("/interviews/create")}
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="overflow-hidden">
        <div className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground">
          <Badge className="bg-white/15 text-white" variant="default">
            Live AI Session
          </Badge>
          <h2 className="mt-4 text-3xl font-semibold">{session.interview?.title || "Interview Session"}</h2>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/80">
            Adaptive questioning, live scoring, and contextual feedback based on your answers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {currentMode !== "text" ? (
              <Button variant="secondary" onClick={recordingState === "recording" ? pauseRecording : startRecording} disabled={isSubmitting || isCompleting}>
                <Mic className="mr-2 h-4 w-4" />
                {recordingState === "recording" ? "Pause Recording" : "Start Recording"}
              </Button>
            ) : null}
            {currentMode !== "text" && recordingState === "paused" ? (
              <Button variant="secondary" onClick={resumeRecording} disabled={isSubmitting || isCompleting}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            ) : null}
            {currentMode !== "text" && recordingState !== "idle" ? (
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={stopRecording} disabled={isSubmitting || isCompleting}>
                <Square className="mr-2 h-4 w-4" />
                Stop Recording
              </Button>
            ) : null}
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" onClick={() => completeCurrentInterview(false)} disabled={isSubmitting || isCompleting}>
              End Interview
            </Button>
          </div>
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Interview Title</p>
              <p className="mt-2 font-semibold">{session.interview?.title}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="mt-2 font-semibold">{session.interview?.domain}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <p className="mt-2 font-semibold">{session.interview?.difficulty}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Interview Type</p>
              <p className="mt-2 font-semibold">{session.interview?.type}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Interview Mode</p>
              <p className="mt-2 font-semibold capitalize">{currentMode}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Resume Name</p>
              <p className="mt-2 font-semibold">{resumeName || "Generic interview"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1}</p>
              <h3 className="mt-1 text-2xl font-semibold">{currentQuestion.question_text}</h3>
            </div>
            <Badge variant="info">{currentQuestion.difficulty}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Elapsed Timer</p>
              <p className="mt-2 text-2xl font-semibold">{formatTime(elapsedSeconds)}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Question Number</p>
              <p className="mt-2 text-2xl font-semibold">
                {currentQuestionIndex + 1}/{session.questions.length}
              </p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Current Score</p>
              <p className="mt-2 text-2xl font-semibold">{currentEvaluation?.score != null ? `${currentEvaluation.score}%` : "—"}</p>
            </div>
          </div>

          {isTextMode ? (
            <TextArea
              label="Answer"
              placeholder="Type your response here..."
              value={currentAnswerText}
              onChange={(event) => updateSession({ answerText: event.target.value })}
              className="min-h-56"
            />
          ) : (
            <div className="rounded-3xl border border-border p-5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>{currentMode === "video" ? "Video" : "Audio"} response recording is enabled for this session.</span>
              </div>
              {currentMode === "video" ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-black">
                  <video ref={videoPreviewRef} className="h-72 w-full object-cover" muted playsInline autoPlay />
                </div>
              ) : null}
              {recordedPreviewUrl ? (
                <div className="mt-4 rounded-2xl border border-border p-4">
                  <p className="text-sm font-medium">Recorded answer ready for submission.</p>
                  <p className="mt-1 text-xs text-muted-foreground">{recordedFile?.name}</p>
                  {currentMode === "video" ? <video className="mt-3 h-48 w-full rounded-xl" src={recordedPreviewUrl} controls /> : null}
                  {currentMode === "audio" ? <audio className="mt-3 w-full" src={recordedPreviewUrl} controls /> : null}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">Record your response and stop it before submitting.</p>
              )}
              {isTextMode ? (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  <span>Time remaining in this question: {formatTime(questionRemainingSeconds)}</span>
                </div>
              ) : null}
            </div>
          )}

          {currentEvaluation ? (
            <div className="rounded-3xl border border-border bg-secondary/40 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Last evaluation</p>
                  <p className="mt-1 text-2xl font-semibold">{currentEvaluation.score}%</p>
                </div>
                {currentEvaluation.transcript ? <Badge variant="info">Transcript captured</Badge> : null}
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Strengths</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(currentEvaluation.strengths || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold">Weaknesses</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(currentEvaluation.weaknesses || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold">Missing Concepts</p>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {(currentEvaluation.missing_concepts || []).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-semibold">Ideal Answer</p>
                  <p className="mt-2 text-sm text-muted-foreground">{currentEvaluation.ideal_answer || "—"}</p>
                </div>
              </div>
            </div>
          ) : null}

          {currentAnswerRecord ? (
            <div className="rounded-3xl border border-border p-5">
              <p className="text-sm font-semibold">Stored response</p>
              <p className="mt-2 text-sm text-muted-foreground">The latest response for this question has been saved to your interview history.</p>
            </div>
          ) : null}

          {error ? <ErrorMessage title="Session error" description={error} /> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={submitAnswer} isLoading={isSubmitting || isFetchingNext} disabled={Boolean(currentAnswerRecord) && isTextMode}>
              <Send className="mr-2 h-4 w-4" />
              Submit Answer
            </Button>
            {!isTextMode ? null : (
              <>
                <Button type="button" variant="outline" onClick={advanceToNextQuestion} isLoading={isFetchingNext} disabled={!pendingNextQuestion}>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Next Question
                </Button>
                <Button type="button" variant="outline" onClick={skipCurrentQuestion} isLoading={isSubmitting}>
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip Question
                </Button>
              </>
            )}
            <Button type="button" variant="outline" onClick={() => completeCurrentInterview(false)} isLoading={isCompleting}>
              End Interview
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Interview Progress</CardTitle>
              <CardDescription>Session status and pacing.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProgressBar value={progress} />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Questions Attempted</span>
              <span className="font-semibold">{currentQuestionIndex + 1}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Interview Mode</span>
              <span className="font-semibold capitalize">{currentMode}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Difficulty</span>
              <span className="font-semibold">{session.currentDifficulty || currentQuestion.difficulty}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Question Queue</CardTitle>
              <CardDescription>All generated questions for this session.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {session.questions.map((question, index) => {
              const response = session.responses?.find((item) => item.question_id === question.id);
              return (
                <div
                  key={question.id || `${question.question_text}-${index}`}
                  className={`rounded-2xl border p-4 ${index === currentQuestionIndex ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Question {index + 1}</p>
                    <Badge variant={index === currentQuestionIndex ? "info" : "default"}>{question.difficulty}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{question.question_text}</p>
                  {response ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {response.is_skipped ? "Skipped" : `Answered${response.score != null ? ` • ${response.score}%` : ""}`}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SessionPanel;
