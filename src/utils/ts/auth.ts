import { useAuthStore } from '@/stores/auth';

export const getAuthHeader = () => {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};
