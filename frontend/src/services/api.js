import axios from "axios";
import { readStorage, removeStorage, storageKeys, writeStorage } from "@/utils/storage";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL,
  timeout: 30000,
});

function normalizeSessionPayload(payload) {
  return {
    accessToken: payload.access_token ?? payload.accessToken ?? null,
    refreshToken: payload.refresh_token ?? payload.refreshToken ?? null,
    tokenType: payload.token_type ?? payload.tokenType ?? "bearer",
    expiresIn: payload.expires_in ?? payload.expiresIn ?? 0,
  };
}

export function loadAuthSession() {
  return readStorage(storageKeys.auth, null);
}

export function saveAuthSession(payload) {
  const current = loadAuthSession() ?? {};
  const next = {
    ...current,
    ...normalizeSessionPayload(payload),
  };
  writeStorage(storageKeys.auth, next);
  return next;
}

export function clearAuthSession() {
  removeStorage(storageKeys.auth);
}

async function refreshAuthSession() {
  const session = loadAuthSession();
  if (!session?.refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(`${baseURL}/auth/refresh`, {
    refresh_token: session.refreshToken,
  });

  return saveAuthSession(response.data);
}

api.interceptors.request.use((config) => {
  const session = loadAuthSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url ?? "";

    if (status === 401 && originalRequest && !originalRequest._retry && !url.includes("/auth/")) {
      const session = loadAuthSession();
      if (!session?.refreshToken) {
        clearAuthSession();
        window.location.assign("/login");
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        refreshPromise ||= refreshAuthSession().finally(() => {
          refreshPromise = null;
        });

        const refreshedSession = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAuthSession();
        window.location.assign("/login");
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
