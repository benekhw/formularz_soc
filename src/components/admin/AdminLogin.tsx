import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useAdminStore } from '../../store/useAdminStore';
import { useState } from 'react';

export function AdminLogin() {
  const { t } = useTranslation();
  const setAuth = useAdminStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();

        if (!userInfo.email?.endsWith('@bitlife.pl')) {
          setError(t('adminAccessDenied'));
          return;
        }

        setAuth({
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          token: tokenResponse.access_token,
        });
      } catch {
        setError(t('adminLoginError'));
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError(t('adminLoginError'));
    },
    scope: 'openid email profile',
  });

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h2>{t('adminTitle')}</h2>
        <p className="admin-login-subtitle">{t('adminLoginRequired')}</p>
        <button
          className="btn btn-primary"
          onClick={() => googleLogin()}
          disabled={loading}
        >
          {loading ? 'Loading...' : t('loginWithGoogle')}
        </button>
        {error && <p className="field-error" style={{ marginTop: 12 }}>{error}</p>}
        <p className="admin-login-hint">{t('adminDomainHint')}</p>
      </div>
    </div>
  );
}
