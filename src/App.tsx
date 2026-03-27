import { useFormStore } from './store/useFormStore';
import { TopBar } from './components/layout/TopBar';
import { IdentityForm } from './components/identity/IdentityForm';
import { ModuleView } from './components/form/ModuleView';
import { ReportShell } from './components/report/ReportShell';
import './styles/app.css';

export default function App() {
  const phase = useFormStore((s) => s.phase);

  return (
    <div className="app">
      <TopBar />
      <main className="app-main">
        {phase === 'identity' && <IdentityForm />}
        {phase === 'form' && <ModuleView />}
        {phase === 'report' && <ReportShell />}
      </main>
    </div>
  );
}
