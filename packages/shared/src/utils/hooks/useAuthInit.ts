import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { postRefresh } from '@order-ping/shared/api/auth';
import { useAuthStore } from '@order-ping/shared/stores/auth';

let hasInitialized = false;
let initPromise: Promise<void> | null = null;

export const useAuthInit = () => {
  const { pathname } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  useEffect(() => {
    if (hasInitialized || initPromise) return;
    if (accessToken || pathname === '/callback') {
      hasInitialized = true;
      return;
    }

    hasInitialized = true;
    initPromise = (async () => {
      try {
        const response = await postRefresh();
        if (response?.accessToken) {
          setAccessToken(response.accessToken);
        } else {
          clearAccessToken();
        }
      } catch {
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
    setAccessToken,
  ]);
};
