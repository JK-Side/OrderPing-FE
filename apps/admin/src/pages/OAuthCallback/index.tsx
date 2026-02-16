import { useAuthStore } from '@order-ping/shared/stores/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const accessToken = params.get('accessToken');

    if (!accessToken) return;

    setAccessToken(accessToken);

    navigate('/', { replace: true });
  }, [navigate, setAccessToken]);

  return <div>로그인 처리 중...</div>;
}
