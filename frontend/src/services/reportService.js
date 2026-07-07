import api from "@/services/api";

export async function getReport(interviewId) {
  const { data } = await api.get(`/reports/${interviewId}`);
  return data;
}

export async function generateReport(interviewId) {
  const { data } = await api.post("/reports/generate", { interview_id: interviewId });
  return data;
}
