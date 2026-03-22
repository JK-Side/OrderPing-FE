import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/Toast/useToast';
import { useAuthStore } from '@/stores/auth';
import styles from './OAuthCallback.module.scss';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
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
      clearAccessToken();
      toast({
        variant: 'error',
        message: '\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.',
        description: message || '\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.',
      });
      navigate('/', { replace: true });
      return;
    }

    clearAccessToken();
    toast({
      variant: 'error',
      message: '\uB85C\uADF8\uC778 \uC751\uB2F5\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
      description: '\uB2E4\uC2DC \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694.',
    });
    navigate('/', { replace: true });
  }, [clearAccessToken, navigate, setAccessToken, toast]);

  return <div className={styles.content}>{'\uB85C\uADF8\uC778 \uCC98\uB9AC \uC911...'}</div>;
}
