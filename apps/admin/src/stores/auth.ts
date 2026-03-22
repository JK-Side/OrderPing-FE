import { create } from 'zustand';

export type AuthStatus = 'bootstrapping' | 'authed' | 'guest';

interface AuthState {
  accessToken: string | null;
  authStatus: AuthStatus;
  setAccessToken: (accessToken: string | null) => void;
  setAuthStatus: (authStatus: AuthStatus) => void;
  clearAccessToken: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  authStatus: 'bootstrapping',
  setAccessToken: (accessToken) =>
    set({
      accessToken,
      authStatus: accessToken ? 'authed' : 'guest',
    }),
  setAuthStatus: (authStatus) => set({ authStatus }),
  clearAccessToken: () =>
    set({
      accessToken: null,
      authStatus: 'guest',
    }),
}));
