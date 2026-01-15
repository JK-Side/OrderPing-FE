import { useState } from 'react';
import { AUTH_TOKEN_KEY } from '@/constants/auth';

export const useAuth = () => {
  const [token] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_KEY),
  );

  return {
    token,
    isLoggedIn: !!token,
  };
};
