import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

function OtpVerificationPage() {
  const [error, setError] = useState("");
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: location.state?.email || "",
      otp: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      await verifyOtp(values);
      navigate("/account-created", { replace: true, state: { email: values.email } });
    } catch (err) {
      setError(err?.response?.data?.detail || "OTP verification failed. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Verify Account</p>
          <h1 className="mt-3 text-3xl font-semibold">Enter the OTP sent to your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">Complete registration to activate your account.</p>
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
              minLength: { value: 4, message: "OTP must be at least 4 digits." },
            })}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Verify Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already verified?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default OtpVerificationPage;
