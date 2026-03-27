import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useFormStore } from '../../store/useFormStore';
import type { CandidateIdentity } from '../../types/identity';

export function IdentityForm() {
  const { t } = useTranslation();
  const submitIdentity = useFormStore((s) => s.submitIdentity);
  const continents = t('continents').split(',');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CandidateIdentity>();

  const onSubmit = (data: CandidateIdentity) => {
    submitIdentity(data);
  };

  return (
    <div className="identity-phase">
      <div className="identity-intro">
        <h1>{t('brand')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
        <p className="lead">{t('introLead')}</p>
        <p className="meta">{t('introMeta')}</p>
      </div>

      <form className="identity-form" onSubmit={handleSubmit(onSubmit)}>
        <h2>{t('identityHeading')}</h2>
        <p className="form-hint">{t('identitySubheading')}</p>

        <div className="form-field">
          <label>{t('fieldFirstName')}</label>
          <input
            {...register('firstName', { required: t('validationRequired') })}
            type="text"
            autoComplete="given-name"
          />
          {errors.firstName && <span className="field-error">{errors.firstName.message}</span>}
        </div>

        <div className="form-field">
          <label>{t('fieldLastName')}</label>
          <input
            {...register('lastName', { required: t('validationRequired') })}
            type="text"
            autoComplete="family-name"
          />
          {errors.lastName && <span className="field-error">{errors.lastName.message}</span>}
        </div>

        <div className="form-field">
          <label>{t('fieldEmail')}</label>
          <input
            {...register('email', {
              required: t('validationRequired'),
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('validationEmail') },
            })}
            type="email"
            autoComplete="email"
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </div>

        <div className="form-field">
          <label>{t('fieldContinent')}</label>
          <select {...register('continent', { required: t('validationRequired') })}>
            <option value="">—</option>
            {continents.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.continent && <span className="field-error">{errors.continent.message}</span>}
        </div>

        <div className="form-field">
          <label>{t('fieldCountry')}</label>
          <input
            {...register('country', { required: t('validationRequired') })}
            type="text"
            autoComplete="country-name"
          />
          {errors.country && <span className="field-error">{errors.country.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary">
          {t('start')}
        </button>
      </form>
    </div>
  );
}
