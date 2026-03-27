import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import type { Question, SingleQuestion, MultiQuestion, OpenQuestion } from '../../types/questions';
import clsx from 'clsx';

interface Props {
  question: Question;
  index: number;
}

export function QuestionCard({ question, index }: Props) {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const answers = useFormStore((s) => s.answers);
  const setAnswer = useFormStore((s) => s.setAnswer);
  const validationErrors = useFormStore((s) => s.validationErrors);

  const answer = answers[question.id] ?? {};
  const error = validationErrors[question.id];

  const renderSingle = (q: SingleQuestion) => {
    const current = (answer as { choice?: string; skipped?: boolean });
    const isSkipped = current.skipped === true;

    return (
      <div className="question-options">
        {q.options.map((opt) => (
          <label
            key={opt.id}
            className={clsx('option-label', {
              'option-selected': current.choice === opt.id && !isSkipped,
            })}
          >
            <input
              type="radio"
              name={q.id}
              checked={current.choice === opt.id && !isSkipped}
              onChange={() =>
                setAnswer(q.id, { choice: opt.id, skipped: false, confidence: (answer as { confidence?: number }).confidence ?? null })
              }
            />
            <span className="option-id">{opt.id}</span>
            <span className="option-text">{opt.text[locale]}</span>
          </label>
        ))}

        {q.confidenceEnabled && !isSkipped && current.choice && (
          <div className="confidence-block">
            <label className="confidence-label">{t('questionConfidence')}</label>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={(answer as { confidence?: number }).confidence ?? 3}
              onChange={(e) =>
                setAnswer(q.id, { ...answer, confidence: Number(e.target.value) })
              }
              className="confidence-slider"
            />
            <div className="confidence-scale">
              {[1, 2, 3, 4, 5].map((v) => (
                <span key={v} className={clsx('confidence-mark', { active: (answer as { confidence?: number }).confidence === v })}>
                  {t(`confidenceScale${v}` as 'confidenceScale1')}
                </span>
              ))}
            </div>
          </div>
        )}

        {q.confidenceEnabled && (
          <button
            type="button"
            className={clsx('btn btn-skip', { 'btn-skip-active': isSkipped })}
            onClick={() =>
              setAnswer(q.id, { choice: null, skipped: true, confidence: null })
            }
          >
            {isSkipped ? t('skippedLabel') : t('skipQuestion')}
          </button>
        )}
      </div>
    );
  };

  const renderMulti = (q: MultiQuestion) => {
    const current = (answer as { selections?: string[] });
    const selections = current.selections ?? [];

    const toggle = (optId: string) => {
      if (optId === 'A') {
        setAnswer(q.id, { selections: ['A'] });
        return;
      }
      let next = selections.filter((s) => s !== 'A');
      if (next.includes(optId)) {
        next = next.filter((s) => s !== optId);
      } else {
        next.push(optId);
      }
      setAnswer(q.id, { selections: next });
    };

    return (
      <div className="question-options">
        {q.options.map((opt) => (
          <label
            key={opt.id}
            className={clsx('option-label', {
              'option-selected': selections.includes(opt.id),
            })}
          >
            <input
              type="checkbox"
              checked={selections.includes(opt.id)}
              onChange={() => toggle(opt.id)}
            />
            <span className="option-id">{opt.id}</span>
            <span className="option-text">{opt.text[locale]}</span>
          </label>
        ))}
      </div>
    );
  };

  const renderOpen = (q: OpenQuestion) => {
    const current = (answer as { text?: string });

    return (
      <div className="question-open">
        <textarea
          value={current.text ?? ''}
          onChange={(e) => setAnswer(q.id, { text: e.target.value })}
          placeholder={q.placeholder?.[locale] ?? ''}
          rows={4}
        />
      </div>
    );
  };

  return (
    <div className={clsx('question-card', { 'question-error': error })}>
      <div className="question-header">
        <span className="question-number">{index + 1}</span>
        <p className="question-prompt">{question.prompt[locale]}</p>
      </div>

      {question.type === 'single' && renderSingle(question as SingleQuestion)}
      {question.type === 'multi' && renderMulti(question as MultiQuestion)}
      {question.type === 'open' && renderOpen(question as OpenQuestion)}

      {error && (
        <div className="question-validation">
          {error === 'open' && t('validationOpen')}
          {error === 'single' && t('validationSingle')}
          {error === 'multi' && t('validationMulti')}
        </div>
      )}
    </div>
  );
}
