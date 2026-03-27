import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '../../store/useAdminStore';
import { fetchStats } from '../../services/api';

const LEVEL_LABELS: Record<string, string> = {
  preL1: 'Pre-L1', l1: 'L1', seniorL1: 'Senior L1',
  l2: 'L2', seniorL2: 'Senior L2', l3: 'L3', manager: 'Manager',
};

const LEVEL_ORDER = ['preL1', 'l1', 'seniorL1', 'l2', 'seniorL2', 'l3', 'manager'];
const MODULE_ORDER = ['M2', 'M3', 'M4', 'M5'];

export function Dashboard() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const stats = useAdminStore((s) => s.stats);
  const statsLoading = useAdminStore((s) => s.statsLoading);
  const setStats = useAdminStore((s) => s.setStats);
  const setStatsLoading = useAdminStore((s) => s.setStatsLoading);
  const setView = useAdminStore((s) => s.setView);
  const selectCandidate = useAdminStore((s) => s.selectCandidate);

  useEffect(() => {
    if (!auth || stats) return;
    setStatsLoading(true);
    fetchStats(auth.token)
      .then((data) => setStats(data))
      .catch((err) => console.error('Stats fetch failed:', err))
      .finally(() => setStatsLoading(false));
  }, [auth, stats, setStats, setStatsLoading]);

  if (statsLoading || !stats) {
    return <div className="admin-loading">{t('loading')}</div>;
  }

  const maxLevel = Math.max(...LEVEL_ORDER.map((l) => stats.levelBreakdown[l] || 0), 1);

  return (
    <div className="dashboard">
      {/* Summary cards */}
      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-card-value">{stats.totalCandidates}</span>
          <span className="dash-card-label">{t('totalCandidates')}</span>
        </div>
        {Object.entries(stats.recommendationBreakdown).map(([rec, count]) => (
          <div key={rec} className={`dash-card rec-card rec-${rec}`}>
            <span className="dash-card-value">{count as number}</span>
            <span className="dash-card-label">{rec.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Level distribution */}
      <section className="dash-section">
        <h3>{t('levelDistribution')}</h3>
        <div className="dash-bars">
          {LEVEL_ORDER.map((level) => {
            const count = stats.levelBreakdown[level] || 0;
            const pct = (count / maxLevel) * 100;
            return (
              <div key={level} className="dash-bar-row">
                <span className="dash-bar-label">{LEVEL_LABELS[level] || level}</span>
                <div className="dash-bar-track">
                  <div className={`dash-bar-fill level-${level}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="dash-bar-count">{count}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Module performance */}
      <section className="dash-section">
        <h3>{t('modulePerformance')}</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('module')}</th>
              <th>{t('avgScore')}</th>
              <th>{t('passRate')}</th>
            </tr>
          </thead>
          <tbody>
            {MODULE_ORDER.map((mid) => (
              <tr key={mid}>
                <td>{mid}</td>
                <td>{stats.avgScoresByModule[mid] ?? '—'}%</td>
                <td>{stats.passRatesByModule[mid] ?? '—'}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent candidates */}
      <section className="dash-section">
        <h3>
          {t('recentCandidates')}
          <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>
            {t('viewAll')}
          </button>
        </h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('name')}</th>
              <th>{t('levelLabel')}</th>
              <th>{t('route')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentCandidates.map((c) => (
              <tr
                key={c.sessionId}
                className="clickable-row"
                onClick={() => selectCandidate(c.sessionId)}
              >
                <td>{new Date(c.timestamp).toLocaleDateString()}</td>
                <td>{c.firstName} {c.lastName}</td>
                <td><span className={`level-badge level-${c.classification}`}>{LEVEL_LABELS[c.classification] || c.classification}</span></td>
                <td className="muted">{c.route}</td>
              </tr>
            ))}
            {stats.recentCandidates.length === 0 && (
              <tr><td colSpan={4} className="muted">{t('noCandidates')}</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
