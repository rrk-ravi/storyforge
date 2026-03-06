import { Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/AdminRoute";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminModerationPage } from "./pages/AdminModerationPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { StoryEditorPage } from "./pages/StoryEditorPage";
import { StoryPage } from "./pages/StoryPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";

const App = () => {
  return (
    <div className="app-bg">
      <div className="aurora aurora--one" />
      <div className="aurora aurora--two" />

      <Navbar />

      <main className="container page-shell">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/stories/:slug" element={<StoryPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/stories/new" element={<StoryEditorPage />} />
            <Route path="/stories/:id/edit" element={<StoryEditorPage />} />
          </Route>

          <Route element={<AdminRoute />}>
            <Route path="/admin/moderation" element={<AdminModerationPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <p>StoryForge - a modern publishing platform for short-form storytellers.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
