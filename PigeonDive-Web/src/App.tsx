import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { Dots } from "./components/ui";
import { ActivityPage } from "./pages/Activity";
import { ComposePage } from "./pages/Compose";
import { LoginPage } from "./pages/Login";
import { SettingsPage } from "./pages/Settings";
import { TemplatesPage } from "./pages/Templates";

// CodeMirror is heavy, so the editor loads only when a template is opened.
const TemplateEditorPage = lazy(() => import("./pages/TemplateEditor").then((m) => ({ default: m.TemplateEditorPage })));

const editorFallback = (
  <div className="flex justify-center py-24 text-ink-3">
    <Dots />
  </div>
);

export function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center text-ink-3">{<Dots />}</div>;
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ComposePage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route
          path="templates/new"
          element={
            <Suspense fallback={editorFallback}>
              <TemplateEditorPage />
            </Suspense>
          }
        />
        <Route
          path="templates/:id"
          element={
            <Suspense fallback={editorFallback}>
              <TemplateEditorPage />
            </Suspense>
          }
        />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
