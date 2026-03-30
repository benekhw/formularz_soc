import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore, type CandidateDetail } from '../../store/useAdminStore';
import { fetchCandidateDetail } from '../../services/api';

const LEVEL_LABELS: Record<string, string> = {
  preL1: 'Pre-L1', l1: 'L1', seniorL1: 'Senior L1',
  l2: 'L2', seniorL2: 'Senior L2', l3: 'L3', manager: 'Manager',
};

const MODULE_IDS = ['M2', 'M3', 'M4', 'M5'];

export function CandidateCompare() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const compareList = useAdminStore((s) => s.compareList);
  const clearCompare = useAdminStore((s) => s.clearCompare);
  const setView = useAdminStore((s) => s.setView);

  const [details, setDetails] = useState<CandidateDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || compareList.length < 2) return;
    setLoading(true);

    Promise.all(
      compareList.map((sid) =>
        fetchCandidateDetail(sid, auth.token).then((data) => ({
          ...data,
          answersJson: JSON.stringify(data.answers),
          assessmentJson: JSON.stringify(data.assessment),
        })),
      ),
    )
      .then((results) => setDetails(results))
      .catch((err) => console.error('Compare fetch failed:', err))
      .finally(() => setLoading(false));
  }, [auth, compareList]);

  if (loading) return <div className="admin-loading">{t('loading')}</div>;

  if (details.length < 2) {
    return (
      <div className="compare-empty">
        <p>{t('compareMinTwo')}</p>
        <button className="btn btn-ghost" onClick={() => setView('list')}>{t('backToList')}</button>
      </div>
    );
  }

  // Extract assessment data for each candidate
  const assessments = details.map((d) => d.assessment as Record<string, unknown> || {});

  return (
    <div className="candidate-compare">
      <div className="compare-header">
        <button className="btn btn-ghost" onClick={() => { clearCompare(); setView('list'); }}>
          &larr; {t('backToList')}
        </button>
        <h3>{t('compareTitle')}</h3>
      </div>

      <table className="admin-table compare-table">
        <thead>
          <tr>
            <th>{t('field')}</th>
            {details.map((d) => (
              <th key={d.sessionId}>{d.firstName} {d.lastName}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Classification */}
          <tr>
            <td className="label">{t('publicLevel')}</td>
            {details.map((d) => (
              <td key={d.sessionId}>
                <span className={`level-badge level-${d.classification}`}>
                  {LEVEL_LABELS[d.classification] || d.classification}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="label">{t('baseLevel')}</td>
            {details.map((d) => (
              <td key={d.sessionId}>{LEVEL_LABELS[d.baseLevel] || d.baseLevel}</td>
            ))}
          </tr>
          <tr>
            <td className="label">{t('route')}</td>
            {details.map((d) => (
              <td key={d.sessionId} className="muted">{d.route}</td>
            ))}
          </tr>

          {/* Module scores */}
          {MODULE_IDS.map((mid) => (
            <tr key={mid}>
              <td className="label">{mid} {t('score')}</td>
              {assessments.map((a, i) => {
                const mr = ((a.moduleResults || {}) as Record<string, Record<string, unknown>>)[mid];
                if (!mr || !mr.technical) return <td key={i} className="muted">—</td>;
                const pct = Number(mr.percent) || 0;
                return (
                  <td key={i}>
                    <span className={mr.thresholdMet ? 'status-pass' : 'status-fail'}>
                      {pct}%
                    </span>
                    {' '}<span className="muted">({mr.score as number}/{mr.maxScore as number})</span>
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Confidence */}
          <tr>
            <td className="label">{t('confidenceAverage')}</td>
            {assessments.map((a, i) => {
              const ca = (a.confidenceAnalysis || {}) as Record<string, unknown>;
              return <td key={i}>{ca.averageConfidence != null ? `${ca.averageConfidence}/5` : '—'}</td>;
            })}
          </tr>

          {/* Gap */}
          <tr>
            <td className="label">{t('gapAnalysis')}</td>
            {assessments.map((a, i) => {
              const ga = (a.gapAnalysis || {}) as Record<string, unknown>;
              return <td key={i}>{String(ga.key || '—')}</td>;
            })}
          </tr>

          {/* AI Recommendation */}
          <tr>
            <td className="label">AI {t('recommendation')}</td>
            {details.map((d) => {
              const rec = d.aiReport?.recommendation;
              return (
                <td key={d.sessionId}>
                  {rec ? (
                    <span className={`rec-badge rec-${rec}`}>{rec.toUpperCase()}</span>
                  ) : '—'}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
