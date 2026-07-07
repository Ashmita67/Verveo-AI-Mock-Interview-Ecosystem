import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function AccountCreatedPage() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-primary">Account Created</p>
          <h1 className="mt-3 text-3xl font-semibold">Your account is ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {email ? `${email} has been verified successfully.` : "Your email has been verified successfully."}
          </p>
        </div>

        <div className="mt-8 space-y-3">
          <Link to="/login" className="block">
            <Button className="w-full">Continue to Login</Button>
          </Link>
          <p className="text-center text-sm text-muted-foreground">
            You can now sign in using your verified credentials.
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AccountCreatedPage;
