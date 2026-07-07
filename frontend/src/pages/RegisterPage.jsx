import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";

function RegisterPage() {
  const [error, setError] = useState("");
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values) => {
      try {
        setError("");
        await registerUser({
          name: values.name,
          email: values.email,
          password: values.password,
        });
        navigate("/verify-otp", { replace: true, state: { email: values.email } });
      } catch (err) {
        setError(err?.response?.data?.detail || "We couldn't create your account. Please try again.");
      }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Get Started</p>
          <h1 className="mt-3 text-3xl font-semibold">Create your AI interview ecosystem</h1>
          <p className="mt-2 text-sm text-muted-foreground">Set up your workspace and start practicing with a premium, structured workflow.</p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full Name"
            placeholder="Alex Morgan"
            error={errors.name?.message}
            {...register("name", { required: "Your name is required." })}
          />
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
            type="password"
            placeholder="Create a secure password"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
            })}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword", {
              required: "Please confirm your password.",
              validate: (value) => value === getValues("password") || "Passwords do not match.",
            })}
          />
          {error ? <p className="md:col-span-2 text-sm text-destructive">{error}</p> : null}
          <div className="md:col-span-2">
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Register & Verify OTP
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default RegisterPage;
