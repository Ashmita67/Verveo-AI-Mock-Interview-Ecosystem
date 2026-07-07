import api from "@/services/api";

export async function getAnalyticsOverview() {
  const { data } = await api.get("/analytics/overview");
  return data;
}

export async function getAnalyticsInterviews() {
  const { data } = await api.get("/analytics/interviews");
  return data.interviews ?? [];
}

export async function getAnalyticsSkills() {
  const { data } = await api.get("/analytics/skills");
  return data;
}
