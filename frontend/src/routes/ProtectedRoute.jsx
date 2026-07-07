import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/context/AuthContext";

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader label="Restoring your Verveo workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
