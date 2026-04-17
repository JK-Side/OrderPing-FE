import { useAuth } from '@/utils/hooks/useAuth';
import { useUserInfo } from '@/utils/hooks/useUserInfo';
import EmptyMain from './components/EmptyMain';
import GuestHome from './components/GuestHome';
import ReadyMain from './components/ReadyMain';
import WaitingMain from './components/WaitingMain';

export default function Home() {
  const { isLoggedIn } = useAuth();
  const { data: userInfo, isPending } = useUserInfo();

  if (!isLoggedIn) return <GuestHome />;
  if (isPending) return <WaitingMain />;

  const hasShop = (userInfo?.stores?.length ?? 0) > 0;

  if (hasShop) {
    return <ReadyMain userName={userInfo?.userName} store={userInfo?.stores?.[0]} />;
  }

  return <EmptyMain userName={userInfo?.userName} />;
}
