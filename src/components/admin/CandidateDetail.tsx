import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminStore } from '../../store/useAdminStore';
import { fetchCandidateDetail } from '../../services/api';
import type { AIReport } from '../../types/assessment';

const LEVEL_LABELS: Record<string, string> = {
  preL1: 'Pre-L1', l1: 'L1', seniorL1: 'Senior L1',
  l2: 'L2', seniorL2: 'Senior L2', l3: 'L3', manager: 'Manager',
};

const CONF_LABELS: Record<string, string> = {
  wellCalibrated: 'Well Calibrated',
  dunningKrugerRisk: 'Dunning-Kruger Risk',
  hiddenTalent: 'Hidden Talent',
  optimistic: 'Optimistic',
  conservative: 'Conservative',
};

const GAP_LABELS: Record<string, string> = {
  accurate: 'Accurate',
  moderateOverestimate: 'Moderate Overestimate',
  strongOverestimate: 'Strong Overestimate',
  underestimate: 'Underestimate',
  hiddenTalent: 'Hidden Talent',
};

const SIGNAL_LABELS: Record<string, string> = {
  match: 'Match', partial: 'Partial', recruiterVerification: 'Recruiter Verification',
};

export function CandidateDetail() {
  const { t } = useTranslation();
  const auth = useAdminStore((s) => s.auth);
  const sessionId = useAdminStore((s) => s.selectedSessionId);
  const detail = useAdminStore((s) => s.selectedDetail);
  const loading = useAdminStore((s) => s.detailLoading);
  const error = useAdminStore((s) => s.detailError);
  const setDetail = useAdminStore((s) => s.setSelectedDetail);
  const setLoading = useAdminStore((s) => s.setDetailLoading);
  const setError = useAdminStore((s) => s.setDetailError);
  const setView = useAdminStore((s) => s.setView);

  useEffect(() => {
    if (!auth || !sessionId || detail) return;
    setLoading(true);
    fetchCandidateDetail(sessionId, auth.token)
      .then((data) => setDetail({
        ...data,
        answersJson: JSON.stringify(data.answers),
        assessmentJson: JSON.stringify(data.assessment),
      }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth, sessionId, detail, setDetail, setLoading, setError]);

  if (loading) return <div className="admin-loading">{t('loading')}</div>;
  if (error) return <div className="admin-error">{error}</div>;
  if (!detail) return null;

  const assessment = detail.assessment as Record<string, unknown> || {};
  const classification = assessment.classification as Record<string, unknown> || {};
  const moduleResults = (assessment.moduleResults || {}) as Record<string, Record<string, unknown>>;
  const visitedModules = (assessment.visitedModules || []) as string[];
  const confidenceAnalysis = (assessment.confidenceAnalysis || {}) as Record<string, unknown>;
  const gapAnalysis = (assessment.gapAnalysis || {}) as Record<string, unknown>;
  const profileSignals = (assessment.profileSignals || {}) as Record<string, unknown>;
  const candidateSnapshot = (assessment.candidateSnapshot || {}) as Record<string, unknown>;
  const motivations = (candidateSnapshot.motivations || {}) as Record<string, string>;
  const aiReport = detail.aiReport as AIReport | null;

  return (
    <div className="candidate-detail">
      <button className="btn btn-ghost" onClick={() => { setView('list'); setDetail(null); }}>
        &larr; {t('backToList')}
      </button>

      {/* Identity */}
      <section className="detail-section">
        <h3>{t('candidateInfo')}</h3>
        <div className="detail-grid">
          <div><span className="label">{t('name')}</span><span>{detail.firstName} {detail.lastName}</span></div>
          <div><span className="label">{t('email')}</span><span>{detail.email}</span></div>
          <div><span className="label">{t('location')}</span><span>{detail.continent}, {detail.country}</span></div>
          <div><span className="label">{t('date')}</span><span>{new Date(detail.timestamp).toLocaleString()}</span></div>
          <div><span className="label">{t('route')}</span><span>{detail.route}</span></div>
        </div>
      </section>

      {/* Classification */}
      <section className="detail-section">
        <h3>{t('recruiterLevel')}</h3>
        <div className="level-compare">
          <div>
            <span className="label">{t('baseLevel')}</span>
            <span className={`level-badge level-${classification.baseLevel}`}>
              {LEVEL_LABELS[classification.baseLevel as string] || String(classification.baseLevel)}
            </span>
          </div>
          <div>
            <span className="label">{t('publicLevel')}</span>
            <span className={`level-badge level-primary level-${classification.publicLevel}`}>
              {LEVEL_LABELS[classification.publicLevel as string] || String(classification.publicLevel)}
            </span>
          </div>
        </div>
      </section>

      {/* Module Results */}
      <section className="detail-section">
        <h3>{t('recruiterModules')}</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('module')}</th>
              <th>{t('score')}</th>
              <th>{t('percent')}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visitedModules.map((mid) => {
              const mr = moduleResults[mid];
              if (!mr) return null;
              return (
                <tr key={mid}>
                  <td>{mid}</td>
                  <td>{mr.technical ? `${mr.score}/${mr.maxScore}` : '—'}</td>
                  <td>{mr.technical ? `${mr.percent}%` : '—'}</td>
                  <td>
                    {mr.thresholdMet === true && <span className="status-pass">{t('thresholdMet')}</span>}
                    {mr.thresholdMet === false && <span className="status-fail">{t('thresholdMissed')}</span>}
                    {mr.thresholdMet === null && <span className="status-na">{t('notApplicable')}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Confidence Analysis */}
      <section className="detail-section">
        <h3>{t('recruiterConfidence')}</h3>
        {confidenceAnalysis.averageConfidence != null ? (
          <div className="confidence-grid">
            <div className="conf-cell">
              <span className="label">{t('confidenceAverage')}</span>
              <span className="value">{String(confidenceAnalysis.averageConfidence)}/5</span>
            </div>
            <div className="conf-cell">
              <span className="label">{t('answerAccuracy')}</span>
              <span className="value">{((Number(confidenceAnalysis.accuracy) || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="conf-cell">
              <span className="label">Calibration</span>
              <span className="value">{CONF_LABELS[confidenceAnalysis.key as string] || String(confidenceAnalysis.key)}</span>
            </div>
          </div>
        ) : (
          <p className="muted">{t('noConfidenceData')}</p>
        )}
      </section>

      {/* Gap Analysis */}
      <section className="detail-section">
        <h3>{t('gapAnalysis')}</h3>
        <div className="detail-grid">
          <div>
            <span className="label">{t('declaredLevel')}</span>
            <span>{String(gapAnalysis.declaredLevel || '—')}</span>
          </div>
          <div>
            <span className="label">{t('achievedLevel')}</span>
            <span>{String(gapAnalysis.achievedLevel || '—')}</span>
          </div>
          <div>
            <span className="label">{t('verdict')}</span>
            <span className={`gap-badge gap-${gapAnalysis.key}`}>
              {GAP_LABELS[gapAnalysis.key as string] || String(gapAnalysis.key)}
            </span>
          </div>
        </div>
      </section>

      {/* Profile Signals */}
      <section className="detail-section">
        <h3>{t('recruiterProfileSignals')}</h3>
        <div className={`signal-badge signal-${profileSignals.status}`}>
          {SIGNAL_LABELS[profileSignals.status as string] || String(profileSignals.status)}
          <span className="signal-count">({String(profileSignals.matchedSignals)}/{String(profileSignals.totalSignals)})</span>
        </div>
        {Array.isArray(profileSignals.flags) && profileSignals.flags.length > 0 && (
          <ul className="flag-list">
            {(profileSignals.flags as string[]).map((f) => (
              <li key={f} className="flag-item">{f}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Motivation */}
      <section className="detail-section">
        <h3>{t('recruiterMotivation')}</h3>
        <div className="motivation-grid">
          {(['P6.1', 'P6.2', 'P6.3'] as const).map((key) => {
            const labels: Record<string, string> = {
              'P6.1': t('motivationFascination'),
              'P6.2': t('motivationGaps'),
              'P6.3': t('motivationGoal'),
            };
            return (
              <div key={key} className="motivation-card">
                <span className="label">{labels[key]}</span>
                <p>{motivations[key] || '—'}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Report */}
      <section className="detail-section">
        <h3>{t('recruiterAIReport')}</h3>
        {aiReport ? (
          <div className="ai-report">
            <div className="ai-summary">{aiReport.summary}</div>
            <div className="ai-recommendation">
              <span className={`rec-badge rec-${aiReport.recommendation}`}>
                {aiReport.recommendation.toUpperCase()}
              </span>
              <p>{aiReport.recommendationRationale}</p>
            </div>
            {aiReport.strengths?.length > 0 && (
              <div className="ai-section">
                <h4>Strengths</h4>
                <ul>{aiReport.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.weaknesses?.length > 0 && (
              <div className="ai-section">
                <h4>Weaknesses</h4>
                <ul>{aiReport.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.interviewFocus?.length > 0 && (
              <div className="ai-section">
                <h4>Interview Focus</h4>
                <ul>{aiReport.interviewFocus.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.riskFlags?.length > 0 && (
              <div className="ai-section ai-risk">
                <h4>Risk Flags</h4>
                <ul>{aiReport.riskFlags.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        ) : (
          <p className="muted">{t('aiReportNotReady')}</p>
        )}
      </section>

      {/* Raw answers (expandable) */}
      <details className="detail-section raw-data">
        <summary>{t('rawAnswers')}</summary>
        <pre>{JSON.stringify(detail.answers, null, 2)}</pre>
      </details>
    </div>
  );
}
