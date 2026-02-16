import { useAuthStore } from '@order-ping/shared/stores/auth';

const LOGIN_URL = import.meta.env.VITE_KAKAO_LOGIN;

export const getAuthHeader = () => {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  window.location.href = LOGIN_URL || '/';
};
