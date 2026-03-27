import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '../../store/useAdminStore';
import { fetchCandidates } from '../../services/api';
import clsx from 'clsx';

const LEVEL_LABELS: Record<string, string> = {
  preL1: 'Pre-L1', l1: 'L1', seniorL1: 'Senior L1',
  l2: 'L2', seniorL2: 'Senior L2', l3: 'L3', manager: 'Manager',
};

const LEVEL_OPTIONS = ['', 'preL1', 'l1', 'seniorL1', 'l2', 'seniorL2', 'l3', 'manager'];

export function CandidateList() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const candidates = useAdminStore((s) => s.candidates);
  const loading = useAdminStore((s) => s.candidatesLoading);
  const error = useAdminStore((s) => s.candidatesError);
  const setCandidates = useAdminStore((s) => s.setCandidates);
  const setCandidatesLoading = useAdminStore((s) => s.setCandidatesLoading);
  const setCandidatesError = useAdminStore((s) => s.setCandidatesError);
  const filters = useAdminStore((s) => s.filters);
  const setFilter = useAdminStore((s) => s.setFilter);
  const selectCandidate = useAdminStore((s) => s.selectCandidate);
  const compareList = useAdminStore((s) => s.compareList);
  const addToCompare = useAdminStore((s) => s.addToCompare);
  const removeFromCompare = useAdminStore((s) => s.removeFromCompare);
  const setView = useAdminStore((s) => s.setView);

  useEffect(() => {
    if (!auth || candidates.length > 0) return;
    setCandidatesLoading(true);
    fetchCandidates(auth.token)
      .then((data) => setCandidates(data.candidates))
      .catch((err) => setCandidatesError(err.message))
      .finally(() => setCandidatesLoading(false));
  }, [auth, candidates.length, setCandidates, setCandidatesLoading, setCandidatesError]);

  const filtered = useMemo(() => {
    let result = [...candidates];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(q),
      );
    }

    if (filters.level) {
      result = result.filter((c) => c.classification === filters.level);
    }

    result.sort((a, b) => {
      const dir = filters.sortDir === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'name':
          return dir * `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'level':
          return dir * (a.classification || '').localeCompare(b.classification || '');
        default:
          return dir * (a.timestamp || '').localeCompare(b.timestamp || '');
      }
    });

    return result;
  }, [candidates, filters]);

  const toggleSort = (col: 'date' | 'name' | 'level') => {
    if (filters.sortBy === col) {
      setFilter({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' });
    } else {
      setFilter({ sortBy: col, sortDir: 'desc' });
    }
  };

  const sortIcon = (col: string) =>
    filters.sortBy === col ? (filters.sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';

  if (loading) return <div className="admin-loading">{t('loading')}</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="candidate-list">
      {/* Filters */}
      <div className="list-filters">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="filter-input"
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <select
          className="filter-select"
          value={filters.level}
          onChange={(e) => setFilter({ level: e.target.value })}
        >
          {LEVEL_OPTIONS.map((l) => (
            <option key={l} value={l}>{l ? LEVEL_LABELS[l] : t('allLevels')}</option>
          ))}
        </select>
        {compareList.length >= 2 && (
          <button className="btn btn-primary btn-sm" onClick={() => setView('compare')}>
            {t('compare')} ({compareList.length})
          </button>
        )}
      </div>

      <div className="list-count">{filtered.length} {t('candidates')}</div>

      {/* Table */}
      <table className="admin-table">
        <thead>
          <tr>
            <th className="th-check" />
            <th className="sortable" onClick={() => toggleSort('date')}>
              {t('date')}{sortIcon('date')}
            </th>
            <th className="sortable" onClick={() => toggleSort('name')}>
              {t('name')}{sortIcon('name')}
            </th>
            <th>{t('email')}</th>
            <th className="sortable" onClick={() => toggleSort('level')}>
              {t('levelLabel')}{sortIcon('level')}
            </th>
            <th>{t('baseLevel')}</th>
            <th>{t('route')}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => {
            const inCompare = compareList.includes(c.sessionId);
            return (
              <tr key={c.sessionId} className={clsx('clickable-row', { 'compare-selected': inCompare })}>
                <td className="td-check" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={inCompare}
                    onChange={() => inCompare ? removeFromCompare(c.sessionId) : addToCompare(c.sessionId)}
                  />
                </td>
                <td onClick={() => selectCandidate(c.sessionId)}>
                  {new Date(c.timestamp).toLocaleDateString()}
                </td>
                <td onClick={() => selectCandidate(c.sessionId)}>
                  {c.firstName} {c.lastName}
                </td>
                <td onClick={() => selectCandidate(c.sessionId)} className="muted">
                  {c.email}
                </td>
                <td onClick={() => selectCandidate(c.sessionId)}>
                  <span className={`level-badge level-${c.classification}`}>
                    {LEVEL_LABELS[c.classification] || c.classification}
                  </span>
                </td>
                <td onClick={() => selectCandidate(c.sessionId)}>
                  {LEVEL_LABELS[c.baseLevel] || c.baseLevel}
                </td>
                <td onClick={() => selectCandidate(c.sessionId)} className="muted">
                  {c.route}
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr><td colSpan={7} className="muted">{t('noCandidates')}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
