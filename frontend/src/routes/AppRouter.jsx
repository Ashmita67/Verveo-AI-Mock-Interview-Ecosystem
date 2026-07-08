import { Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import OtpVerificationPage from "@/pages/OtpVerificationPage";
import AccountCreatedPage from "@/pages/AccountCreatedPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import GoogleCallbackPage from "@/pages/GoogleCallbackPage";
import DashboardPage from "@/pages/DashboardPage";
import ResumeManagementPage from "@/pages/ResumeManagementPage";
import ResumeDetailsPage from "@/pages/ResumeDetailsPage";
import InterviewCreationPage from "@/pages/InterviewCreationPage";
import InterviewSessionPage from "@/pages/InterviewSessionPage";
import ReportsPage from "@/pages/ReportsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import NotFoundPage from "@/pages/NotFoundPage";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<OtpVerificationPage />} />
      <Route path="/account-created" element={<AccountCreatedPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/interviews/create" element={<InterviewCreationPage />} />
        <Route path="/interviews/session" element={<InterviewSessionPage />} />
        <Route path="/interviews/session/:id" element={<InterviewSessionPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportsPage />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumeManagementPage />} />
          <Route path="/resume/:resumeId" element={<ResumeDetailsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default AppRouter;
