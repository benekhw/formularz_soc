import { useTranslation } from 'react-i18next';
import { useAdminStore, type AdminView } from '../../store/useAdminStore';
import { AdminLogin } from './AdminLogin';
import { Dashboard } from './Dashboard';
import { CandidateList } from './CandidateList';
import { CandidateDetail } from './CandidateDetail';
import { CandidateCompare } from './CandidateCompare';
import { QuestionManager } from './QuestionManager';
import clsx from 'clsx';

const NAV_ITEMS: Array<{ view: AdminView; labelKey: string }> = [
  { view: 'dashboard', labelKey: 'navDashboard' },
  { view: 'list', labelKey: 'navCandidates' },
  { view: 'questions', labelKey: 'navQuestions' },
];

export function AdminPanel() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const view = useAdminStore((s) => s.view);
  const setView = useAdminStore((s) => s.setView);
  const logout = useAdminStore((s) => s.logout);

  if (!auth) {
    return <AdminLogin />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard />;
      case 'list':
        return <CandidateList />;
      case 'detail':
        return <CandidateDetail />;
      case 'compare':
        return <CandidateCompare />;
      case 'questions':
        return <QuestionManager />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h3>{t('adminTitle')}</h3>
          <div className="admin-user-info">
            <span>{auth.name}</span>
            <span className="muted">{auth.email}</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              className={clsx('admin-nav-btn', { active: view === item.view })}
              onClick={() => setView(item.view)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn btn-ghost btn-sm" onClick={logout}>{t('logout')}</button>
        </div>
      </aside>
      <div className="admin-content">
        {renderView()}
      </div>
    </div>
  );
}
