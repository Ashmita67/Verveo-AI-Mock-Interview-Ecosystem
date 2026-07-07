import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

function ResetPasswordPage() {
  const [error, setError] = useState("");
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: location.state?.email || "",
      otp: "",
      new_password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      await resetPassword({
        email: values.email,
        otp: values.otp,
        new_password: values.new_password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Password reset failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Reset Password</p>
          <h1 className="mt-3 text-3xl font-semibold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verify your OTP and create a fresh password.</p>
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
          <Input
            label="OTP"
            placeholder="123456"
            error={errors.otp?.message}
            {...register("otp", {
              required: "OTP is required.",
            })}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Create a new password"
            error={errors.new_password?.message}
            {...register("new_password", {
              required: "New password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
            })}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password.",
              validate: (value) => value === getValues("new_password") || "Passwords do not match.",
            })}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
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

export default ResetPasswordPage;
