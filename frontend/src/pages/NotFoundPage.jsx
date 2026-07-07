import { Link, useNavigate } from "react-router-dom";
import EmptyState from "@/components/common/EmptyState";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl">
        <EmptyState
          title="This page does not exist"
          description="The route you requested could not be found. Head back to the Verveo home page or return to your dashboard."
          actionLabel="Go Home"
          onAction={() => navigate("/")}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Looking for your workspace?{" "}
          <Link to="/dashboard" className="font-semibold text-primary">
            Open dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default NotFoundPage;
