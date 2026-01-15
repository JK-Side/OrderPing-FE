import { useUserInfo } from '@/utils/hooks/useUserInfo';
import EmptyMain from './EmptyMain';
import ReadyMain from './ReadyMain';

export default function AuthedHome() {
  const { data: userInfo } = useUserInfo();
  const hasShop = (userInfo?.stores?.length ?? 0) > 0;

  return (
    <>
      {hasShop ? (
        <ReadyMain userName={userInfo?.userName} store={userInfo?.stores?.[0]} />
      ) : (
        <EmptyMain />
      )}
    </>
  );
}
