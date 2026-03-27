import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';

export function TopBar() {
  const { t } = useTranslation();
  const locale = useFormStore((s) => s.locale);
  const setLocale = useFormStore((s) => s.setLocale);
  const phase = useFormStore((s) => s.phase);
  const resetSession = useFormStore((s) => s.resetSession);
  const { i18n } = useTranslation();

  const switchLang = (l: 'pl' | 'en') => {
    setLocale(l);
    i18n.changeLanguage(l);
  };

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-logo">{t('brand')}</span>
        <span className="topbar-subtitle">{t('title')}</span>
      </div>
      <div className="topbar-actions">
        <div className="lang-switch">
          <button
            className={`lang-btn ${locale === 'pl' ? 'active' : ''}`}
            onClick={() => switchLang('pl')}
          >
            PL
          </button>
          <button
            className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
            onClick={() => switchLang('en')}
          >
            EN
          </button>
        </div>
        {phase !== 'identity' && (
          <button className="btn btn-ghost" onClick={resetSession}>
            {t('resetSession')}
          </button>
        )}
      </div>
    </header>
  );
}
