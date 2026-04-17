import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Layout from "./components/Layout";
import NavbarLayout from "./components/NavbarLayout";
import HomePage from "./pages/HomePage";
import GeneratePage from "./pages/GeneratePage";
import ModelPaperPage from "./pages/ModelPaperPage";
import UploadPage from "./pages/UploadPage";
import SettingsPage from "./pages/SettingsPage";
import ModelPaperSetupPage from "./pages/ModelPaperSetupPage";
// Pages (WITHOUT layout)
import ModelPaperExamPage from "./pages/ModelPaperExamPage";
import ModelPaperResultsPage from "./pages/ModelPaperResultsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyCodePage from "./pages/VerifyCodePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ResetSuccessPage from "./pages/ResetSuccessPage";
import ProgressPage from "./pages/ProgressPage";
import CalendarPage from "./pages/CalendarPage";
import AdaptiveRevisionPage from "./pages/AdaptiveRevisionPage";
import StudyPlansPage from "./pages/StudyPlansPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-success" element={<ResetSuccessPage />} />

        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected single pages */}
        <Route
          path="/model-paper/:slug/paper"
          element={
            <ProtectedRoute>
              <NavbarLayout>
                <ModelPaperExamPage />
              </NavbarLayout>
            </ProtectedRoute>
          }
        />
        {/* Protected app */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/generate" element={<GeneratePage />} />
                  <Route path="/model-paper" element={<ModelPaperPage />} />
                  <Route
                    path="/model-paper/:slug"
                    element={<ModelPaperSetupPage />}
                  />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route
                    path="/model-paper/:slug/results"
                    element={<ModelPaperResultsPage />}
                  />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/revision" element={<AdaptiveRevisionPage />} />
                  <Route path="/study-plans" element={<StudyPlansPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
