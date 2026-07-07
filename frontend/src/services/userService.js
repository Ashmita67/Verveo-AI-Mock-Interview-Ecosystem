import api from "@/services/api";

export async function getCurrentUser() {
  const { data } = await api.get("/users/me");
  return data;
}

export async function updateCurrentUser(payload) {
  const { data } = await api.put("/users/me", payload);
  return data;
}
