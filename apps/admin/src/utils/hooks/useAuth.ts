import { useAuthStore } from '@/stores/auth';

export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const authStatus = useAuthStore((state) => state.authStatus);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setAuthStatus = useAuthStore((state) => state.setAuthStatus);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  return {
    token: accessToken,
    authStatus,
    isBootstrapping: authStatus === 'bootstrapping',
    isLoggedIn: authStatus === 'authed' && !!accessToken,
    setAccessToken,
    setAuthStatus,
    clearAccessToken,
  };
};
