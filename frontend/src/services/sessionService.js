import { readStorage, removeStorage, storageKeys, writeStorage } from "@/utils/storage";

export function loadInterviewSession() {
  return readStorage(storageKeys.interviewSession, null);
}

export function saveInterviewSession(session) {
  writeStorage(storageKeys.interviewSession, session);
  return session;
}

export function patchInterviewSession(patch) {
  const current = loadInterviewSession() ?? {};
  const next = { ...current, ...patch };
  writeStorage(storageKeys.interviewSession, next);
  return next;
}

export function clearInterviewSession() {
  removeStorage(storageKeys.interviewSession);
}
