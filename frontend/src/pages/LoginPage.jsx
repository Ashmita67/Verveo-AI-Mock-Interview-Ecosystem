import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

function LoginPage() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectTo = location.state?.from?.pathname || "/dashboard";
  const oauthError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "We couldn't sign you in. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Welcome Back</p>
          <h1 className="mt-3 text-3xl font-semibold">Log in to your Verveo workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">Continue your interview preparation with AI-guided insights.</p>
        </div>

        {oauthError ? <p className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{oauthError}</p> : null}

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required.",
              pattern: {
                value: /\S+@\S+\.\S+/,
                message: "Enter a valid email address.",
              },
            })}
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters.",
              },
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="-mt-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPassword ? "Hide password" : "Show password"}
          </button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Log In
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={async () => {
            try {
              await loginWithGoogle();
            } catch (err) {
              setError(err?.response?.data?.detail || "Google sign-in failed. Please try again.");
            }
          }}
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/forgot-password" className="font-semibold text-primary">
            Forgot password?
          </Link>
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to Verveo?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default LoginPage;
