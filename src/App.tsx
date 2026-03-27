import { Routes, Route } from 'react-router-dom';
import { useFormStore } from './store/useFormStore';
import { useLoadQuestions } from './hooks/useLoadQuestions';
import { TopBar } from './components/layout/TopBar';
import { IdentityForm } from './components/identity/IdentityForm';
import { ModuleView } from './components/form/ModuleView';
import { ReportShell } from './components/report/ReportShell';
import { AdminPanel } from './components/admin/AdminPanel';
import './styles/app.css';

function FormApp() {
  const phase = useFormStore((s) => s.phase);
  const { loading: questionsLoading } = useLoadQuestions();

  if (questionsLoading && phase === 'identity') {
    return <div className="loading-questions">Loading...</div>;
  }

  return (
    <>
      {phase === 'identity' && <IdentityForm />}
      {phase === 'form' && <ModuleView />}
      {phase === 'report' && <ReportShell />}
    </>
  );
}

export default function App() {
  return (
    <div className="app">
      <Routes>
        <Route
          path="/admin/*"
          element={
            <>
              <TopBar />
              <main className="app-main">
                <AdminPanel />
              </main>
            </>
          }
        />
        <Route
          path="*"
          element={
            <>
              <TopBar />
              <main className="app-main">
                <FormApp />
              </main>
            </>
          }
        />
      </Routes>
    </div>
  );
}
