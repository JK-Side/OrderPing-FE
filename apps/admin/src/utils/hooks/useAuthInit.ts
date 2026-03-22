import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { postLogout, postRefresh } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

let hasInitialized = false;
let initPromise: Promise<void> | null = null;
const REFRESH_BLOCKED_KEY = 'auth:refresh-blocked';

export const useAuthInit = () => {
  const { pathname } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setAuthStatus = useAuthStore((state) => state.setAuthStatus);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  useEffect(() => {
    if (hasInitialized || initPromise) return;
    if (sessionStorage.getItem(REFRESH_BLOCKED_KEY) === '1') {
      hasInitialized = true;
      clearAccessToken();
      return;
    }
    if (accessToken) {
      hasInitialized = true;
      sessionStorage.removeItem(REFRESH_BLOCKED_KEY);
      setAuthStatus('authed');
      return;
    }
    if (pathname === '/callback') {
      hasInitialized = true;
      setAuthStatus('guest');
      return;
    }

    hasInitialized = true;
    setAuthStatus('bootstrapping');
    initPromise = (async () => {
      try {
        const response = await postRefresh();
        if (response?.accessToken) {
          sessionStorage.removeItem(REFRESH_BLOCKED_KEY);
          setAccessToken(response.accessToken);
        } else {
          clearAccessToken();
        }
      } catch (error) {
        const status = Number((error as { status?: number | string })?.status);
        if (status >= 400 && status < 500) {
          sessionStorage.setItem(REFRESH_BLOCKED_KEY, '1');
          try {
            await postLogout({ skipAuth: true, skipRefresh: true });
          } catch {
            // Ignore cleanup failures; token state is already cleared.
          }
        }
        if (!useAuthStore.getState().accessToken) {
          clearAccessToken();
        }
      } finally {
        initPromise = null;
      }
    })();
  }, [
    accessToken,
    clearAccessToken,
    pathname,
    setAuthStatus,
    setAccessToken,
  ]);
};
