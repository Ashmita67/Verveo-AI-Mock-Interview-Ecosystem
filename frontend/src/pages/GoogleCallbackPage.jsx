import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Loader from "@/components/common/Loader";
import ErrorMessage from "@/components/common/ErrorMessage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

let googleCallbackFlight = null;

function parseFragmentSession() {
  const fragment = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(fragment);
  return parseAuthParams(params);
}

function parseSearchSession(searchParams) {
  return parseAuthParams(searchParams);
}

function parseAuthParams(params) {
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: params.get("token_type") || "bearer",
    expires_in: Number(params.get("expires_in") || 0),
  };
}

function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { completeGoogleCallback } = useAuth();
  const [error, setError] = useState("");
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (hasProcessedRef.current) {
      return;
    }
    hasProcessedRef.current = true;

    if (googleCallbackFlight) {
      googleCallbackFlight
        .then(() => {
          navigate("/dashboard", { replace: true });
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || "Google login failed. Please try again.");
        });
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);
    const fragmentParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const authError = searchParams.get("error") || fragmentParams.get("error");
    if (authError) {
      window.history.replaceState(null, "", window.location.pathname);
      setError(authError);
      return;
    }

    const session = parseSearchSession(searchParams) || parseFragmentSession();
    if (!session) {
      window.history.replaceState(null, "", window.location.pathname);
      setError("Missing Google authentication data.");
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);

    if (!googleCallbackFlight) {
      googleCallbackFlight = completeGoogleCallback(session);
    }

    googleCallbackFlight
      .then(() => {
        navigate("/dashboard", { replace: true });
      })
      .catch((err) => {
        setError(err?.response?.data?.detail || "Google login failed. Please try again.");
      })
      .finally(() => {
        googleCallbackFlight = null;
      });
  }, [completeGoogleCallback, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg space-y-4">
          <ErrorMessage title="Google sign-in failed" description={error} />
          <div className="flex gap-3">
            <Link to="/login">
              <Button>Back to Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return <Loader label="Completing Google sign-in..." />;
}

export default GoogleCallbackPage;
