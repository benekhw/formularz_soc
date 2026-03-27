import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import { getModuleById, getQuestionsByModule } from '../../data/questionBank';
import { Stepper } from './Stepper';
import { QuestionCard } from './QuestionCard';

export function ModuleView() {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const currentModuleId = useFormStore((s) => s.currentModuleId);
  const discoveredRoute = useFormStore((s) => s.discoveredRoute);
  const submitModule = useFormStore((s) => s.submitModule);
  const finishForm = useFormStore((s) => s.finishForm);

  const mod = getModuleById(currentModuleId);
  const questions = getQuestionsByModule(currentModuleId);
  const isLastInRoute = discoveredRoute[discoveredRoute.length - 1] === currentModuleId;

  if (!mod) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = submitModule();
    if (next === null) {
      // Form is done or last module
      finishForm();
    }
  };

  return (
    <div className="module-phase">
      <Stepper />
      <div className="module-content">
        <div className="module-header">
          <h2>{mod.title[locale]}</h2>
          <p className="module-desc">{mod.description[locale]}</p>
          {mod.thresholdPercent != null && (
            <span className="module-threshold-badge">
              {t('moduleThreshold')}: {mod.thresholdPercent}%
            </span>
          )}
          {mod.thresholdPercent == null && (
            <span className="module-threshold-badge muted">
              {t('moduleNoThreshold')}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="questions-list">
            {questions.map((q, i) => (
              <QuestionCard key={q.id} question={q} index={i} />
            ))}
          </div>

          <div className="module-actions">
            <button type="submit" className="btn btn-primary">
              {currentModuleId === 'M6' || isLastInRoute ? t('finish') : t('continue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
