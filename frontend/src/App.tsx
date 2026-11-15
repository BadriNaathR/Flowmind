import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/auth";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import OnboardingPage from "@/pages/OnboardingPage";
import DashboardPage from "@/pages/DashboardPage";
import CreateWorkflowPage from "@/pages/CreateWorkflowPage";
import AIProcessingPage from "@/pages/AIProcessingPage";
import ConfirmationPage from "@/pages/ConfirmationPage";
import WorkflowPreviewPage from "@/pages/WorkflowPreviewPage";
import TestRunPage from "@/pages/TestRunPage";
import WorkflowDetailPage from "@/pages/WorkflowDetailPage";
import RunHistoryPage from "@/pages/RunHistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/workflow/create" element={<CreateWorkflowPage />} />
          <Route path="/workflow/create/processing" element={<AIProcessingPage />} />
          <Route path="/workflow/create/confirm" element={<ConfirmationPage />} />
          <Route path="/workflow/create/preview" element={<WorkflowPreviewPage />} />
          <Route path="/workflow/create/test" element={<TestRunPage />} />
          <Route path="/workflow/test" element={<TestRunPage />} />
          <Route path="/workflow/:id/history" element={<RunHistoryPage />} />
          <Route path="/workflow/:id" element={<WorkflowDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
