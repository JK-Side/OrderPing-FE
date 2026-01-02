import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) return;

    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

    navigate('/', { replace: true });
  }, [navigate]);

  return <div>로그인 처리 중...</div>;
}
