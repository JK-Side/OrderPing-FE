import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast/useToast';
import { useAuthStore } from '@/stores/auth';
import styles from './OAuthCallback.module.scss';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const hasHandled = useRef(false);
  const REFRESH_BLOCKED_KEY = 'auth:refresh-blocked';

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const error = params.get('error');
    const message = params.get('message');

    if (accessToken) {
      sessionStorage.removeItem(REFRESH_BLOCKED_KEY);
      setAccessToken(accessToken);
      navigate('/', { replace: true });
      return;
    }

    if (error) {
      toast({
        variant: 'error',
        message: '로그인에 실패했습니다.',
        description: message || '잠시 후 다시 시도해주세요.',
      });
      navigate('/', { replace: true });
      return;
    }

    toast({
      variant: 'error',
      message: '로그인 응답이 올바르지 않습니다.',
      description: '다시 로그인해주세요.',
    });
    navigate('/', { replace: true });
  }, [navigate, setAccessToken, toast]);

  return <div className={styles.content}>로그인 처리 중...</div>;
}
