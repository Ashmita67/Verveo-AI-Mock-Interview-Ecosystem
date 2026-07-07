import api from "@/services/api";

export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function verifyOtp(payload) {
  const { data } = await api.post("/auth/verify-otp", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function refreshSession(refreshToken) {
  const { data } = await api.post("/auth/refresh", { refresh_token: refreshToken });
  return data;
}

export async function logout(refreshToken) {
  if (!refreshToken) {
    return { detail: "Logged out successfully" };
  }
  const { data } = await api.post("/auth/logout", { refresh_token: refreshToken });
  return data;
}

export async function forgotPassword(payload) {
  const { data } = await api.post("/auth/forgot-password", payload);
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post("/auth/reset-password", payload);
  return data;
}

export async function getGoogleLoginUrl() {
  const { data } = await api.get("/auth/google/login");
  return data;
}

export async function completeGoogleLogin(code) {
  const { data } = await api.get("/auth/google/callback", { params: { code } });
  return data;
}

export const authService = {
  register,
  verifyOtp,
  login,
  refreshSession,
  logout,
  forgotPassword,
  resetPassword,
  getGoogleLoginUrl,
  completeGoogleLogin,
};
