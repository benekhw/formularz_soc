import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '../../store/useAdminStore';
import { refreshQuestionCache } from '../../services/api';
import { getQuestionSource, getModules, getQuestionBank } from '../../data/questionBank';

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/18ZW2w2Vw41Q65fPeB1hxBdIz73AcodRLXzPveyfg8jI/edit';

export function QuestionManager() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<string | null>(null);

  const modules = getModules();
  const questions = getQuestionBank();
  const source = getQuestionSource();

  const handleRefresh = async () => {
    if (!auth) return;
    setRefreshing(true);
    setRefreshResult(null);
    try {
      const result = await refreshQuestionCache(auth.token);
      setLastRefresh(result.timestamp);
      setRefreshResult(`${result.modulesCount} modules, ${result.questionsCount} questions`);
    } catch (err) {
      setRefreshResult(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="question-manager">
      <h3>{t('questionManagement')}</h3>

      <div className="qm-info">
        <div className="qm-stat">
          <span className="label">{t('dataSource')}</span>
          <span className={`source-badge source-${source}`}>{source}</span>
        </div>
        <div className="qm-stat">
          <span className="label">{t('totalModules')}</span>
          <span className="value">{modules.length}</span>
        </div>
        <div className="qm-stat">
          <span className="label">{t('totalQuestions')}</span>
          <span className="value">{questions.length}</span>
        </div>
        {lastRefresh && (
          <div className="qm-stat">
            <span className="label">{t('lastSync')}</span>
            <span className="value">{new Date(lastRefresh).toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="qm-actions">
        <a href={SHEETS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
          {t('openSheets')}
        </a>
        <button className="btn btn-primary" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? t('refreshing') : t('refreshCache')}
        </button>
      </div>

      {refreshResult && <p className="qm-result">{refreshResult}</p>}

      {/* Modules overview */}
      <table className="admin-table" style={{ marginTop: 24 }}>
        <thead>
          <tr>
            <th>{t('module')}</th>
            <th>{t('questions')}</th>
            <th>{t('threshold')}</th>
            <th>{t('type')}</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((m) => {
            const qCount = questions.filter((q) => q.moduleId === m.id).length;
            return (
              <tr key={m.id}>
                <td>{m.id} — {m.title.pl || m.title.en}</td>
                <td>{qCount}</td>
                <td>{m.thresholdPercent ? `${m.thresholdPercent}%` : '—'}</td>
                <td>{m.technical ? 'Technical' : 'Non-technical'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
