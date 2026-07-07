import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  forgotPassword as forgotPasswordRequest,
  getGoogleLoginUrl,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshSessionRequest,
  register as registerRequest,
  resetPassword as resetPasswordRequest,
  verifyOtp as verifyOtpRequest,
} from "@/services/authService";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "@/services/api";
import { getCurrentUser } from "@/services/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const googleCallbackPromiseRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const session = loadAuthSession();
      if (!session?.accessToken) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        clearAuthSession();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (payload) => {
    const session = await loginRequest(payload);
    saveAuthSession(session);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    toast.success("Welcome back to Verveo.");
    return { ...session, user: currentUser };
  }, []);

  const register = useCallback(async (payload) => {
    const response = await registerRequest(payload);
    toast.success("OTP sent to your email.");
    return response;
  }, []);

  const verifyOtp = useCallback(async (payload) => {
    const session = await verifyOtpRequest(payload);
    clearAuthSession();
    toast.success("Account verified. Your account is ready.");
    return session;
  }, []);

  const forgotPassword = useCallback(async (payload) => {
    const response = await forgotPasswordRequest(payload);
    toast.success("If the account exists, an OTP has been sent.");
    return response;
  }, []);

  const resetPassword = useCallback(async (payload) => {
    const response = await resetPasswordRequest(payload);
    toast.success("Password reset successfully.");
    return response;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { auth_url: authUrl } = await getGoogleLoginUrl();
    if (authUrl) {
      window.location.assign(authUrl);
    }
  }, []);

  const completeGoogleCallback = useCallback(async (session) => {
    if (googleCallbackPromiseRef.current) {
      return googleCallbackPromiseRef.current;
    }

    googleCallbackPromiseRef.current = (async () => {
      saveAuthSession(session);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      toast.success("Google sign-in completed.");
      return { ...session, user: currentUser };
    })();

    try {
      return await googleCallbackPromiseRef.current;
    } finally {
      googleCallbackPromiseRef.current = null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return currentUser;
  }, []);

  const refreshSession = useCallback(async () => {
    const session = loadAuthSession();
    if (!session?.refreshToken) {
      return null;
    }
    const refreshed = await refreshSessionRequest(session.refreshToken);
    saveAuthSession(refreshed);
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    return refreshed;
  }, []);

  const logout = useCallback(async () => {
    const session = loadAuthSession();
    try {
      if (session?.refreshToken) {
        await logoutRequest(session.refreshToken);
      }
    } finally {
      clearAuthSession();
      setUser(null);
      toast.success("You have been signed out.");
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      verifyOtp,
      forgotPassword,
      resetPassword,
      loginWithGoogle,
      completeGoogleCallback,
      refreshUser,
      refreshSession,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      register,
      verifyOtp,
      forgotPassword,
      resetPassword,
      loginWithGoogle,
      completeGoogleCallback,
      refreshUser,
      refreshSession,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
