import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      await forgotPassword(values);
      navigate("/reset-password", { replace: true, state: { email: values.email } });
    } catch (err) {
      setError(err?.response?.data?.detail || "We couldn't start the reset flow. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Forgot Password</p>
          <h1 className="mt-3 text-3xl font-semibold">Request a reset OTP</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your email and we’ll send the reset step to your inbox.</p>
        </div>

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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Send Reset OTP
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary">
            Back to login
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default ForgotPasswordPage;
