import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import { getModuleById } from '../../data/questionBank';
import type { Assessment, Level, DevelopmentArea } from '../../types/assessment';

const LEVEL_KEYS: Record<Level, string> = {
  preL1: 'levelPreL1', l1: 'levelL1', seniorL1: 'levelSeniorL1',
  l2: 'levelL2', seniorL2: 'levelSeniorL2', l3: 'levelL3', manager: 'levelManager',
};

const DEV_KEYS: Record<DevelopmentArea, string> = {
  fundamentals: 'devFundamentals',
  incidentAnalysis: 'devIncidentAnalysis',
  huntingForensics: 'devHuntingForensics',
  strategyLeadership: 'devStrategyLeadership',
  confidenceCalibration: 'devConfidenceCalibration',
};

const GAP_KEYS: Record<string, string> = {
  accurate: 'gapAccurate',
  moderateOverestimate: 'gapModerateOverestimate',
  strongOverestimate: 'gapStrongOverestimate',
  underestimate: 'gapUnderestimate',
  hiddenTalent: 'gapHiddenTalent',
};

export function CandidateReport() {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const assessment = useFormStore((s) => s.assessment) as Assessment;

  if (!assessment) return null;

  const { classification, visitedModules, moduleResults, gapAnalysis, developmentAreas } = assessment;

  return (
    <div className="candidate-report">
      {/* Level */}
      <section className="report-section">
        <h3>{t('candidateLevel')}</h3>
        <div className="level-badge level-large">
          {t(LEVEL_KEYS[classification.publicLevel])}
        </div>
        {classification.insights.length > 0 && (
          <div className="insight-tags">
            {classification.insights.map((ins) => (
              <span key={ins} className="insight-tag">
                {t(`insight${ins.charAt(0).toUpperCase() + ins.slice(1)}` as 'insightManagerPotential')}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Module scores */}
      <section className="report-section">
        <h3>{t('moduleResults')}</h3>
        <div className="module-chips">
          {visitedModules.map((mid) => {
            const mr = moduleResults[mid];
            const mod = getModuleById(mid);
            if (!mr || !mod) return null;
            return (
              <div key={mid} className="module-chip">
                <span className="chip-label">{mod.shortTitle[locale]}</span>
                {mr.technical ? (
                  <>
                    <span className="chip-score">{mr.percent}%</span>
                    <span className={`chip-status ${mr.thresholdMet ? 'pass' : 'fail'}`}>
                      {mr.thresholdMet ? t('thresholdMet') : t('thresholdMissed')}
                    </span>
                  </>
                ) : (
                  <span className="chip-score muted">{t('notApplicable')}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Gap */}
      <section className="report-section">
        <h3>{t('recruiterGap')}</h3>
        <div className="gap-card">
          <div className="gap-row">
            <span>{t('declaredLevel')}</span>
            <strong>{t(LEVEL_KEYS[gapAnalysis.declaredLevel as Level] ?? 'levelL1')}</strong>
          </div>
          <div className="gap-row">
            <span>{t('achievedLevel')}</span>
            <strong>{t(LEVEL_KEYS[gapAnalysis.achievedLevel])}</strong>
          </div>
          <div className="gap-verdict">{t(GAP_KEYS[gapAnalysis.key] ?? 'gapAccurate')}</div>
        </div>
      </section>

      {/* Development areas */}
      <section className="report-section">
        <h3>{t('candidateGrowth')}</h3>
        <ul className="dev-list">
          {developmentAreas.map((area) => (
            <li key={area} className="dev-item">
              {t(DEV_KEYS[area])}
            </li>
          ))}
        </ul>
      </section>

      {/* Route */}
      <section className="report-section">
        <h3>{t('routeTaken')}</h3>
        <div className="route-path">
          {visitedModules.map((mid, i) => {
            const mod = getModuleById(mid);
            return (
              <span key={mid}>
                {mod?.shortTitle[locale] ?? mid}
                {i < visitedModules.length - 1 && ' → '}
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}
