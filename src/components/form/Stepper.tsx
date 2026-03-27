import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import { getModuleById } from '../../data/questionBank';
import clsx from 'clsx';

export function Stepper() {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const discoveredRoute = useFormStore((s) => s.discoveredRoute);
  const currentModuleId = useFormStore((s) => s.currentModuleId);
  const completedModules = useFormStore((s) => s.completedModules);

  return (
    <nav className="stepper">
      <div className="stepper-label">{t('activePath')}</div>
      <div className="stepper-hint">{t('pathHint')}</div>
      <ol className="stepper-list">
        {discoveredRoute.map((mid) => {
          const mod = getModuleById(mid);
          if (!mod) return null;
          const isCurrent = mid === currentModuleId;
          const isCompleted = completedModules.includes(mid);

          return (
            <li
              key={mid}
              className={clsx('stepper-item', {
                'stepper-current': isCurrent,
                'stepper-done': isCompleted,
              })}
            >
              <span className="stepper-dot" />
              <span className="stepper-text">
                {mod.shortTitle[locale]}
              </span>
              {mod.thresholdPercent != null && (
                <span className="stepper-threshold">
                  {mod.thresholdPercent}%
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
