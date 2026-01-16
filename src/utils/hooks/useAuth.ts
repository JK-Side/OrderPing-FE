import { useAuthStore } from '@/stores/auth';

export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const setRefreshToken = useAuthStore((state) => state.setRefreshToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);
  const clearRefreshToken = useAuthStore((state) => state.clearRefreshToken);

  return {
    token: accessToken,
    isLoggedIn: !!accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    clearAccessToken,
    clearRefreshToken,
  };
};
