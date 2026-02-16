import { useAuthStore } from '@order-ping/shared/stores/auth';

export const useAuth = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);
  const clearAccessToken = useAuthStore((state) => state.clearAccessToken);

  return {
    token: accessToken,
    isLoggedIn: !!accessToken,
    setAccessToken,
    clearAccessToken,
  };
};
