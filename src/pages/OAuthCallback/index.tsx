import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRefreshToken = useAuthStore((state) => state.setRefreshToken);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) return;

    setAccessToken(accessToken);
    setRefreshToken(refreshToken);

    navigate('/', { replace: true });
  }, [navigate, setAccessToken, setRefreshToken]);

  return <div>로그인 처리 중...</div>;
}
