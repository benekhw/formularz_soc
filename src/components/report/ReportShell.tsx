import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import { CandidateReport } from './CandidateReport';
import { RecruiterReport } from './RecruiterReport';
import clsx from 'clsx';

export function ReportShell() {
  const { t } = useTranslation();
  const activeTab = useFormStore((s) => s.activeReportTab);
  const setTab = useFormStore((s) => s.setActiveReportTab);

  return (
    <div className="report-phase">
      <div className="report-tabs">
        <button
          className={clsx('tab-btn', { active: activeTab === 'candidate' })}
          onClick={() => setTab('candidate')}
        >
          {t('tabCandidate')}
        </button>
        <button
          className={clsx('tab-btn', { active: activeTab === 'recruiter' })}
          onClick={() => setTab('recruiter')}
        >
          {t('tabRecruiter')}
        </button>
      </div>
      <div className="report-content">
        {activeTab === 'candidate' && <CandidateReport />}
        {activeTab === 'recruiter' && <RecruiterReport />}
      </div>
    </div>
  );
}
