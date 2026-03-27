import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useFormStore } from '../../store/useFormStore';
import { getModuleById } from '../../data/questionBank';
import { verifyAuth, fetchAIReport } from '../../services/api';
import type { Assessment, Level } from '../../types/assessment';

const LEVEL_KEYS: Record<Level, string> = {
  preL1: 'levelPreL1', l1: 'levelL1', seniorL1: 'levelSeniorL1',
  l2: 'levelL2', seniorL2: 'levelSeniorL2', l3: 'levelL3', manager: 'levelManager',
};

const CONF_KEYS: Record<string, string> = {
  wellCalibrated: 'confWellCalibrated',
  dunningKrugerRisk: 'confDunningKruger',
  hiddenTalent: 'confHiddenTalent',
  optimistic: 'confOptimistic',
  conservative: 'confConservative',
};

const SIGNAL_KEYS: Record<string, string> = {
  match: 'signalMatch',
  partial: 'signalPartial',
  recruiterVerification: 'signalRecruiterVerification',
};

export function RecruiterReport() {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const assessment = useFormStore((s) => s.assessment) as Assessment;
  const sessionId = useFormStore((s) => s.sessionId);
  const auth = useFormStore((s) => s.auth);
  const setAuth = useFormStore((s) => s.setAuth);
  const aiReport = useFormStore((s) => s.aiReport);
  const aiReportLoading = useFormStore((s) => s.aiReportLoading);
  const aiReportError = useFormStore((s) => s.aiReportError);
  const setAIReport = useFormStore((s) => s.setAIReport);
  const setAIReportLoading = useFormStore((s) => s.setAIReportLoading);
  const setAIReportError = useFormStore((s) => s.setAIReportError);

  // Google Login via implicit flow — returns access_token
  // We then exchange it for user info to get email/name
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user info from Google using the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        if (!userInfo.email?.endsWith('@bitlife.pl')) {
          setAIReportError(t('accessDenied'));
          return;
        }

        setAuth({
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          token: tokenResponse.access_token,
        });
      } catch (err) {
        console.error('[SOC] Google login verification failed:', err);
        setAIReportError(t('accessDenied'));
      }
    },
    onError: (err) => {
      console.error('[SOC] Google login error:', err);
    },
    scope: 'openid email profile',
  });

  // Auto-fetch AI report when auth is available
  const loadAIReport = useCallback(async () => {
    if (!auth || !sessionId || aiReport) return;

    setAIReportLoading(true);
    setAIReportError(null);

    try {
      const report = await fetchAIReport(sessionId, auth.token);
      setAIReport(report);
    } catch (err) {
      console.warn('[SOC] AI report not ready yet:', (err as Error).message);
      // Report may not be generated yet — this is expected for ~5-10s after submit
      setAIReportError((err as Error).message);
    } finally {
      setAIReportLoading(false);
    }
  }, [auth, sessionId, aiReport, setAIReport, setAIReportLoading, setAIReportError]);

  useEffect(() => {
    if (auth && !aiReport && !aiReportLoading) {
      loadAIReport();
    }
  }, [auth, aiReport, aiReportLoading, loadAIReport]);

  // ── Not logged in: show login gate ──
  if (!auth) {
    return (
      <div className="recruiter-gate">
        <p>{t('recruiterLoginRequired')}</p>
        <button className="btn btn-primary" onClick={() => googleLogin()}>
          {t('loginWithGoogle')}
        </button>
        {aiReportError && <p className="field-error" style={{ marginTop: 12 }}>{aiReportError}</p>}
      </div>
    );
  }

  if (!assessment) return null;

  const { classification, visitedModules, moduleResults, confidenceAnalysis, profileSignals, candidateSnapshot } = assessment;

  return (
    <div className="recruiter-report">
      <div className="recruiter-auth-info">
        {auth.name} ({auth.email})
        <button className="btn btn-ghost btn-sm" onClick={() => setAuth(null)}>
          {t('logout')}
        </button>
      </div>

      {/* Classification */}
      <section className="report-section">
        <h3>{t('recruiterLevel')}</h3>
        <div className="level-compare">
          <div>
            <span className="label">{t('baseLevel')}</span>
            <span className="level-badge">{t(LEVEL_KEYS[classification.baseLevel])}</span>
          </div>
          <div>
            <span className="label">{t('publicLevel')}</span>
            <span className="level-badge level-primary">{t(LEVEL_KEYS[classification.publicLevel])}</span>
          </div>
        </div>
      </section>

      {/* Module Results Table */}
      <section className="report-section">
        <h3>{t('recruiterModules')}</h3>
        <table className="results-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>{t('score')}</th>
              <th>{t('percent')}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visitedModules.map((mid) => {
              const mr = moduleResults[mid];
              const mod = getModuleById(mid);
              if (!mr || !mod) return null;
              return (
                <tr key={mid}>
                  <td>{mod.shortTitle[locale]}</td>
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

      {/* Confidence */}
      <section className="report-section">
        <h3>{t('recruiterConfidence')}</h3>
        {confidenceAnalysis.averageConfidence != null ? (
          <div className="confidence-grid">
            <div className="conf-cell">
              <span className="label">{t('confidenceAverage')}</span>
              <span className="value">{confidenceAnalysis.averageConfidence}/5</span>
            </div>
            <div className="conf-cell">
              <span className="label">{t('answerAccuracy')}</span>
              <span className="value">{((confidenceAnalysis.accuracy ?? 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="conf-cell">
              <span className="label">Calibration</span>
              <span className="value">{t(CONF_KEYS[confidenceAnalysis.key] ?? 'confWellCalibrated')}</span>
            </div>
          </div>
        ) : (
          <p className="muted">{t('noConfidenceData')}</p>
        )}
      </section>

      {/* Profile Signals */}
      <section className="report-section">
        <h3>{t('recruiterProfileSignals')}</h3>
        <div className={`signal-badge signal-${profileSignals.status}`}>
          {t(SIGNAL_KEYS[profileSignals.status] ?? 'signalMatch')}
          <span className="signal-count">({profileSignals.matchedSignals}/{profileSignals.totalSignals})</span>
        </div>
        {profileSignals.flags.length > 0 && (
          <ul className="flag-list">
            {profileSignals.flags.map((f) => (
              <li key={f} className="flag-item">{t('profileFlag')}: {f}</li>
            ))}
          </ul>
        )}
      </section>

      {/* Motivation */}
      <section className="report-section">
        <h3>{t('recruiterMotivation')}</h3>
        <div className="motivation-grid">
          {(['P6.1', 'P6.2', 'P6.3'] as const).map((key) => {
            const labels: Record<string, string> = {
              'P6.1': t('motivationFascination'),
              'P6.2': t('motivationGaps'),
              'P6.3': t('motivationGoal'),
            };
            const val = candidateSnapshot.motivations[key];
            return (
              <div key={key} className="motivation-card">
                <span className="label">{labels[key]}</span>
                <p>{val || '—'}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Report */}
      <section className="report-section">
        <h3>{t('recruiterAIReport')}</h3>
        {aiReportLoading && <p className="muted">{t('aiReportLoading')}</p>}
        {aiReport && (
          <div className="ai-report">
            <div className="ai-summary">{aiReport.summary}</div>
            <div className="ai-recommendation">
              <span className={`rec-badge rec-${aiReport.recommendation}`}>
                {aiReport.recommendation.toUpperCase()}
              </span>
              <p>{aiReport.recommendationRationale}</p>
            </div>
            {aiReport.strengths.length > 0 && (
              <div className="ai-section">
                <h4>Strengths</h4>
                <ul>{aiReport.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.weaknesses.length > 0 && (
              <div className="ai-section">
                <h4>Weaknesses</h4>
                <ul>{aiReport.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.interviewFocus.length > 0 && (
              <div className="ai-section">
                <h4>Interview Focus</h4>
                <ul>{aiReport.interviewFocus.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
            {aiReport.riskFlags.length > 0 && (
              <div className="ai-section ai-risk">
                <h4>Risk Flags</h4>
                <ul>{aiReport.riskFlags.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        {!aiReport && !aiReportLoading && aiReportError && (
          <div>
            <p className="muted">{t('aiReportError')}</p>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={loadAIReport}>
              Retry
            </button>
          </div>
        )}
        {!aiReport && !aiReportLoading && !aiReportError && (
          <p className="muted">{t('aiReportLoading')}</p>
        )}
      </section>
    </div>
  );
}
