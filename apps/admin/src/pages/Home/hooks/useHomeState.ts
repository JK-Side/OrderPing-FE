import type { UserStore } from '@/api/auth/entity';
import { useAuth } from '@/utils/hooks/useAuth';
import { useUserInfo } from '@/utils/hooks/useUserInfo';

export type HomeState =
  | { status: 'bootstrapping' }
  | { status: 'guest' }
  | { status: 'loading-user' }
  | { status: 'user-error'; error: unknown }
  | { status: 'no-store'; userName?: string }
  | { status: 'ready'; userName?: string; store: UserStore };

export const useHomeState = (): HomeState => {
  const { authStatus } = useAuth();
  const userInfoQuery = useUserInfo({ enabled: authStatus === 'authed' });

  if (authStatus === 'bootstrapping') {
    return { status: 'bootstrapping' };
  }

  if (authStatus === 'guest') {
    return { status: 'guest' };
  }

  if (userInfoQuery.isPending) {
    return { status: 'loading-user' };
  }

  if (userInfoQuery.isError) {
    return { status: 'user-error', error: userInfoQuery.error };
  }

  const userInfo = userInfoQuery.data;
  const stores = userInfo?.stores ?? [];

  if (stores.length === 0) {
    return { status: 'no-store', userName: userInfo?.userName };
  }

  const [store] = stores;

  if (!store) {
    return { status: 'no-store', userName: userInfo?.userName };
  }

  return {
    status: 'ready',
    userName: userInfo?.userName,
    store,
  };
};
