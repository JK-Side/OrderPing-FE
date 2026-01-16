import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { postRefresh } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import { redirectToLogin } from '@/utils/ts/auth';

let hasInitialized = false;
let initPromise: Promise<void> | null = null;

export const useAuthInit = () => {
  const { pathname } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRefreshToken = useAuthStore((state) => state.setRefreshToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const clearRefreshToken = useAuthStore((state) => state.clearRefreshToken);

  useEffect(() => {
    if (hasInitialized || initPromise) return;
    if (accessToken || pathname === '/callback') {
      hasInitialized = true;
      return;
    }
    if (!refreshToken) return;

    hasInitialized = true;
    initPromise = (async () => {
      try {
        const response = await postRefresh(refreshToken);
        if (response?.accessToken) {
          setAccessToken(response.accessToken);
          if (response.refreshToken) {
            setRefreshToken(response.refreshToken);
          }
        } else {
          clearAccessToken();
          clearRefreshToken();
          redirectToLogin();
        }
      } catch {
        if (!useAuthStore.getState().accessToken) {
          clearAccessToken();
          clearRefreshToken();
          redirectToLogin();
        }
      } finally {
        initPromise = null;
      }
    })();
  }, [
    accessToken,
    clearAccessToken,
    clearRefreshToken,
    pathname,
    refreshToken,
    setAccessToken,
    setRefreshToken,
  ]);
};
