import api from "@/services/api";

export async function listInterviews() {
  const { data } = await api.get("/interviews");
  return data.items ?? [];
}

export async function getInterview(interviewId) {
  const { data } = await api.get(`/interviews/${interviewId}`);
  return data;
}

export async function createInterview(payload) {
  const { data } = await api.post("/interviews", payload);
  return data;
}

export async function updateInterview(interviewId, payload) {
  const { data } = await api.patch(`/interviews/${interviewId}`, payload);
  return data;
}

export async function deleteInterview(interviewId) {
  const { data } = await api.delete(`/interviews/${interviewId}`);
  return data;
}

export async function startInterview(payload) {
  const { data } = await api.post("/interviews/start", payload);
  return data;
}

export async function evaluateText(payload) {
  const { data } = await api.post("/interviews/evaluate-text", payload);
  return data;
}

export async function evaluateAudio(interviewId, questionId, file) {
  const formData = new FormData();
  formData.append("interview_id", interviewId);
  formData.append("question_id", questionId);
  formData.append("file", file);
  const { data } = await api.post("/interviews/evaluate-audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function evaluateVideo(interviewId, questionId, file) {
  const formData = new FormData();
  formData.append("interview_id", interviewId);
  formData.append("question_id", questionId);
  formData.append("file", file);
  const { data } = await api.post("/interviews/evaluate-video", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getNextQuestion(payload) {
  const { data } = await api.post("/interviews/next-question", payload);
  return data.question ?? data;
}

export async function skipQuestion(payload) {
  const { data } = await api.post("/interviews/skip-question", payload);
  return data;
}

export async function completeInterview(payload) {
  const { data } = await api.post("/interviews/complete", payload);
  return data;
}
